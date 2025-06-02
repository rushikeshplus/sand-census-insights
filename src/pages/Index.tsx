
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, BarChart3, Users, Home, MapPin } from 'lucide-react';
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
  [key: string]: any;
}

const Index = () => {
  const { toast } = useToast();
  const [allData, setAllData] = useState<CensusData[]>([]);
  const [filteredData, setFilteredData] = useState<CensusData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [metricRange, setMetricRange] = useState<[number, number]>([0, 100]);

  // Available options
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [subdistricts, setSubdistricts] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  // Fetch all data once
  const { data: rawData = [], isLoading: isLoadingData } = useQuery({
    queryKey: ['allCensusData'],
    queryFn: async () => {
      console.log('Fetching all census data...');
      const { data, error } = await supabase
        .from('Cencus_2011')
        .select('*')
        .order('Name');
      
      if (error) {
        console.error('Error fetching census data:', error);
        throw error;
      }
      console.log('All census data fetched:', data?.length, 'records');
      return data as CensusData[];
    }
  });

  // Initialize data and states when raw data loads
  useEffect(() => {
    if (rawData.length > 0) {
      setAllData(rawData);
      setFilteredData(rawData);

      // Extract states (Level = 'STATE' and TRU = 'Total')
      const stateList = [...new Set(
        rawData
          .filter(r => r.Level === 'STATE' && r.TRU === 'Total')
          .map(r => r.Name)
          .filter(name => name && name.trim() !== '') // Filter out empty or null names
      )].sort();
      setStates(stateList);
    }
  }, [rawData]);

  // Apply filters whenever selection changes
  useEffect(() => {
    let filtered = [...allData];

    if (selectedState) {
      // Find state record
      const stateObj = allData.find(d => d.Name === selectedState && d.Level === 'STATE' && d.TRU === 'Total');
      if (stateObj) {
        // Filter by state code
        filtered = filtered.filter(d => d.State === stateObj.State);

        // Update districts for this state (Level = 'DISTRICT' and TRU = 'Total')
        const districtList = [...new Set(
          filtered
            .filter(d => d.Level === 'DISTRICT' && d.TRU === 'Total')
            .map(d => d.Name)
            .filter(name => name && name.trim() !== '') // Filter out empty or null names
        )].sort();
        setDistricts(districtList);
      }
    }

    if (selectedDistrict && selectedDistrict !== 'All') {
      // Find district record
      const districtObj = filtered.find(d => d.Name === selectedDistrict && d.Level === 'DISTRICT' && d.TRU === 'Total');
      if (districtObj) {
        filtered = filtered.filter(d => d.District === districtObj.District);
      }
    }

    if (selectedState) {
      // Update subdistricts (Level = 'SUB-DISTRICT' and TRU = 'Total')
      const subdistrictList = [...new Set(
        filtered
          .filter(d => d.Level === 'SUB-DISTRICT' && d.TRU === 'Total')
          .map(d => d.Name)
          .filter(name => name && name.trim() !== '') // Filter out empty or null names
      )].sort();
      setSubdistricts(subdistrictList);
    }

    if (selectedSubdistrict && selectedSubdistrict !== 'All') {
      // Find subdistrict record
      const subdistrictObj = filtered.find(d => d.Name === selectedSubdistrict && d.Level === 'SUB-DISTRICT' && d.TRU === 'Total');
      if (subdistrictObj) {
        filtered = filtered.filter(d => d.Subdistt === subdistrictObj.Subdistt);
      }
    }

    // Apply level filter
    if (selectedLevel && selectedLevel !== 'All') {
      if (selectedLevel === 'Rural') {
        filtered = filtered.filter(d => d.TRU === 'Rural');
      } else if (selectedLevel === 'Urban') {
        filtered = filtered.filter(d => d.TRU === 'Urban');
      } else {
        filtered = filtered.filter(d => d.Level === selectedLevel);
      }
    }

    // Update available levels
    const levelList = [...new Set(
      filtered
        .map(d => d.Level)
        .filter(level => level && level.trim() !== '') // Filter out empty or null levels
    )].sort();
    setLevels(levelList);

    // Apply metric range filter
    if (selectedMetric && filtered.length > 0) {
      const [min, max] = metricRange;
      filtered = filtered.filter(d => {
        const value = d[selectedMetric];
        return value != null && value >= min && value <= max;
      });
    }

    // For final display, exclude high-level aggregations if we have a state selected
    if (selectedState) {
      filtered = filtered.filter(d => !['STATE', 'DISTRICT', 'SUB-DISTRICT'].includes(d.Level));
    }

    setFilteredData(filtered.slice(0, 1000)); // Limit to 1000 records for performance
  }, [selectedState, selectedDistrict, selectedSubdistrict, selectedLevel, selectedMetric, metricRange, allData]);

  // Calculate summary metrics
  const summaryMetrics = {
    totalRecords: filteredData.length,
    totalHouseholds: filteredData.reduce((sum, item) => sum + (item.No_HH || 0), 0),
    totalPopulation: filteredData.reduce((sum, item) => sum + (item.TOT_P || 0), 0),
    totalWorkers: filteredData.reduce((sum, item) => sum + (item.TOT_WORK_P || 0), 0),
    totalLiterate: filteredData.reduce((sum, item) => sum + (item.P_LIT || 0), 0)
  };

  // Prepare chart data
  const chartData = filteredData.slice(0, 10).map(item => ({
    name: item.Name?.substring(0, 20) + (item.Name?.length > 20 ? '...' : ''),
    population: item.TOT_P || 0,
    households: item.No_HH || 0,
    metric: selectedMetric ? item[selectedMetric] || 0 : 0
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

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      Name: item.Name || '',
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
    XLSX.writeFile(workbook, `census_data_${selectedState}_${Date.now()}.xlsx`);

    toast({
      title: "Download Complete",
      description: "Census data has been downloaded successfully"
    });
  };

  const resetFilters = () => {
    setSelectedDistrict('All');
    setSelectedSubdistrict('All');
    setSelectedLevel('All');
    setSelectedMetric('');
    setMetricRange([0, 100]);
  };

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
    if (metric && filteredData.length > 0) {
      const values = filteredData.map(d => d[metric]).filter(v => v != null && v >= 0);
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        setMetricRange([min, max]);
      }
    }
  };

  const availableMetrics = ['No_HH', 'TOT_P', 'TOT_WORK_P', 'P_LIT'];
  const currentMetricMax = selectedMetric && filteredData.length > 0 
    ? Math.max(...filteredData.map(d => d[selectedMetric]).filter(v => v != null && v >= 0))
    : 100;

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
              <p className="text-gray-400 text-sm">Census 2011 Data Explorer</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Data Source:</span>
            <span className="text-sm text-green-400">Supabase Live Database</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters Section */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-amber-400" />
              📍 Geographic Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">State *</Label>
                <Select value={selectedState} onValueChange={(value) => {
                  setSelectedState(value);
                  resetFilters();
                }}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {states.map((state) => (
                      <SelectItem key={state} value={state} className="text-white hover:bg-gray-600">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">District</Label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedState}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="All" className="text-white hover:bg-gray-600">All Districts</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district} className="text-white hover:bg-gray-600">
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Subdistrict</Label>
                <Select value={selectedSubdistrict} onValueChange={setSelectedSubdistrict} disabled={!selectedState}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select Subdistrict" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="All" className="text-white hover:bg-gray-600">All Subdistricts</SelectItem>
                    {subdistricts.map((subdistrict) => (
                      <SelectItem key={subdistrict} value={subdistrict} className="text-white hover:bg-gray-600">
                        {subdistrict}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Area Type</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="All" className="text-white hover:bg-gray-600">All Areas</SelectItem>
                    <SelectItem value="Rural" className="text-white hover:bg-gray-600">Rural</SelectItem>
                    <SelectItem value="Urban" className="text-white hover:bg-gray-600">Urban</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level} value={level} className="text-white hover:bg-gray-600">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label className="text-gray-300">Filter by Metric</Label>
                <Select value={selectedMetric} onValueChange={handleMetricChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select Metric" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="" className="text-white hover:bg-gray-600">No Filter</SelectItem>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric} value={metric} className="text-white hover:bg-gray-600">
                        {metric === 'No_HH' ? 'Households' : 
                         metric === 'TOT_P' ? 'Population' :
                         metric === 'TOT_WORK_P' ? 'Workers' :
                         metric === 'P_LIT' ? 'Literate' : metric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMetric && (
                <div className="md:col-span-1">
                  <Label className="text-gray-300">
                    {selectedMetric} Range: {metricRange[0].toLocaleString()} - {metricRange[1].toLocaleString()}
                  </Label>
                  <div className="mt-2">
                    <Slider
                      value={metricRange}
                      onValueChange={(value) => setMetricRange(value as [number, number])}
                      max={currentMetricMax}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-end">
                <Button 
                  onClick={resetFilters}
                  variant="outline" 
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        {selectedState && (
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
        )}

        {selectedState && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-green-400" />
                  📈 Top 10 Areas {selectedMetric ? `by ${selectedMetric}` : 'by Population'}
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
                    <Bar dataKey={selectedMetric || "population"} fill="#1AAB68" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Download and Actions */}
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
                    <p><span className="text-amber-400">State:</span> {selectedState}</p>
                    <p><span className="text-amber-400">District:</span> {selectedDistrict}</p>
                    <p><span className="text-amber-400">Subdistrict:</span> {selectedSubdistrict}</p>
                    <p><span className="text-amber-400">Area Type:</span> {selectedLevel}</p>
                    <p><span className="text-amber-400">Metric Filter:</span> {selectedMetric || 'None'}</p>
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
        )}

        {/* Data Table */}
        {selectedState && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                  📋 Census Data Table
                </span>
                <span className="text-sm text-gray-400">
                  Showing {filteredData.length} records {filteredData.length >= 1000 ? '(limited to 1000)' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="text-center py-8 text-gray-400">Loading data...</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No data found for the selected filters</div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">Level</TableHead>
                        <TableHead className="text-gray-300">Population</TableHead>
                        <TableHead className="text-gray-300">Male</TableHead>
                        <TableHead className="text-gray-300">Female</TableHead>
                        <TableHead className="text-gray-300">Households</TableHead>
                        <TableHead className="text-gray-300">Workers</TableHead>
                        <TableHead className="text-gray-300">Literate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((row, index) => (
                        <TableRow key={index} className="border-gray-600">
                          <TableCell className="text-white">{row.Name}</TableCell>
                          <TableCell className="text-gray-300">{row.Level}</TableCell>
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
              )}
            </CardContent>
          </Card>
        )}

        {!selectedState && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <MapPin className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Welcome to SAND ONE</h3>
              <p className="text-gray-400">Select a state to begin exploring the 2011 Census data</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2024 SAND Network. Census 2011 data sourced from Government of India. Built with Supabase & React.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
