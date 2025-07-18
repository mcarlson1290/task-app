import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, Clock, 
  Target, AlertTriangle, Lightbulb, ShoppingCart 
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

interface TaskCostData {
  taskType: string;
  instances: number;
  avgLaborCost: number;
  avgMaterialCost: number;
  totalAvgCost: number;
  trend: number;
}

interface CropCostData {
  crop: string;
  unitsProduced: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalCost: number;
  costPerUnit: number;
  marketPrice: number;
  profitMargin: number;
}

export const TaskCostAnalysis: React.FC = () => {
  const { currentLocation, isViewingAllLocations } = useLocation();
  const [viewType, setViewType] = useState<'task' | 'crop' | 'location'>('task');
  const [dateRange, setDateRange] = useState('30d');

  // Mock cost data - replace with real API data
  const taskCostData: TaskCostData[] = useMemo(() => [
    {
      taskType: 'Seed Romaine Lettuce',
      instances: 45,
      avgLaborCost: 8.75,
      avgMaterialCost: 2.50,
      totalAvgCost: 11.25,
      trend: -0.5
    },
    {
      taskType: 'Harvest Microgreens',
      instances: 120,
      avgLaborCost: 15.20,
      avgMaterialCost: 0.25,
      totalAvgCost: 15.45,
      trend: 1.2
    },
    {
      taskType: 'pH Testing',
      instances: 24,
      avgLaborCost: 12.50,
      avgMaterialCost: 3.75,
      totalAvgCost: 16.25,
      trend: 0
    },
    {
      taskType: 'System Cleaning',
      instances: 30,
      avgLaborCost: 22.30,
      avgMaterialCost: 5.20,
      totalAvgCost: 27.50,
      trend: -2.1
    }
  ], []);

  const cropCostData: CropCostData[] = useMemo(() => [
    {
      crop: 'Romaine Lettuce',
      unitsProduced: 1250,
      totalLaborCost: 1875,
      totalMaterialCost: 625,
      totalCost: 2500,
      costPerUnit: 2.00,
      marketPrice: 4.50,
      profitMargin: 55.6
    },
    {
      crop: 'Broccoli Microgreens',
      unitsProduced: 800,
      totalLaborCost: 960,
      totalMaterialCost: 320,
      totalCost: 1280,
      costPerUnit: 1.60,
      marketPrice: 6.00,
      profitMargin: 73.3
    },
    {
      crop: 'Arugula',
      unitsProduced: 950,
      totalLaborCost: 1425,
      totalMaterialCost: 475,
      totalCost: 1900,
      costPerUnit: 2.00,
      marketPrice: 5.00,
      profitMargin: 60.0
    },
    {
      crop: 'Basil',
      unitsProduced: 600,
      totalLaborCost: 1200,
      totalMaterialCost: 480,
      totalCost: 1680,
      costPerUnit: 2.80,
      marketPrice: 7.50,
      profitMargin: 62.7
    }
  ], []);

  const costTrendData = useMemo(() => [
    { month: 'Jan', laborCost: 8500, materialCost: 2800, totalCost: 11300 },
    { month: 'Feb', laborCost: 8200, materialCost: 2600, totalCost: 10800 },
    { month: 'Mar', laborCost: 8900, materialCost: 2900, totalCost: 11800 },
    { month: 'Apr', laborCost: 8600, materialCost: 2750, totalCost: 11350 },
    { month: 'May', laborCost: 8750, materialCost: 2850, totalCost: 11600 },
    { month: 'Jun', laborCost: 8400, materialCost: 2700, totalCost: 11100 },
  ], []);

  const costBreakdown = useMemo(() => [
    { name: 'Labor', value: 68, color: '#3b82f6' },
    { name: 'Seeds', value: 12, color: '#10b981' },
    { name: 'Growing Media', value: 8, color: '#f59e0b' },
    { name: 'Utilities', value: 7, color: '#8b5cf6' },
    { name: 'Other Supplies', value: 5, color: '#6b7280' }
  ], []);

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-600';
    if (trend < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Cost Analysis</h2>
          <p className="text-gray-600">Track and analyze task costs, materials, and profitability</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <Button
          variant={viewType === 'task' ? 'default' : 'outline'}
          onClick={() => setViewType('task')}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          By Task
        </Button>
        <Button
          variant={viewType === 'crop' ? 'default' : 'outline'}
          onClick={() => setViewType('crop')}
          className="flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          By Crop
        </Button>
        <Button
          variant={viewType === 'location' ? 'default' : 'outline'}
          onClick={() => setViewType('location')}
          className="flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          By Location
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Task Cost</p>
              <p className="text-2xl font-bold text-gray-900">$14.85</p>
              <div className="text-sm text-gray-500 mt-1">
                <span>Labor: $10.95</span> • <span>Materials: $3.90</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost per Head (Lettuce)</p>
              <p className="text-2xl font-bold text-green-700">$2.00</p>
              <div className="text-sm text-gray-600 mt-1">
                <span>Sells for: $4.50</span>
                <span className="text-green-600 font-medium block">+125% ROI</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Labor Cost</p>
              <p className="text-2xl font-bold text-gray-900">$8,600</p>
              <div className="text-sm text-red-600 mt-1">
                +3.2% vs last month
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <div className="text-sm text-green-600 mt-1">
                +2.1% improvement
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Task View */}
      {viewType === 'task' && (
        <div className="space-y-6">
          {/* Task Cost Table */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Cost Analysis by Task Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Task Type</th>
                      <th className="text-left p-3 font-medium">Instances</th>
                      <th className="text-left p-3 font-medium">Avg Labor Cost</th>
                      <th className="text-left p-3 font-medium">Avg Material Cost</th>
                      <th className="text-left p-3 font-medium">Total Avg Cost</th>
                      <th className="text-left p-3 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskCostData.map((task, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{task.taskType}</td>
                        <td className="p-3">{task.instances}</td>
                        <td className="p-3">${task.avgLaborCost.toFixed(2)}</td>
                        <td className="p-3">${task.avgMaterialCost.toFixed(2)}</td>
                        <td className="p-3 font-semibold">${task.totalAvgCost.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(task.trend)}
                            <span className={getTrendColor(task.trend)}>
                              {task.trend > 0 ? '+' : ''}{task.trend.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown Pie Chart */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Overall Cost Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crop View */}
      {viewType === 'crop' && (
        <div className="space-y-6">
          {/* Crop Cost Table */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Full Cycle Cost per Crop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Crop</th>
                      <th className="text-left p-3 font-medium">Units Produced</th>
                      <th className="text-left p-3 font-medium">Total Labor</th>
                      <th className="text-left p-3 font-medium">Total Materials</th>
                      <th className="text-left p-3 font-medium">Cost per Unit</th>
                      <th className="text-left p-3 font-medium">Market Price</th>
                      <th className="text-left p-3 font-medium">Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropCostData.map((crop, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{crop.crop}</td>
                        <td className="p-3">{crop.unitsProduced}</td>
                        <td className="p-3">${crop.totalLaborCost}</td>
                        <td className="p-3">${crop.totalMaterialCost}</td>
                        <td className="p-3 font-semibold">${crop.costPerUnit.toFixed(2)}</td>
                        <td className="p-3">${crop.marketPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(crop.profitMargin, 100)}%` }}
                              />
                            </div>
                            <span className="font-medium text-green-600">{crop.profitMargin.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Profitability Chart */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Crop Profitability Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="costPerUnit" fill="#ef4444" name="Cost per Unit" />
                  <Bar dataKey="marketPrice" fill="#10b981" name="Market Price" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location View */}
      {viewType === 'location' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Cost Comparison by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Kenosha</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Labor Cost/hr:</span>
                      <span className="font-medium">$18.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Task Cost:</span>
                      <span className="font-medium">$14.25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium text-green-600">94.2%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Racine (Dev)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Labor Cost/hr:</span>
                      <span className="font-medium">$17.75</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Task Cost:</span>
                      <span className="font-medium">$15.80</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium text-yellow-600">91.8%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">Milwaukee</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Labor Cost/hr:</span>
                      <span className="font-medium">$19.25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Task Cost:</span>
                      <span className="font-medium">$16.45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium text-red-600">89.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Trend Chart */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Cost Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="laborCost" stroke="#3b82f6" name="Labor Cost" strokeWidth={2} />
              <Line type="monotone" dataKey="materialCost" stroke="#10b981" name="Material Cost" strokeWidth={2} />
              <Line type="monotone" dataKey="totalCost" stroke="#f59e0b" strokeWidth={3} name="Total Cost" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Optimization Insights */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Cost Optimization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Reduce Seeding Labor
              </h4>
              <p className="text-sm text-yellow-700 mb-2">
                Batch seeding on Tuesdays could save $45/week in labor costs
              </p>
              <span className="text-sm font-medium text-yellow-800">
                Potential savings: $2,340/year
              </span>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Bulk Material Ordering
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Ordering growing medium in bulk could reduce cost by 15%
              </p>
              <span className="text-sm font-medium text-blue-800">
                Potential savings: $1,800/year
              </span>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Optimize Harvest Times
              </h4>
              <p className="text-sm text-green-700 mb-2">
                Scheduling harvests during peak efficiency hours reduces overtime
              </p>
              <span className="text-sm font-medium text-green-800">
                Potential savings: $1,200/year
              </span>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Cross-training Staff
              </h4>
              <p className="text-sm text-purple-700 mb-2">
                Multi-skilled staff reduce task switching time and increase efficiency
              </p>
              <span className="text-sm font-medium text-purple-800">
                Potential savings: $3,600/year
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};