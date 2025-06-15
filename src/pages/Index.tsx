import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, Users, MapPin, Building2, Github, Mail, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const scrollToDatasets = () => {
    const datasetsSection = document.getElementById('datasets');
    datasetsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const datasets = [
    {
      id: 'census-2011',
      title: 'Census 2011',
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      description: "India's official population and housing census dataset with comprehensive demographic data.",
      status: 'available',
      route: '/census-2011',
      stats: '100K+ Records',
      features: ['Population Data', 'Housing Statistics', 'Demographic Analysis', 'State-wise Filtering']
    },
    {
      id: 'ngo-darpan',
      title: 'NGO Darpan',
      icon: <Users className="h-8 w-8 text-green-500" />,
      description: 'Official data from NGO Darpan portal filtered by region and type.',
      status: 'available',
      route: '/ngo-darpan',
      stats: '100K+ Records',
      features: ['NGO Registry', 'Activity Mapping', 'Geographic Distribution', 'Sector Analysis']
    },
    {
      id: 'indian-panchayat',
      title: 'Indian Panchayat',
      icon: <Building2 className="h-8 w-8 text-amber-500" />,
      description: 'Local governance data including panchayat information and rural administration details.',
      status: 'coming-soon',
      route: '#',
      stats: 'Coming Soon',
      features: ['Panchayat Directory', 'Administrative Levels', 'Rural Governance', 'Development Programs']
    }
  ];

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
              <h1 className="text-2xl font-bold text-white">ONE</h1>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#datasets" className="text-gray-300 hover:text-white transition-colors">Datasets</a>
            <a href="/auto-analyze" className="text-gray-300 hover:text-white transition-colors">Auto Analyze</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent mb-6">
              SAND ONE
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 font-medium mb-4">
              Your Smart Data Hub
            </p>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              SAND ONE is a unified platform that hosts structured and filterable datasets, 
              empowering data-driven decision making across various domains.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={scrollToDatasets}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Explore Datasets
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-500 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500 rounded-full blur-xl"></div>
        </div>
      </section>

      {/* Datasets Section */}
      <section id="datasets" className="py-20 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Available Datasets</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore our comprehensive collection of structured datasets designed for analysis and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {datasets.map((dataset) => (
              <Card 
                key={dataset.id} 
                className="bg-gray-800 border-gray-700 hover:border-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    {dataset.icon}
                    <Badge 
                      variant={dataset.status === 'available' ? 'default' : 'secondary'}
                      className={dataset.status === 'available' ? 'bg-green-600' : 'bg-gray-600'}
                    >
                      {dataset.status === 'available' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-xl">{dataset.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {dataset.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-sm text-blue-400 font-medium">
                    {dataset.stats}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Key Features:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {dataset.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {dataset.status === 'available' ? (
                    <Link to={dataset.route}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Open Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full bg-gray-700 text-gray-400 cursor-not-allowed">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-12">SAND ONE Feature</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Filtering</h3>
              <p className="text-gray-400">Powerful server-side filtering capabilities for efficient data exploration.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Geographic Insights</h3>
              <p className="text-gray-400">Location-based data analysis with state, district, and sub-district levels.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">User-Friendly</h3>
              <p className="text-gray-400">Intuitive interface designed for both analysts and general users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src="https://sandnetwork.in/wp-content/uploads/2024/02/sand-logo.png" 
                  alt="SAND Network Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">ONE</h3>                </div>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering data-driven decisions through accessible, structured datasets and powerful analytics tools.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#datasets" className="hover:text-white transition-colors">Datasets</a></li>
                {/*<li><a href="#about" className="hover:text-white transition-colors">About</a></li> */}
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#terms" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#github" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="h-6 w-6" />
                </a>
                <a href="#email" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-6 w-6" />
                </a>
                <a href="#docs" className="text-gray-400 hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SAND Network. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
