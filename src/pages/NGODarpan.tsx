
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, Filter, BarChart3, Users, MapPin, Building, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';

const NGODarpan = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartView, setChartView] = useState('state'); // 'state' or 'district'
  const recordsPerPage = 50;

  // Fetch unique states
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['ngo-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Darpan_NGO')
        .select('State')
        .not('State', 'is', null)
        .order('State');
      
      if (error) throw error;
      
      const uniqueStates = [...new Set(data.map(item => item.State))];
      return uniqueStates.filter(Boolean);
    },
  });

  // Fetch districts based on selected state
  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['ngo-districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      
      const { data, error } = await supabase
        .from('Darpan_NGO')
        .select('District')
        .eq('State', selectedState)
        .not('District', 'is', null)
        .order('District');
      
      if (error) throw error;
      
      const uniqueDistricts = [...new Set(data.map(item => item.District))];
      return uniqueDistricts.filter(Boolean);
    },
    enabled: !!selectedState,
  });

  // Fetch unique types
  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ['ngo-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Darpan_NGO')
        .select('Type')
        .not('Type', 'is', null)
        .order('Type');
      
      if (error) throw error;

      const cleanTypes = data
        .map(item => (item.Type || '').trim())
        .filter(type => type.length > 0);
      
      const uniqueTypes = [...new Set(cleanTypes)];
      return uniqueTypes.sort((a, b) => a.localeCompare(b));
    },
  });

  // Build query based on filters
  const buildQuery = () => {
    let query = supabase
      .from('Darpan_NGO')
      .select('*', { count: 'exact' });
    
    if (selectedState) {
      query = query.eq('State', selectedState);
    }
    if (selectedDistrict) {
      query = query.eq('District', selectedDistrict);
    }
    if (selectedType) {
      query = query.eq('Type', selectedType);
    }
    
    return query;
  };

  // Fetch filtered data with pagination
  const { data: paginatedData, isLoading: dataLoading } = useQuery({
    queryKey: ['ngo-data', selectedState, selectedDistrict, selectedType, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * recordsPerPage;
      const to = from + recordsPerPage - 1;
      
      const { data, error, count } = await buildQuery()
        .range(from, to)
        .order('Name of NPO');
      
      if (error) throw error;
      
      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / recordsPerPage)
      };
    },
  });

  // Fetch all filtered data for charts and export
  const { data: allFilteredData = [], isLoading: chartDataLoading } = useQuery({
    queryKey: ['ngo-all-data', selectedState, selectedDistrict, selectedType],
    queryFn: async () => {
      const { data, error } = await buildQuery().order('Name of NPO');
      if (error) throw error;
      return data || [];
    },
  });

  // Prepare chart data based on selected view
  const chartData = React.useMemo(() => {
    if (!allFilteredData.length) return [];
    
    const groupBy = chartView === 'state' ? 'State' : 'District';
    const counts = allFilteredData.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allFilteredData, chartView]);

  // Export to CSV
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(allFilteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NGO Darpan Data');
    XLSX.writeFile(workbook, 'ngo_darpan_data.xlsx');
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedType('');
    setCurrentPage(1);
  };

  // Reset district when state changes
  useEffect(() => {
    setSelectedDistrict('');
    setCurrentPage(1);
  }, [selectedState]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDistrict, selectedType]);

  // Calculate summary metrics
  const summaryMetrics = {
    totalRecords: allFilteredData.length,
    totalStates: new Set(allFilteredData.map(item => item.State).filter(Boolean)).size,
    totalDistricts: new Set(allFilteredData.map(item => item.District).filter(Boolean)).size,
    totalTypes: new Set(allFilteredData.map(item => item.Type).filter(Boolean)).size,
  };

  // Pagination
  const totalPages = paginatedData?.totalPages || 1;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;

  const isInitialLoading = statesLoading || typesLoading;
  const isDataLoading = dataLoading || chartDataLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header Skeleton */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded bg-gray-700" />
              <div>
                <Skeleton className="h-8 w-48 mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-32 bg-gray-700" />
              </div>
            </div>
            <Skeleton className="h-10 w-24 bg-gray-700" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20 bg-gray-700" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading Message */}
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-12 w-12 animate-spin text-green-400" />
              <span className="text-2xl font-bold text-white mb-2">Loading NGO Darpan Dashboard</span>
            </div>
          </div>
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
            <Link to="/" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="border-l border-gray-600 pl-4">
              <img 
                src="https://sandnetwork.in/wp-content/uploads/2024/02/sand-logo.png" 
                alt="SAND Network Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NGO Darpan Dashboard</h1>
              <p className="text-gray-400 text-sm">Official NGO registry data</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    {states.map((state) => (
                      <SelectItem key={state} value={state} className="text-white hover:bg-gray-600">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">District</label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={setSelectedDistrict} 
                  disabled={!selectedState || districtsLoading}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={
                      !selectedState ? "Select State first" : 
                      districtsLoading ? "Loading..." : 
                      "Select District"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    {districts.map((district) => (
                      <SelectItem key={district} value={district} className="text-white hover:bg-gray-600">
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    {types.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-gray-600">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={resetFilters}
                  variant="outline" 
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button 
                onClick={exportToCSV} 
                className="bg-green-600 hover:bg-green-700"
                disabled={!allFilteredData.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Download as Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          <Card className="bg-green-900/20 border-green-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm">🗺️ States</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalStates.toLocaleString()}</p>
                </div>
                <MapPin className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm">🏢 Districts</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalDistricts.toLocaleString()}</p>
                </div>
                <Building className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/20 border-blue-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm">📋 Types</p>
                  <p className="text-2xl font-bold text-white">{summaryMetrics.totalTypes.toLocaleString()}</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-green-400" />
                    📈 Top 10 NGOs by {chartView === 'state' ? 'State' : 'District'}
                  </CardTitle>
                </div>
                <Select value={chartView} onValueChange={setChartView}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="state" className="text-white hover:bg-gray-600">By State</SelectItem>
                    <SelectItem value="district" className="text-white hover:bg-gray-600">By District</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                </div>
              ) : (
                <ChartContainer config={{}} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
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
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#1AAB68" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Export */}
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
                  <p><span className="text-amber-400">State:</span> {selectedState || 'All States'}</p>
                  <p><span className="text-amber-400">District:</span> {selectedDistrict || 'All Districts'}</p>
                  <p><span className="text-amber-400">Type:</span> {selectedType || 'All Types'}</p>
                  <p><span className="text-amber-400">Records:</span> {summaryMetrics.totalRecords}</p>
                </div>
              </div>
              <Button 
                onClick={exportToCSV}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={allFilteredData.length === 0}
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
                📋 NGO Data Table
              </span>
              <span className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, paginatedData?.totalCount || 0)} of {paginatedData?.totalCount || 0} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="text-center py-8 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-2" />
                Loading data...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-gray-300">NGO Name</TableHead>
                        <TableHead className="text-gray-300">State</TableHead>
                        <TableHead className="text-gray-300">District</TableHead>
                        <TableHead className="text-gray-300">Type</TableHead>
                        <TableHead className="text-gray-300">Registration No</TableHead>
                        <TableHead className="text-gray-300">Sectors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData?.data.map((ngo, index) => (
                        <TableRow key={index} className="border-gray-600">
                          <TableCell className="text-white">{ngo["Name of NPO"] || 'N/A'}</TableCell>
                          <TableCell className="text-blue-400">{ngo.State || 'N/A'}</TableCell>
                          <TableCell className="text-gray-300">{ngo.District || 'N/A'}</TableCell>
                          <TableCell className="text-gray-300">{ngo.Type || 'N/A'}</TableCell>
                          <TableCell className="text-gray-300">{ngo["Reg no"] || 'N/A'}</TableCell>
                          <TableCell className="text-gray-300 max-w-xs truncate">
                            {ngo["Sectors working in"] || 'N/A'}
                          </TableCell>
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
};

export default NGODarpan;
