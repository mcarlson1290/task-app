import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Sprout, Package, BarChart3, AlertTriangle, 
  Lightbulb, Calendar, Target, Zap 
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

export const ProductionDashboard: React.FC = () => {
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCrop, setSelectedCrop] = useState('all');
  
  // Production metrics
  const productionMetrics = useMemo(() => ({
    totalTraysActive: 342,
    totalPlantsGrowing: 15648,
    harvestReadyToday: 28,
    projectedHarvestThisWeek: 156,
    avgYieldPerTray: 2.3, // lbs
    yieldEfficiency: 94.2 // % of expected yield
  }), []);
  
  // Production trend data
  const productionTrend = useMemo(() => [
    { date: '3/1', planted: 45, harvested: 42, yield: 96.6 },
    { date: '3/8', planted: 52, harvested: 48, yield: 115.2 },
    { date: '3/15', planted: 48, harvested: 46, yield: 105.8 },
    { date: '3/22', planted: 55, harvested: 51, yield: 122.4 },
    { date: '3/29', planted: 50, harvested: 47, yield: 108.1 },
  ], []);
  
  // Crop distribution
  const cropDistribution = useMemo(() => [
    { name: 'Romaine Lettuce', value: 35, trays: 120, color: '#10b981' },
    { name: 'Arugula', value: 25, trays: 86, color: '#3b82f6' },
    { name: 'Broccoli Microgreens', value: 20, trays: 68, color: '#f59e0b' },
    { name: 'Basil', value: 15, trays: 51, color: '#8b5cf6' },
    { name: 'Other', value: 5, trays: 17, color: '#6b7280' }
  ], []);
  
  // Yield vs Expected
  const yieldComparison = useMemo(() => [
    { crop: 'Romaine', expected: 2.5, actual: 2.4, efficiency: 96 },
    { crop: 'Arugula', expected: 1.8, actual: 1.9, efficiency: 105 },
    { crop: 'Broccoli MG', expected: 0.75, actual: 0.72, efficiency: 96 },
    { crop: 'Basil', expected: 1.2, actual: 1.1, efficiency: 92 },
  ], []);
  
  // Waste metrics
  const wasteData = useMemo(() => [
    { week: 'W1', planted: 180, harvested: 172, wasted: 8, wasteRate: 4.4 },
    { week: 'W2', planted: 195, harvested: 188, wasted: 7, wasteRate: 3.6 },
    { week: 'W3', planted: 175, harvested: 165, wasted: 10, wasteRate: 5.7 },
    { week: 'W4', planted: 190, harvested: 183, wasted: 7, wasteRate: 3.7 },
  ], []);
  
  // Growth stage distribution
  const growthStages = useMemo(() => [
    { stage: 'Seeded', count: 45, percentage: 13, color: '#fbbf24' },
    { stage: 'Germinating', count: 62, percentage: 18, color: '#a3e635' },
    { stage: 'Growing', count: 185, percentage: 54, color: '#22c55e' },
    { stage: 'Ready', count: 50, percentage: 15, color: '#3b82f6' }
  ], []);

  const upcomingHarvests = useMemo(() => [
    { date: 'Today', crop: 'Romaine', trays: 12, yield: '30 lbs' },
    { date: 'Tomorrow', crop: 'Arugula', trays: 8, yield: '14.4 lbs' },
    { date: 'Mar 3', crop: 'Broccoli MG', trays: 15, yield: '11.25 lbs' },
    { date: 'Mar 4', crop: 'Basil', trays: 6, yield: '7.2 lbs' },
  ], []);

  const insights = useMemo(() => [
    {
      icon: TrendingUp,
      title: 'Yield Trending Up',
      description: 'Arugula yields are 5% above expected for the past 2 weeks',
      type: 'positive'
    },
    {
      icon: AlertTriangle,
      title: 'Basil Underperforming',
      description: 'Basil yields are 8% below target. Check pH levels in towers B3-B6',
      type: 'warning'
    },
    {
      icon: Lightbulb,
      title: 'Optimize Planting',
      description: 'Increasing microgreens by 10% could improve weekly revenue by $180',
      type: 'info'
    },
    {
      icon: Target,
      title: 'Waste Reduction',
      description: 'Friday harvests show 2x higher waste. Consider Thursday harvest for lettuce',
      type: 'info'
    }
  ], []);
  
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Production Dashboard</h2>
          <p className="text-gray-600">Real-time production metrics and analytics</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <div className="flex gap-1">
            <Button 
              variant={dateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              7 days
            </Button>
            <Button 
              variant={dateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              30 days
            </Button>
            <Button 
              variant={dateRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90d')}
            >
              90 days
            </Button>
          </div>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              <SelectItem value="romaine">Romaine Lettuce</SelectItem>
              <SelectItem value="arugula">Arugula</SelectItem>
              <SelectItem value="microgreens">All Microgreens</SelectItem>
              <SelectItem value="herbs">All Herbs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trays</p>
              <p className="text-2xl font-bold text-gray-900">{productionMetrics.totalTraysActive}</p>
              <p className="text-sm text-gray-500 mt-1">Growing across all systems</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Sprout className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plants Growing</p>
              <p className="text-2xl font-bold text-gray-900">{productionMetrics.totalPlantsGrowing.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Individual plants</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ready Today</p>
              <p className="text-2xl font-bold text-orange-700">{productionMetrics.harvestReadyToday}</p>
              <p className="text-sm text-gray-600 mt-1">Trays ready for harvest</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Yield Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{productionMetrics.yieldEfficiency}%</p>
              <p className="text-sm text-green-600 mt-1">+2.1% vs target</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader>
            <CardTitle>Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="planted" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                  name="Planted" 
                />
                <Area 
                  type="monotone" 
                  dataKey="harvested" 
                  stackId="2" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6} 
                  name="Harvested" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Crop Distribution */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Current Crop Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cropDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${props.payload.trays} trays`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {cropDistribution.map((crop, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: crop.color }} 
                    />
                    <span>{crop.name}</span>
                  </div>
                  <span className="font-medium">{crop.trays} trays</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Yield Comparison */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Yield vs Expected (lbs/tray)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={yieldComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expected" fill="#e5e7eb" name="Expected" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Analysis */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Waste Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={wasteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wasted" fill="#ef4444" name="Trays Wasted" />
                <Line type="monotone" dataKey="wasteRate" stroke="#dc2626" name="Waste Rate %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                Average waste rate: <span className="font-medium text-gray-900">4.4%</span>
              </p>
              <p className="text-sm text-gray-600">
                Total value lost: <span className="font-medium text-red-600">$342</span> this month
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Growth Stage Distribution */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Growth Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {growthStages.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-sm text-gray-600">{stage.count} trays</span>
                    </div>
                    <span className="text-sm font-medium">{stage.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stage.percentage}%`, 
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Harvest Schedule */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Upcoming Harvests (Next 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                  <th className="text-left py-2 px-4 font-medium">Crop</th>
                  <th className="text-left py-2 px-4 font-medium">Trays</th>
                  <th className="text-left py-2 px-4 font-medium">Est. Yield</th>
                </tr>
              </thead>
              <tbody>
                {upcomingHarvests.map((harvest, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{harvest.date}</td>
                    <td className="py-2 px-4">{harvest.crop}</td>
                    <td className="py-2 px-4">{harvest.trays}</td>
                    <td className="py-2 px-4 font-medium">{harvest.yield}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Production Insights */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Production Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              const colorClasses = {
                positive: 'bg-green-50 border-green-200',
                warning: 'bg-yellow-50 border-yellow-200',
                info: 'bg-blue-50 border-blue-200'
              };
              
              return (
                <div key={index} className={`p-4 rounded-lg border ${colorClasses[insight.type as keyof typeof colorClasses]}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};