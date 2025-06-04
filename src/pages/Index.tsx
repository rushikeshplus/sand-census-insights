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

interface CensusData {
  State: number;
  District: number;
  Subdistt: number;
  'Town/Village': number;
  Level: string;
  Name: string;
  No_HH: number;
  TOT_P: number;
  TOT_M: number;
  TOT_F: number;
  TOT_WORK_P: number;
  TOT_WORK_M: number;
  TOT_WORK_F: number;
  P_LIT: number;
  P_ILL: number;
  TRU: string;
  StateName?: string;
  [key: string]: any;
}

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
  const [allData, setAllData] = useState<CensusData[]>([]);
  const [filteredData, setFilteredData] = useState<CensusData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Simple filters
  const [levelFilter, setLevelFilter] = useState('All');
  const [truFilter, setTruFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [minPopulation, setMinPopulation] = useState('');
  const [maxPopulation, setMaxPopulation] = useState('');
  const [minHouseholds, setMinHouseholds] = useState('');
  const [maxHouseholds, setMaxHouseholds] = useState('');

  // Hierarchical location filters - Add missing state variables
  const [selectedStateCode, setSelectedStateCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedSubdistCode, setSelectedSubdistCode] = useState<number | null>(null);

  // Fetch ALL data without any limit
  const { data: rawData = [], isLoading: isLoadingData, error } = useQuery({
    queryKey: ['censusData'],
    queryFn: async () => {
      console.log('Fetching ALL census data from database...');
      const { data, error } = await supabase
        .from('Cencus_2011')
        .select('*')
        .order('Name');
      
      if (error) {
        console.error('Error fetching census data:', error);
        throw error;
      }
      console.log('Complete census data fetched:', data?.length, 'records');
      return data as CensusData[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Initialize data with state names
  useEffect(() => {
    if (rawData.length > 0) {
      const dataWithStateNames = rawData.map(item => ({
        ...item,
        StateName: STATE_MAPPING[item.State] || `Unknown State (${item.State})`
      }));
      setAllData(dataWithStateNames);
      setFilteredData(dataWithStateNames);
    }
  }, [rawData]);

  // Apply filters whenever filter values change
  useEffect(() => {
    let filtered = [...allData];

    // Level filter
    if (levelFilter !== 'All') {
      filtered = filtered.filter(d => d.Level === levelFilter);
    }

    // TRU filter
    if (truFilter !== 'All') {
      filtered = filtered.filter(d => d.TRU === truFilter);
    }

    // State filter
    if (stateFilter !== 'All') {
      filtered = filtered.filter(d => d.StateName === stateFilter);
    }

    // Population range filter
    if (minPopulation) {
      const min = parseInt(minPopulation);
      if (!isNaN(min)) {
        filtered = filtered.filter(d => (d.TOT_P || 0) >= min);
      }
    }
    if (maxPopulation) {
      const max = parseInt(maxPopulation);
      if (!isNaN(max)) {
        filtered = filtered.filter(d => (d.TOT_P || 0) <= max);
      }
    }

    // Households range filter
    if (minHouseholds) {
      const min = parseInt(minHouseholds);
      if (!isNaN(min)) {
        filtered = filtered.filter(d => (d.No_HH || 0) >= min);
      }
    }
    if (maxHouseholds) {
      const max = parseInt(maxHouseholds);
      if (!isNaN(max)) {
        filtered = filtered.filter(d => (d.No_HH || 0) <= max);
      }
    }

    // Hierarchical location filters
    if (selectedStateCode) {
      filtered = filtered.filter(d => d.State === selectedStateCode);
    }
    if (selectedDistrictCode) {
      filtered = filtered.filter(d => d.District === selectedDistrictCode);
    }
    if (selectedSubdistCode) {
      filtered = filtered.filter(d => d.Subdistt === selectedSubdistCode);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [levelFilter, truFilter, stateFilter, minPopulation, maxPopulation, minHouseholds, maxHouseholds, selectedStateCode, selectedDistrictCode, selectedSubdistCode, allData]);

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
    setStateFilter('All');
    setMinPopulation('');
    setMaxPopulation('');
    setMinHouseholds('');
    setMaxHouseholds('');
    setSelectedStateCode(null);
    setSelectedDistrictCode(null);
    setSelectedSubdistCode(null);
  };

  const availableLevels = ['DISTRICT', 'STATE', 'SUB-DISTRICT', 'VILLAGE'];
  const availableTRU = ['Rural', 'Urban', 'Total'];
  const availableStates = [...new Set(allData.map(item => item.StateName))].filter(Boolean).sort();

  // Show loading screen while data is being fetched
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Complete Database</h2>
          <p className="text-gray-400">Please wait while we fetch all census records...</p>
          <div className="mt-4 text-sm text-gray-500">
            This may take a few moments to load the complete dataset
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
        </div>
      </div>
    );
  }

  const stateOptions = React.useMemo(() => {
    return allData
      .filter(d => d.District === 0 && d.Subdistt === 0 && d['Town/Village'] === 0)
      .map(d => ({ name: d.Name, code: d.State }));
  }, [allData]);

  const districtOptions = React.useMemo(() => {
    if (!selectedStateCode) return [];
    return allData
      .filter(d => d.State === selectedStateCode && d.District !== 0 && d.Subdistt === 0)
      .map(d => ({ name: d.Name, code: d.District }));
  }, [allData, selectedStateCode]);

  const subdistOptions = React.useMemo(() => {
    if (!selectedStateCode || !selectedDistrictCode) return [];
    return allData
      .filter(d =>
        d.State === selectedStateCode &&
        d.District === selectedDistrictCode &&
        d.Subdistt !== 0 &&
        d['Town/Village'] === 0
      )
      .map(d => ({ name: d.Name, code: d.Subdistt }));
  }, [allData, selectedStateCode, selectedDistrictCode]);

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
              <p className="text-gray-400 text-sm">Census 2011 Data Explorer - Complete Database</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Total Records:</span>
            <span className="text-sm text-green-400">{allData.length.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Simple Filters Section */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">🔍 Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    <SelectItem value="All" className="text-white">All States</SelectItem>
                    {availableStates.map((state) => (
                      <SelectItem key={state} value={state} className="text-white">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <p><span className="text-amber-400">Level:</span> {levelFilter}</p>
                  <p><span className="text-amber-400">Area Type:</span> {truFilter}</p>
                  <p><span className="text-amber-400">State:</span> {stateFilter}</p>
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
                📋 Complete Census Data Table
              </span>
              <span className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No data found for the selected filters</div>
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

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2024 SAND Network. Complete Census 2011 database. Built with Supabase & React.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
