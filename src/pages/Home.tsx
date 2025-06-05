
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Database, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
              SAND ONE
            </h1>
            <p className="text-2xl text-gray-600 font-medium">
              Your Smart Data Hub
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              SAND ONE is a unified platform that hosts structured and filterable datasets, 
              empowering data-driven decision making across various domains.
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => document.getElementById('datasets')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Datasets
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Dataset Cards Section */}
      <section id="datasets" className="px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Available Datasets</h2>
            <p className="text-xl text-gray-600">
              Discover comprehensive datasets for research and analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Census 2011 Dataset */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">🗺️ Census 2011</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  India's official population and housing census dataset with comprehensive 
                  demographic insights across states, districts, and sub-districts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium">All India</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium">Population, Literacy, Employment</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">Structured & Filterable</span>
                  </div>
                </div>
                <Link to="/census-2011">
                  <Button className="w-full group-hover:bg-blue-700">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* NGO Darpan Dataset */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-green-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">🏢 NGO Darpan</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Comprehensive database of registered NGOs and civil society organizations 
                  across India with detailed organizational information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium">All India</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium">Organization Details, Sectors</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">Structured & Filterable</span>
                  </div>
                </div>
                <Link to="/darpan-ngo">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Open Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Indian Panchayat Dataset - Coming Soon */}
            <Card className="group opacity-75 border-2 border-dashed border-gray-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Database className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-600">🏛️ Indian Panchayat</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed text-gray-500">
                  Rural governance data including Panchayati Raj institutions, 
                  local government structures, and administrative boundaries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coverage:</span>
                    <span className="font-medium text-gray-500">All India</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Data Points:</span>
                    <span className="font-medium text-gray-500">Governance, Administration</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium text-amber-600">Coming Soon</span>
                  </div>
                </div>
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">SAND ONE</h3>
              <p className="text-gray-300 leading-relaxed">
                Empowering data-driven decision making through comprehensive, 
                structured, and accessible datasets.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">API Access</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 SAND ONE Data Centre. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
