
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, BarChart3, Users, MapPin, Building, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';

const DEFAULT_STATES = [
  "ANDAMAN AND NICOBAR ISLANDS",
  "ANDHRA PRADESH",
  "ARUNACHAL PRADESH",
  "ASSAM",
  "BIHAR",
  "CHANDIGARH",
  "CHHATTISGARH",
  "DELHI",
  "GOA",
  "GUJARAT",
  "HARYANA",
  "HIMACHAL PRADESH",
  "JAMMU AND KASHMIR",
  "JHARKHAND",
  "KARNATAKA",
  "KERALA",
  "LADAKH",
  "LAKSHADWEEP",
  "MADHYA PRADESH",
  "MAHARASHTRA",
  "MANIPUR",
  "MEGHALAYA",
  "MIZORAM",
  "NAGALAND",
  "ODISHA",
  "PUDUCHERRY",
  "PUNJAB",
  "RAJASTHAN",
  "SIKKIM",
  "TAMIL NADU",
  "TELANGANA",
  "THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  "TRIPURA",
  "UTTAR PRADESH",
  "UTTARAKHAND",
  "WEST BENGAL"
];

const NGODarpan = () => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

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

  // Fetch unique types with proper filtering
  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ['ngo-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Darpan_NGO')
        .select('Type')
        .not('Type', 'is', null)
        .order('Type');
      
      if (error) throw error;

      // Clean and normalize types
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
      // Use exact match for type filter
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

  // Prepare chart data
  const stateChartData = React.useMemo(() => {
    if (!allFilteredData.length) return [];
    
    const stateCounts = allFilteredData.reduce((acc, item) => {
      const state = item.State || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allFilteredData]);

  const typeChartData = React.useMemo(() => {
    if (!allFilteredData.length) return [];
    
    const typeCounts = allFilteredData.reduce((acc, item) => {
      const type = item.Type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allFilteredData]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allFilteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NGO Darpan Data');
    XLSX.writeFile(workbook, 'ngo_darpan_data.xlsx');
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(allFilteredData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ngo_darpan_data.json';
    link.click();
    URL.revokeObjectURL(url);
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

  const isInitialLoading = statesLoading || typesLoading;
  const isDataLoading = dataLoading || chartDataLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header Skeleton */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
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

        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="text-xl text-gray-300">Loading NGO Darpan Dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-4">
              <img 
                src="https://sandnetwork.in/wp-content/uploads/2024/02/sand-logo.png" 
                alt="SAND Network Logo" 
                className="h-10 sm:h-12 w-auto"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">NGO Darpan Dashboard</h1>
                <p className="text-gray-400 text-sm">Official NGO registry data</p>
              </div>
            </Link>
          </div>
          <Link to="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total NGOs</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                ) : (
                  allFilteredData.length.toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">States</CardTitle>
              <MapPin className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                ) : (
                  new Set(allFilteredData.map(item => item.State).filter(Boolean)).size
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Districts</CardTitle>
              <Building className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                ) : (
                  new Set(allFilteredData.map(item => item.District).filter(Boolean)).size
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                ) : (
                  new Set(allFilteredData.map(item => item.Type).filter(Boolean)).size
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription className="text-gray-400">
              Filter NGO data by state, district, and type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                    {DEFAULT_STATES.map((state) => (
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
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={exportToExcel} 
                className="bg-green-600 hover:bg-green-700"
                disabled={!allFilteredData.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button 
                onClick={exportToJSON} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!allFilteredData.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">NGOs by State</CardTitle>
              <CardDescription className="text-gray-400">Top 10 states by NGO count</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : (
                <ChartContainer config={{}} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="state" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">NGOs by Type</CardTitle>
              <CardDescription className="text-gray-400">Distribution by organization type</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : (
                <ChartContainer config={{}} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                        fontSize={12}
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">NGO Data Preview</CardTitle>
            <CardDescription className="text-gray-400">
              {isDataLoading ? (
                "Loading data..."
              ) : (
                `Showing ${paginatedData?.data.length || 0} of ${paginatedData?.totalCount || 0} records`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-gray-700" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300 min-w-[200px]">NGO Name</TableHead>
                        <TableHead className="text-gray-300 min-w-[120px]">State</TableHead>
                        <TableHead className="text-gray-300 min-w-[120px]">District</TableHead>
                        <TableHead className="text-gray-300 min-w-[150px]">Type</TableHead>
                        <TableHead className="text-gray-300 min-w-[120px]">Registration No</TableHead>
                        <TableHead className="text-gray-300 min-w-[200px]">Sectors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData?.data.map((ngo, index) => (
                        <TableRow key={index} className="border-gray-700 hover:bg-gray-750">
                          <TableCell className="text-white font-medium">
                            {ngo["Name of NPO"] || 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-300">{ngo.State || 'N/A'}</TableCell>
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

                {/* Pagination */}
                {paginatedData && paginatedData.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(paginatedData.totalPages, currentPage + 1))}
                            className={currentPage === paginatedData.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
