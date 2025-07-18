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
  
  // Fetch systems data with location filtering
  const { data: systemsData = [] } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems', currentLocation.code],
    queryFn: async () => {
      const response = await fetch(`/api/growing-systems?location=${currentLocation.code}`);
      if (!response.ok) throw new Error('Failed to fetch systems');
      return response.json();
    },
  });

  useEffect(() => {
    // Filter systems by current location
    const locationSystems = systemsData.filter(system => 
      system.location === currentLocation.code
    );
    setSystems(locationSystems);
  }, [systemsData, currentLocation.code]);

  // Group systems by category
  const systemsByCategory = {
    microgreens: systems.filter(s => s.category === 'microgreens'),
    leafyGreens: systems.filter(s => s.category === 'leafyGreens')
  };

  // Mock sensor data for each system
  const getSensorData = (systemId: string) => {
    const sensorReadings = {
      '1': { ph: 6.2, ec: 1.8, temperature: 72.5, lastReading: '2 minutes ago' },
      '2': { ph: 6.4, ec: 2.1, temperature: 71.8, lastReading: '1 minute ago' },
      '3': { ph: 6.0, ec: 1.9, temperature: 73.2, lastReading: '3 minutes ago' },
      '4': { ph: 6.3, ec: 2.0, temperature: 72.0, lastReading: '2 minutes ago' },
      '5': { ph: 6.1, ec: 1.7, temperature: 72.8, lastReading: '4 minutes ago' },
      '6': { ph: 6.5, ec: 2.2, temperature: 71.5, lastReading: '1 minute ago' },
      '7': { ph: 6.2, ec: 1.8, temperature: 72.3, lastReading: '2 minutes ago' },
      '8': { ph: 6.4, ec: 2.0, temperature: 71.9, lastReading: '3 minutes ago' },
    };
    
    return sensorReadings[systemId] || { ph: 6.2, ec: 1.8, temperature: 72.0, lastReading: '5 minutes ago' };
  };

  // Calculate basic statistics
  const stats = useMemo(() => {
    const totalCapacity = systems.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupied = systems.reduce((sum, s) => sum + s.currentOccupancy, 0);
    const utilizationRate = totalCapacity > 0 
      ? Math.round((totalOccupied / totalCapacity) * 100) 
      : 0;
    const systemsAtCapacity = systems.filter(s => s.currentOccupancy >= s.capacity).length;
    
    return {
      totalCapacity,
      totalOccupied,
      utilizationRate,
      systemsAtCapacity
    };
  }, [systems]);

  return (
    <div className="equipment-management space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#203B17] mb-2">Equipment Management - {currentLocation.name}</h2>
          <p className="text-gray-600">Monitor growing systems and sensor readings</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
          {isCorporateManager && (
            <Button onClick={() => setShowConfigModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add System
            </Button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Systems</p>
              <p className="text-2xl font-bold text-gray-900">{systems.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Occupied</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOccupied}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.utilizationRate}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Systems Display */}
      <div className="space-y-6">
        {systems.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Systems Found</h3>
              <p className="text-sm">No growing systems found for {currentLocation.name}.</p>
              {isCorporateManager && (
                <Button onClick={() => setShowConfigModal(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add System
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {systems.map((system) => {
              const sensorData = getSensorData(system.id.toString());
              const occupancyPercent = Math.round((system.currentOccupancy / system.capacity) * 100);
              
              return (
                <Card key={system.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{system.name}</h3>
                      <p className="text-sm text-gray-600">{system.type}</p>
                    </div>
                    <Badge variant={occupancyPercent >= 90 ? 'destructive' : occupancyPercent >= 70 ? 'secondary' : 'default'}>
                      {occupancyPercent >= 90 ? 'Full' : 'Available'}
                    </Badge>
                  </div>

                  {/* Sensor Readings */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Droplets className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600">pH</p>
                      <p className="text-lg font-bold text-gray-900">{sensorData.ph}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600">EC</p>
                      <p className="text-lg font-bold text-gray-900">{sensorData.ec}</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Thermometer className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-xs text-gray-600">Temp</p>
                      <p className="text-lg font-bold text-gray-900">{sensorData.temperature}°F</p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Capacity</span>
                      <span className="text-sm font-medium">{system.currentOccupancy}/{system.capacity}</span>
                    </div>
                    <Progress value={occupancyPercent} className="h-2" />
                  </div>

                  {/* Last Reading */}
                  <div className="text-xs text-gray-500 mb-4">
                    Last reading: {sensorData.lastReading}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSystem(system.id.toString())}
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
              );
            })}
          </div>
        )}
      </div>

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

