import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, BarChart3, Users, Home, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';

type CensusData = Tables<'Cencus_2011'> & {
  StateName?: string;
};

// State mapping based on the provided table
const STATE_MAPPING: Record<number, string> = {
  1: 'JAMMU & KASHMIR',
  2: 'HIMACHAL PRADESH',
  3: 'PUNJAB',
  4: 'CHANDIGARH',
  5: 'UTTARAKHAND',
  6: 'HARYANA',
  7: 'NCT OF DELHI',
  8: 'RAJASTHAN',
  9: 'UTTAR PRADESH',
  10: 'Bihar',
  11: 'SIKKIM',
  12: 'ARUNACHAL PRADESH',
  13: 'NAGALAND',
  14: 'Manipur',
  15: 'MIZORAM',
  16: 'TRIPURA',
  17: 'MEGHALAYA',
  18: 'Assam',
  19: 'WEST BENGAL',
  20: 'JHARKHAND',
  21: 'ODISHA',
  22: 'CHHATTISGARH',
  23: 'MADHYA PRADESH',
  24: 'GUJARAT',
  25: 'DAMAN & DIU',
  26: 'DADRA & NAGAR HAVELI',
  27: 'MAHARASHTRA',
  28: 'ANDHRA PRADESH',
  29: 'KARNATAKA',
  30: 'Goa',
  31: 'LAKSHADWEEP',
  32: 'Kerala',
  33: 'TAMIL NADU',
  34: 'PUDUCHERRY',
  35: 'ANDAMAN & NICOBAR ISLANDS'
};

const Index = () => {
  const { toast } = useToast();
  const [filteredData, setFilteredData] = useState<CensusData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Simple filters
  const [levelFilter, setLevelFilter] = useState('All');
  const [truFilter, setTruFilter] = useState('All');
  const [selectedStateCode, setSelectedStateCode] = useState<number | null>(null);
  const [minPopulation, setMinPopulation] = useState('');
  const [maxPopulation, setMaxPopulation] = useState('');
  const [minHouseholds, setMinHouseholds] = useState('');
  const [maxHouseholds, setMaxHouseholds] = useState('');

  // Hierarchical location filters
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedSubdistCode, setSelectedSubdistCode] = useState<number | null>(null);

  // Query to fetch unique states from database
  const { data: availableStates = [] } = useQuery({
    queryKey: ['availableStates'],
    queryFn: async () => {
      console.log('Fetching available states from database...');
      
      const { data, error } = await supabase
        .from('Cencus_2011')
        .select('State')
        .not('State', 'is', null)
        .order('State');
      
      if (error) {
        console.error('Error fetching states:', error);
        throw error;
      }

      // Get unique state codes and filter out any null/undefined values
      const uniqueStates = [...new Set(data.map(item => item.State))]
        .filter((state): state is number => state !== null && state !== undefined)
        .sort((a, b) => a - b);

      console.log('Available states fetched:', uniqueStates);
      return uniqueStates;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Server-side filtering query
  const { data: rawData = [], isLoading: isLoadingData, error } = useQuery({
    queryKey: ['censusData', selectedStateCode, levelFilter, truFilter, minPopulation, maxPopulation, minHouseholds, maxHouseholds, selectedDistrictCode, selectedSubdistCode],
    queryFn: async () => {
      console.log('Fetching filtered census data from database...');
      
      let query = supabase
        .from('Cencus_2011')
        .select('*')
        .order('Name');

      // Apply state filter
      if (selectedStateCode) {
        query = query.eq('State', selectedStateCode);
      }

      // Apply level filter
      if (levelFilter !== 'All') {
        query = query.eq('Level', levelFilter);
      }

      // Apply TRU filter
      if (truFilter !== 'All') {
        query = query.eq('TRU', truFilter);
      }

      // Apply population filters
      if (minPopulation) {
        query = query.gte('TOT_P', parseInt(minPopulation));
      }
      if (maxPopulation) {
        query = query.lte('TOT_P', parseInt(maxPopulation));
      }

      // Apply household filters
      if (minHouseholds) {
        query = query.gte('No_HH', parseInt(minHouseholds));
      }
      if (maxHouseholds) {
        query = query.lte('No_HH', parseInt(maxHouseholds));
      }

      // Apply district filter
      if (selectedDistrictCode) {
        query = query.eq('District', selectedDistrictCode);
      }

      // Apply subdistrict filter
      if (selectedSubdistCode) {
        query = query.eq('Subdistt', selectedSubdistCode);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching census data:', error);
        throw error;
      }

      console.log('Filtered census data fetched:', data?.length, 'records');
      return data as CensusData[];
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: true, // Always enabled, will fetch all data if no filters applied
  });

  // Separate query for district options when state is selected
  const { data: districtData = [] } = useQuery({
    queryKey: ['districtOptions', selectedStateCode],
    queryFn: async () => {
      if (!selectedStateCode) return [];
      
      const { data, error } = await supabase
        .from('Cencus_2011')
        .select('District, Name')
        .eq('State', selectedStateCode)
        .neq('District', 0)
        .eq('Subdistt', 0)
        .order('Name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateCode,
    staleTime: 5 * 60 * 1000,
  });

  // Separate query for subdistrict options when district is selected
  const { data: subdistData = [] } = useQuery({
    queryKey: ['subdistOptions', selectedStateCode, selectedDistrictCode],
    queryFn: async () => {
      if (!selectedStateCode || !selectedDistrictCode) return [];
      
      const { data, error } = await supabase
        .from('Cencus_2011')
        .select('Subdistt, Name')
        .eq('State', selectedStateCode)
        .eq('District', selectedDistrictCode)
        .neq('Subdistt', 0)
        .eq('Town/Village', 0)
        .order('Name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStateCode && !!selectedDistrictCode,
    staleTime: 5 * 60 * 1000,
  });

  // Process options for dropdowns using React.useMemo
  const stateOptions = React.useMemo(() => {
    return availableStates
      .filter(stateCode => STATE_MAPPING[stateCode]) // Only include states that exist in our mapping
      .map(stateCode => ({
        code: stateCode,
        name: STATE_MAPPING[stateCode]
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort by name alphabetically
  }, [availableStates]);

  const districtOptions = React.useMemo(() => {
    if (!selectedStateCode) return [];
    const seen = new Set();
    return districtData
      .filter(d => {
        if (seen.has(d.District)) return false;
        seen.add(d.District);
        return true;
      })
      .map(d => ({ name: d.Name, code: d.District }));
  }, [districtData, selectedStateCode]);

  const subdistOptions = React.useMemo(() => {
    if (!selectedStateCode || !selectedDistrictCode) return [];
    const seen = new Set();
    return subdistData
      // The query already filters by State and District, so no need to check here
      .filter(d => {
        if (seen.has(d.Subdistt)) return false;
        seen.add(d.Subdistt);
        return true;
      })
      .map(d => ({ name: d.Name, code: d.Subdistt }));
  }, [subdistData, selectedStateCode, selectedDistrictCode]);

  // Initialize data with state names
  useEffect(() => {
    if (rawData.length > 0) {
      const dataWithStateNames = rawData.map(item => ({
        ...item,
        StateName: STATE_MAPPING[item.State || 0] || `Unknown State (${item.State})`
      }));
      setFilteredData(dataWithStateNames);
      setCurrentPage(1); // Reset to first page when data changes
    } else {
      setFilteredData([]);
    }
  }, [rawData]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (selectedStateCode) {
      setSelectedDistrictCode(null);
      setSelectedSubdistCode(null);
    }
  }, [selectedStateCode]);

  useEffect(() => {
    if (selectedDistrictCode) {
      setSelectedSubdistCode(null);
    }
  }, [selectedDistrictCode]);

  // Calculate summary metrics
  const summaryMetrics = {
    totalRecords: filteredData.length,
    totalHouseholds: filteredData.reduce((sum, item) => sum + (item.No_HH || 0), 0),
    totalPopulation: filteredData.reduce((sum, item) => sum + (item.TOT_P || 0), 0),
    totalWorkers: filteredData.reduce((sum, item) => sum + (item.TOT_WORK_P || 0), 0),
    totalLiterate: filteredData.reduce((sum, item) => sum + (item.P_LIT || 0), 0)
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Chart data
  const chartData = filteredData.slice(0, 10).map(item => ({
    name: item.Name?.substring(0, 15) + (item.Name?.length > 15 ? '...' : ''),
    population: item.TOT_P || 0,
    households: item.No_HH || 0
  }));

  const downloadExcel = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to download",
        variant: "destructive"
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      Name: item.Name || '',
      State: item.StateName || '',
      Level: item.Level || '',
      'Total Population': item.TOT_P || 0,
      Male: item.TOT_M || 0,
      Female: item.TOT_F || 0,
      Households: item.No_HH || 0,
      Workers: item.TOT_WORK_P || 0,
      Literate: item.P_LIT || 0,
      TRU: item.TRU || ''
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CensusData');
    XLSX.writeFile(workbook, `census_data_filtered_${Date.now()}.xlsx`);

    toast({
      title: "Download Complete",
      description: "Census data has been downloaded successfully"
    });
  };

  const clearFilters = () => {
    setLevelFilter('All');
    setTruFilter('All');
    setSelectedStateCode(null);
    setMinPopulation('');
    setMaxPopulation('');
    setMinHouseholds('');
    setMaxHouseholds('');
    setSelectedDistrictCode(null);
    setSelectedSubdistCode(null);
  };

  const availableLevels = ['DISTRICT', 'STATE', 'SUB-DISTRICT', 'VILLAGE'];
  const availableTRU = ['Rural', 'Urban', 'Total'];

  // Show loading screen while data is being fetched
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Census Data</h2>
          <p className="text-gray-400">Fetching filtered records from database...</p>
          <div className="mt-4 text-sm text-gray-500">
            {selectedStateCode ? `Loading data for ${STATE_MAPPING[selectedStateCode]}` : 'Loading complete dataset'}
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400">There was an error fetching the census data. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <img 
              src="https://sandnetwork.in/wp-content/uploads/2024/02/sand-logo.png" 
              alt="SAND Network Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">SAND ONE</h1>
              <p className="text-gray-400 text-sm">Census 2011 Data Explorer - Server-Side Filtering</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Filtered Records:</span>
            <span className="text-sm text-green-400">{summaryMetrics.totalRecords.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters Section */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">🔍 Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">State</Label>
                <Select 
                  value={selectedStateCode?.toString() || "all"} 
                  onValueChange={(value) => setSelectedStateCode(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    <SelectItem value="all" className="text-white">All States</SelectItem>
                    {stateOptions.map((state) => (
                      <SelectItem 
                        key={state.code} 
                        value={state.code.toString()} 
                        className="text-white"
                      >
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStateCode && (
                <div>
                  <Label className="text-gray-300">District</Label>
                  <Select 
                    value={selectedDistrictCode?.toString() || "all"} 
                    onValueChange={(value) => setSelectedDistrictCode(value === "all" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                      <SelectItem value="all" className="text-white">All Districts</SelectItem>
                      {districtOptions
                        .filter(district => district.code && district.name) // Filter out invalid entries
                        .map((district) => (
                          <SelectItem key={district.code} value={district.code.toString()} className="text-white">
                            {district.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedStateCode && selectedDistrictCode && (
                <div>
                  <Label className="text-gray-300">Sub-District</Label>
                  <Select 
                    value={selectedSubdistCode?.toString() || "all"} 
                    onValueChange={(value) => setSelectedSubdistCode(value === "all" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="All Sub-Districts" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                      <SelectItem value="all" className="text-white">All Sub-Districts</SelectItem>
                      {subdistOptions
                        .filter(subdist => subdist.code && subdist.name) // Filter out invalid entries
                        .map((subdist) => (
                          <SelectItem key={subdist.code} value={subdist.code.toString()} className="text-white">
                            {subdist.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-gray-300">Level</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="All" className="text-white">All Levels</SelectItem>
                    {availableLevels.map((level) => (
                      <SelectItem key={level} value={level} className="text-white">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Area Type</Label>
                <Select value={truFilter} onValueChange={setTruFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="All" className="text-white">All Areas</SelectItem>
                    {availableTRU.map((tru) => (
                      <SelectItem key={tru} value={tru} className="text-white">
                        {tru}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Min Population</Label>
                <Input
                  type="number"
                  value={minPopulation}
                  onChange={(e) => setMinPopulation(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Max Population</Label>
                <Input
                  type="number"
                  value={maxPopulation}
                  onChange={(e) => setMaxPopulation(e.target.value)}
                  placeholder="No limit"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Min Households</Label>
                <Input
                  type="number"
                  value={minHouseholds}
                  onChange={(e) => setMinHouseholds(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Max Households</Label>
                <Input
                  type="number"
                  value={maxHouseholds}
                  onChange={(e) => setMaxHouseholds(e.target.value)}
                  placeholder="No limit"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={clearFilters}
                  variant="outline" 
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-red-900/20 border-red-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm">📊 Records</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalRecords.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/20 border-amber-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-400 text-sm">🏠 Households</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalHouseholds.toLocaleString()}</p>
                </div>
                <Home className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm">👥 Population</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalPopulation.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm">💼 Workers</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalWorkers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm">📚 Literate</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalLiterate.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-green-400" />
                📈 Top 10 Areas by Population
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="population" fill="#1AAB68" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Download */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Download className="mr-2 h-5 w-5 text-amber-400" />
                💾 Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Current Selection Summary</h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="text-amber-400">State:</span> {selectedStateCode ? STATE_MAPPING[selectedStateCode] : 'All States'}</p>
                  <p><span className="text-amber-400">Level:</span> {levelFilter}</p>
                  <p><span className="text-amber-400">Area Type:</span> {truFilter}</p>
                  <p><span className="text-amber-400">Population Range:</span> {minPopulation || '0'} - {maxPopulation || '∞'}</p>
                  <p><span className="text-amber-400">Records:</span> {summaryMetrics.totalRecords}</p>
                </div>
              </div>
              <Button 
                onClick={downloadExcel}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={filteredData.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download as Excel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Table with Pagination */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                📋 Census Data Table
              </span>
              <span className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {isLoadingData ? 'Loading data...' : 'No data found for the selected filters'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">State</TableHead>
                        <TableHead className="text-gray-300">Level</TableHead>
                        <TableHead className="text-gray-300">TRU</TableHead>
                        <TableHead className="text-gray-300">Population</TableHead>
                        <TableHead className="text-gray-300">Male</TableHead>
                        <TableHead className="text-gray-300">Female</TableHead>
                        <TableHead className="text-gray-300">Households</TableHead>
                        <TableHead className="text-gray-300">Workers</TableHead>
                        <TableHead className="text-gray-300">Literate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((row, index) => (
                        <TableRow key={index} className="border-gray-600">
                          <TableCell className="text-white">{row.Name}</TableCell>
                          <TableCell className="text-blue-400">{row.StateName}</TableCell>
                          <TableCell className="text-gray-300">{row.Level}</TableCell>
                          <TableCell className="text-gray-300">{row.TRU}</TableCell>
                          <TableCell className="text-green-400">{(row.TOT_P || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-blue-400">{(row.TOT_M || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-pink-400">{(row.TOT_F || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-amber-400">{(row.No_HH || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-purple-400">{(row.TOT_WORK_P || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-cyan-400">{(row.P_LIT || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <span className="text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Index;