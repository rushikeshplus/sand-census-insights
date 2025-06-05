
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

// State mapping for consistent naming
const STATE_MAPPING: { [key: string]: string } = {
  'ANDAMAN & NICOBAR ISLANDS': 'Andaman & Nicobar Islands',
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'ARUNACHAL PRADESH': 'Arunachal Pradesh',
  'ASSAM': 'Assam',
  'BIHAR': 'Bihar',
  'CHANDIGARH': 'Chandigarh',
  'CHHATTISGARH': 'Chhattisgarh',
  'DADRA & NAGAR HAVELI': 'Dadra & Nagar Haveli',
  'DAMAN & DIU': 'Daman & Diu',
  'DELHI': 'Delhi',
  'GOA': 'Goa',
  'GUJARAT': 'Gujarat',
  'HARYANA': 'Haryana',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'JAMMU & KASHMIR': 'Jammu & Kashmir',
  'JHARKHAND': 'Jharkhand',
  'KARNATAKA': 'Karnataka',
  'KERALA': 'Kerala',
  'LADAKH': 'Ladakh',
  'LAKSHADWEEP': 'Lakshadweep',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'MAHARASHTRA': 'Maharashtra',
  'MANIPUR': 'Manipur',
  'MEGHALAYA': 'Meghalaya',
  'MIZORAM': 'Mizoram',
  'NAGALAND': 'Nagaland',
  'ODISHA': 'Odisha',
  'PUDUCHERRY': 'Puducherry',
  'PUNJAB': 'Punjab',
  'RAJASTHAN': 'Rajasthan',
  'SIKKIM': 'Sikkim',
  'TAMIL NADU': 'Tamil Nadu',
  'TELANGANA': 'Telangana',
  'TRIPURA': 'Tripura',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UTTARAKHAND': 'Uttarakhand',
  'WEST BENGAL': 'West Bengal'
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347'];

const DarpanNGO = () => {
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch NGO data
  const { data: ngoData, isLoading } = useQuery({
    queryKey: ['ngo-data'],
    queryFn: async () => {
      console.log('Fetching NGO data...');
      const { data, error } = await supabase
        .from('Darpan_NGO')
        .select('*');
      
      if (error) {
        console.error('Error fetching NGO data:', error);
        throw error;
      }
      
      console.log('NGO data fetched:', data?.length, 'records');
      return data || [];
    }
  });

  // Get unique values for dropdowns
  const uniqueStates = useMemo(() => {
    if (!ngoData) return [];
    const states = [...new Set(ngoData.map(item => item.State).filter(Boolean))];
    return states.sort();
  }, [ngoData]);

  const uniqueDistricts = useMemo(() => {
    if (!ngoData) return [];
    let filteredData = ngoData;
    
    if (selectedState !== 'all') {
      filteredData = filteredData.filter(item => item.State === selectedState);
    }
    
    const districts = [...new Set(filteredData.map(item => item.District).filter(Boolean))];
    return districts.sort();
  }, [ngoData, selectedState]);

  const uniqueTypes = useMemo(() => {
    if (!ngoData) return [];
    const types = [...new Set(ngoData.map(item => item.Type).filter(Boolean))];
    return types.sort();
  }, [ngoData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!ngoData) return [];
    
    return ngoData.filter(item => {
      const stateMatch = selectedState === 'all' || item.State === selectedState;
      const districtMatch = selectedDistrict === 'all' || item.District === selectedDistrict;
      const typeMatch = selectedType === 'all' || item.Type === selectedType;
      
      return stateMatch && districtMatch && typeMatch;
    });
  }, [ngoData, selectedState, selectedDistrict, selectedType]);

  // Chart data
  const stateWiseData = useMemo(() => {
    if (!filteredData) return [];
    
    const stateCount = filteredData.reduce((acc, item) => {
      const state = item.State || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stateCount)
      .map(([state, count]) => ({ 
        name: STATE_MAPPING[state] || state, 
        value: count 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 states
  }, [filteredData]);

  const typeWiseData = useMemo(() => {
    if (!filteredData) return [];
    
    const typeCount = filteredData.reduce((acc, item) => {
      const type = item.Type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCount)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Export functions
  const exportToCSV = () => {
    if (!filteredData.length) return;
    
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NGO Data');
    
    const filename = `ngo_darpan_data_${selectedState !== 'all' ? selectedState + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportToJSON = () => {
    if (!filteredData.length) return;
    
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ngo_darpan_data_${selectedState !== 'all' ? selectedState + '_' : ''}${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetFilters = () => {
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedType('all');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">NGO Darpan Dashboard</h1>
          <p className="text-xl text-gray-600">
            Comprehensive insights into India's registered NGOs and civil society organizations
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-600">Total NGOs: </span>
              <span className="font-bold text-blue-600">{filteredData.length.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-600">States Covered: </span>
              <span className="font-bold text-green-600">{uniqueStates.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter NGO data by location and organization type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {uniqueStates.map(state => (
                      <SelectItem key={state} value={state}>
                        {STATE_MAPPING[state] || state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {uniqueDistricts.map(district => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button onClick={resetFilters} variant="outline" className="w-full">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 States by NGO Count</CardTitle>
              <CardDescription>Distribution of NGOs across Indian states</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "NGO Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateWiseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NGO Types Distribution</CardTitle>
              <CardDescription>Breakdown by organization type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeWiseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeWiseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download filtered NGO data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export as Excel
              </Button>
              <Button onClick={exportToJSON} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export as JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>NGO Data Preview</CardTitle>
            <CardDescription>
              Showing {filteredData.length} of {ngoData?.length || 0} NGOs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name of NPO</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Registration No</TableHead>
                    <TableHead>Sectors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 100).map((ngo, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{ngo["Name of NPO"] || 'N/A'}</TableCell>
                      <TableCell>{STATE_MAPPING[ngo.State || ''] || ngo.State || 'N/A'}</TableCell>
                      <TableCell>{ngo.District || 'N/A'}</TableCell>
                      <TableCell>{ngo.Type || 'N/A'}</TableCell>
                      <TableCell>{ngo["Reg no"] || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{ngo["Sectors working in"] || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData.length > 100 && (
                <div className="text-center py-4 text-sm text-gray-600">
                  Showing first 100 records. Use filters or export to see all data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DarpanNGO;
