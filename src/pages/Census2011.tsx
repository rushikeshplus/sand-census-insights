import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, MapPin, TrendingUp, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CensusData {
  id: number;
  state_name: string;
  district_name: string;
  sub_district_name: string;
  town_village_name: string;
  ward_name: string;
  eb_name: string;
  total_population: number;
  male_population: number;
  female_population: number;
  households: number;
  literates: number;
  illiterates: number;
  workers: number;
  non_workers: number;
}

const Census2011 = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Fetch available states on component mount
  React.useEffect(() => {
    const fetchStates = async () => {
      const { data, error } = await supabase
        .from('census_2011_data')
        .select('state_name')
        .distinct()
        .order('state_name', { ascending: true });

      if (error) {
        console.error("Error fetching states:", error);
        return;
      }

      if (data) {
        setAvailableStates(data.map(item => item.state_name));
      }
    };

    fetchStates();
  }, []);

  // Fetch available districts when a state is selected
  React.useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState) {
        setAvailableDistricts([]);
        return;
      }

      const { data, error } = await supabase
        .from('census_2011_data')
        .select('district_name')
        .eq('state_name', selectedState)
        .distinct()
        .order('district_name', { ascending: true });

      if (error) {
        console.error("Error fetching districts:", error);
        return;
      }

      if (data) {
        setAvailableDistricts(data.map(item => item.district_name));
      }
    };

    fetchDistricts();
  }, [selectedState]);

  const { data: censusData = [], isLoading, error } = useQuery<CensusData[]>({
    queryKey: ['census-data', searchTerm, selectedState, selectedDistrict],
    queryFn: async (): Promise<CensusData[]> => {
      let query = supabase.from('census_2011_data').select('*');
      
      if (searchTerm) {
        query = query.or(`town_village_name.ilike.%${searchTerm}%,district_name.ilike.%${searchTerm}%,state_name.ilike.%${searchTerm}%`);
      }
      
      if (selectedState) {
        query = query.eq('state_name', selectedState);
      }
      
      if (selectedDistrict) {
        query = query.eq('district_name', selectedDistrict);
      }
      
      query = query.limit(50);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white px-4 py-8">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="text-primary w-8 h-8" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Census 2011 Data</h1>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by village, district, or state..."
            className="bg-gray-800 border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="bg-gray-800 border-gray-700 text-white rounded px-4 py-2"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict(""); // Reset district when state changes
            }}
          >
            <option value="">All States</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            className="bg-gray-800 border-gray-700 text-white rounded px-4 py-2"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState}
          >
            <option value="">All Districts</option>
            {availableDistricts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* Data Display */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              <Users className="mr-2 inline-block h-5 w-5" />
              Census Data
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-500">Error: {error.message}</div>
            ) : censusData.length === 0 ? (
              <div className="text-gray-400">No data found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2">State</th>
                    <th className="px-4 py-2">District</th>
                    <th className="px-4 py-2">Village/Town</th>
                    <th className="px-4 py-2">Total Population</th>
                    <th className="px-4 py-2">Households</th>
                    <th className="px-4 py-2">Literates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {censusData.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2">{row.state_name}</td>
                      <td className="px-4 py-2">{row.district_name}</td>
                      <td className="px-4 py-2">{row.town_village_name}</td>
                      <td className="px-4 py-2">{row.total_population}</td>
                      <td className="px-4 py-2">{row.households}</td>
                      <td className="px-4 py-2">{row.literates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">
                <MapPin className="mr-2 inline-block h-5 w-5" />
                Total States
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-blue-500 text-white">{availableStates.length}</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">
                <TrendingUp className="mr-2 inline-block h-5 w-5" />
                Districts (in selected state)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-500 text-white">{availableDistricts.length}</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">
                <Users className="mr-2 inline-block h-5 w-5" />
                Total Records (up to 50)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-purple-500 text-white">{censusData.length}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Census2011;
