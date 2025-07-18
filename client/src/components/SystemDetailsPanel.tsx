import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Settings, Users, Clock, AlertCircle, TrendingUp, Droplets, Thermometer, Zap, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GrowingSystem } from '@shared/schema';
import { Tray } from '../data/trayTracking';

interface SystemDetailsPanelProps {
  systemId: string;
  systems: GrowingSystem[];
  trays: Tray[];
  onClose: () => void;
}

export const SystemDetailsPanel: React.FC<SystemDetailsPanelProps> = ({
  systemId,
  systems,
  trays,
  onClose
}) => {
  const system = systems.find(s => s.id.toString() === systemId);
  
  if (!system) return null;

  // Mock historical data for past trays
  const pastTrays = useMemo(() => {
    const samplePastTrays = [
      { id: 'T-001', crop: 'Basil', plantedDate: '2025-07-10', harvestedDate: '2025-07-17', success: true, yield: 95 },
      { id: 'T-002', crop: 'Lettuce', plantedDate: '2025-07-05', harvestedDate: '2025-07-15', success: true, yield: 88 },
      { id: 'T-003', crop: 'Arugula', plantedDate: '2025-07-08', harvestedDate: '2025-07-16', success: false, yield: 45 },
      { id: 'T-004', crop: 'Spinach', plantedDate: '2025-07-12', harvestedDate: '2025-07-18', success: true, yield: 92 },
      { id: 'T-005', crop: 'Kale', plantedDate: '2025-07-06', harvestedDate: '2025-07-14', success: true, yield: 78 },
    ];
    return samplePastTrays;
  }, []);

  // Calculate success rate
  const successRate = useMemo(() => {
    if (pastTrays.length === 0) return 0;
    const successful = pastTrays.filter(tray => tray.success).length;
    return Math.round((successful / pastTrays.length) * 100);
  }, [pastTrays]);

  // Mock sensor data over time
  const sensorData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        time: `${i}:00`,
        ph: 6.0 + Math.random() * 0.8,
        ec: 1.5 + Math.random() * 0.8,
        temperature: 70 + Math.random() * 5,
      });
    }
    return data;
  }, []);

  // Current system stats
  const currentStats = useMemo(() => {
    const totalCapacity = system.configuration?.totalCapacity || 0;
    const occupancyPercent = totalCapacity > 0 ? Math.round((system.currentOccupancy / totalCapacity) * 100) : 0;
    
    return {
      totalCapacity,
      occupancyPercent,
      currentOccupancy: system.currentOccupancy,
      avgYield: pastTrays.reduce((sum, tray) => sum + tray.yield, 0) / pastTrays.length || 0,
      totalHarvests: pastTrays.length,
      successfulHarvests: pastTrays.filter(tray => tray.success).length
    };
  }, [system, pastTrays]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{system.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{currentStats.currentOccupancy}/{currentStats.totalCapacity}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={currentStats.occupancyPercent} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{currentStats.occupancyPercent}% occupied</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{currentStats.successfulHarvests}/{currentStats.totalHarvests} successful</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Yield</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(currentStats.avgYield)}%</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Average harvest yield</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Harvests</p>
                  <p className="text-2xl font-bold text-purple-600">{currentStats.totalHarvests}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Completed cycles</p>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="sensors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
              <TabsTrigger value="trays">Past Trays</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">pH Level</p>
                      <p className="text-xl font-bold text-blue-600">6.2</p>
                      <p className="text-xs text-gray-500">Optimal range: 5.5-6.5</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">EC Level</p>
                      <p className="text-xl font-bold text-yellow-600">1.8</p>
                      <p className="text-xs text-gray-500">Optimal range: 1.2-2.0</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Temperature</p>
                      <p className="text-xl font-bold text-red-600">72.5°F</p>
                      <p className="text-xs text-gray-500">Optimal range: 68-75°F</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <CardHeader>
                  <CardTitle>24-Hour Sensor Readings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="ph" stroke="#2563eb" strokeWidth={2} name="pH" />
                        <Line type="monotone" dataKey="ec" stroke="#dc2626" strokeWidth={2} name="EC" />
                        <Line type="monotone" dataKey="temperature" stroke="#16a34a" strokeWidth={2} name="Temperature" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trays" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tray History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastTrays.map((tray) => (
                      <div key={tray.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${tray.success ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tray.success ? 
                              <CheckCircle className="w-4 h-4 text-green-600" /> : 
                              <XCircle className="w-4 h-4 text-red-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{tray.id} - {tray.crop}</p>
                            <p className="text-sm text-gray-600">
                              {tray.plantedDate} → {tray.harvestedDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tray.yield}%</p>
                          <p className="text-sm text-gray-600">Yield</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Yield Performance by Crop</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pastTrays}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="crop" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="yield" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Success Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Successful Harvests</span>
                      <span className="font-medium text-green-600">{currentStats.successfulHarvests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Failed Harvests</span>
                      <span className="font-medium text-red-600">{currentStats.totalHarvests - currentStats.successfulHarvests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-medium">{successRate}%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-medium mb-2">Optimal Conditions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Best pH Range</span>
                      <span className="font-medium">5.8-6.4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Best EC Range</span>
                      <span className="font-medium">1.6-2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Best Temperature</span>
                      <span className="font-medium">70-74°F</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};