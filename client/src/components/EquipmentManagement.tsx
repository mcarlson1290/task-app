import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid, List, Plus, Edit2, Settings, AlertCircle, CheckCircle, Clock, 
  Activity, BarChart3, TrendingUp, TrendingDown, Thermometer, Droplets,
  Lightbulb, Zap, AlertTriangle, Target
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { SystemConfigurationModal } from './SystemConfigurationModal';
import { SystemDetailsPanel } from './SystemDetailsPanel';
import { SystemVisualizer } from './SystemVisualizer';
import { useQuery } from '@tanstack/react-query';
import { GrowingSystem } from '@shared/schema';
import { sampleTrays } from '../data/trayTracking';
import { getStoredAuth } from '../lib/auth';
import { useLocation } from '@/contexts/LocationContext';

export const EquipmentManagement: React.FC = () => {
  const [systems, setSystems] = useState<GrowingSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<GrowingSystem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'performance' | 'maintenance'>('overview');
  const [dateRange, setDateRange] = useState('30d');
  
  const auth = getStoredAuth();
  const isCorporateManager = auth.user?.role === 'corporate';
  const { currentLocation } = useLocation();
  
  // Fetch systems data
  const { data: systemsData = [] } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems'],
    queryFn: async () => {
      const response = await fetch('/api/growing-systems');
      if (!response.ok) throw new Error('Failed to fetch systems');
      return response.json();
    },
  });

  useEffect(() => {
    setSystems(systemsData);
  }, [systemsData]);

  // Group systems by category
  const systemsByCategory = {
    microgreens: systems.filter(s => s.category === 'microgreens'),
    leafyGreens: systems.filter(s => s.category === 'leafyGreens')
  };

  // Mock system performance data
  const systemPerformanceData = useMemo(() => [
    { date: '3/1', efficiency: 94.2, temperature: 72.5, humidity: 68, yield: 2.3 },
    { date: '3/8', efficiency: 96.1, temperature: 71.8, humidity: 65, yield: 2.4 },
    { date: '3/15', efficiency: 93.8, temperature: 73.2, humidity: 70, yield: 2.2 },
    { date: '3/22', efficiency: 97.5, temperature: 72.0, humidity: 67, yield: 2.6 },
    { date: '3/29', efficiency: 95.3, temperature: 72.8, humidity: 66, yield: 2.4 },
  ], []);

  const systemStatusData = useMemo(() => [
    { status: 'Optimal', count: 8, color: '#10b981' },
    { status: 'Warning', count: 3, color: '#f59e0b' },
    { status: 'Maintenance', count: 2, color: '#ef4444' },
    { status: 'Offline', count: 1, color: '#6b7280' }
  ], []);

  const maintenanceSchedule = useMemo(() => [
    { system: 'NFT System A1', type: 'Routine Cleaning', due: 'Today', priority: 'high' },
    { system: 'Tower B3', type: 'pH Calibration', due: 'Tomorrow', priority: 'medium' },
    { system: 'Microgreen Rack C2', type: 'Light Replacement', due: 'Mar 3', priority: 'low' },
    { system: 'NFT System A2', type: 'Nutrient Pump Service', due: 'Mar 5', priority: 'high' },
  ], []);

  const energyConsumption = useMemo(() => [
    { system: 'LED Grow Lights', consumption: 45.2, cost: 18.80 },
    { system: 'Water Pumps', consumption: 12.8, cost: 5.32 },
    { system: 'Climate Control', consumption: 28.5, cost: 11.83 },
    { system: 'Ventilation', consumption: 8.3, cost: 3.45 },
  ], []);

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalCapacity = systems.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupied = systems.reduce((sum, s) => sum + s.currentOccupancy, 0);
    const utilizationRate = totalCapacity > 0 
      ? Math.round((totalOccupied / totalCapacity) * 100) 
      : 0;
    const systemsAtCapacity = systems.filter(s => s.currentOccupancy >= s.capacity).length;
    const avgEfficiency = systemPerformanceData.reduce((sum, d) => sum + d.efficiency, 0) / systemPerformanceData.length;
    const totalEnergyConsumption = energyConsumption.reduce((sum, e) => sum + e.consumption, 0);
    
    return {
      totalCapacity,
      totalOccupied,
      utilizationRate,
      systemsAtCapacity,
      avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      totalEnergyConsumption: Math.round(totalEnergyConsumption * 10) / 10,
      totalEnergyCost: energyConsumption.reduce((sum, e) => sum + e.cost, 0),
      systemsOperational: systemStatusData.find(s => s.status === 'Optimal')?.count || 0,
      systemsNeedingMaintenance: systemStatusData.find(s => s.status === 'Maintenance')?.count || 0
    };
  }, [systems, systemPerformanceData, energyConsumption, systemStatusData]);

  return (
    <div className="equipment-management space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Equipment Management</h2>
          <p className="text-gray-600">Monitor and manage growing systems performance</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <div className="flex gap-1">
            <Button
              variant={analyticsView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAnalyticsView('overview')}
            >
              Overview
            </Button>
            <Button
              variant={analyticsView === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAnalyticsView('performance')}
            >
              Performance
            </Button>
            <Button
              variant={analyticsView === 'maintenance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAnalyticsView('maintenance')}
            >
              Maintenance
            </Button>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalOccupied} occupied • {stats.utilizationRate}% utilization
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgEfficiency}%</p>
              <p className="text-sm text-green-600 mt-1">
                +2.3% vs last month
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Energy Consumption</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEnergyConsumption}</p>
              <p className="text-sm text-gray-500 mt-1">
                kWh • ${stats.totalEnergyCost.toFixed(2)} cost
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemsOperational}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.systemsNeedingMaintenance} need maintenance
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Views */}
      {analyticsView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status Distribution */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>System Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={systemStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {systemStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Energy Consumption Breakdown */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Energy Consumption by System</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={energyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="system" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consumption" fill="#3b82f6" name="kWh" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {analyticsView === 'performance' && (
        <div className="space-y-6">
          {/* Performance Trends */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>System Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency %" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="yield" stroke="#3b82f6" name="Yield (lbs/tray)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temp (°F)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Environmental Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Temperature</p>
                  <p className="text-2xl font-bold text-gray-900">72.5°F</p>
                  <p className="text-sm text-gray-500 mt-1">Optimal range: 70-75°F</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <Thermometer className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Humidity</p>
                  <p className="text-2xl font-bold text-gray-900">67%</p>
                  <p className="text-sm text-gray-500 mt-1">Optimal range: 60-70%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Droplets className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Light Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">92%</p>
                  <p className="text-sm text-green-600 mt-1">+1.5% improvement</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {analyticsView === 'maintenance' && (
        <div className="space-y-6">
          {/* Maintenance Schedule */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Upcoming Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceSchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.priority === 'high' ? 'bg-red-500' :
                        item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{item.system}</p>
                        <p className="text-sm text-gray-600">{item.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.due}</p>
                      <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle>Maintenance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Preventive Maintenance Due</h4>
                      <p className="text-sm text-gray-600">3 systems require routine maintenance this week</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Efficiency Optimization</h4>
                      <p className="text-sm text-gray-600">LED light replacement could improve efficiency by 3%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Performance Trending Up</h4>
                      <p className="text-sm text-gray-600">System efficiency has improved 2.3% this month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle>Energy Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {energyConsumption.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full" />
                        <span className="text-sm font-medium">{item.system}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${item.cost.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{item.consumption} kWh</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* System Controls */}
      <Card className="p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Management</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              {isCorporateManager && (
                <Button onClick={() => setShowConfigModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add System
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {systems.map((system) => (
              <Card key={system.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{system.name}</h3>
                  <Badge variant={system.currentOccupancy >= system.capacity ? 'destructive' : 'secondary'}>
                    {system.currentOccupancy >= system.capacity ? 'Full' : 'Available'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{system.type}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Capacity</span>
                    <span className="text-sm font-medium">{system.currentOccupancy}/{system.capacity}</span>
                  </div>
                  <Progress value={(system.currentOccupancy / system.capacity) * 100} className="h-2" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSystem(system.id)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  {isCorporateManager && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSystem(system);
                        setShowConfigModal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration Modal */}
      {showConfigModal && (
        <SystemConfigurationModal
          system={editingSystem}
          onClose={() => {
            setShowConfigModal(false);
            setEditingSystem(null);
          }}
          onSave={(systemData) => {
            // Handle save logic here
            console.log('System saved:', systemData);
            setShowConfigModal(false);
            setEditingSystem(null);
          }}
        />
      )}

      {/* System Details Panel */}
      {selectedSystem && (
        <Dialog open={!!selectedSystem} onOpenChange={() => setSelectedSystem(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>System Details</DialogTitle>
            </DialogHeader>
            <SystemDetailsPanel
              systemId={selectedSystem}
              onClose={() => setSelectedSystem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

