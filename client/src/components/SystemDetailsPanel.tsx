import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Settings, Users, Clock, AlertCircle } from 'lucide-react';
import { GrowingSystem } from '@shared/schema';
import { Tray } from '../data/trayTracking';
import { SystemVisualizer } from './SystemVisualizer';

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

  const systemTrays = trays.filter(tray => 
    tray.currentLocation.systemId === systemId
  );

  const occupancyPercent = Math.round((system.currentOccupancy / system.capacity) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrayStatusColor = (status: string) => {
    switch (status) {
      case 'seeded': return 'bg-blue-100 text-blue-800';
      case 'germinating': return 'bg-green-100 text-green-800';
      case 'growing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-orange-100 text-orange-800';
      case 'harvested': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{system.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Overview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>System Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{system.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{system.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{system.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(system.status)}>
                      {system.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacity Utilization</span>
                    <span className="font-medium">{system.currentOccupancy} / {system.capacity}</span>
                  </div>
                  <Progress value={occupancyPercent} className="h-3" />
                  <div className="text-xs text-gray-500 text-center">
                    {occupancyPercent}% Full
                  </div>
                </div>

                {system.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{system.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>System Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemVisualizer system={system} />
              </CardContent>
            </Card>
          </div>

          {/* Current Trays */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Current Trays</span>
                  <Badge variant="outline">{systemTrays.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {systemTrays.length > 0 ? (
                    systemTrays.map((tray) => (
                      <div key={tray.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{tray.id}</p>
                            <p className="text-xs text-gray-600">{tray.cropType}</p>
                          </div>
                          <Badge className={getTrayStatusColor(tray.status)}>
                            {tray.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Plants: {tray.plantCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          Location: {tray.currentLocation.spot}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No trays currently in this system</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available Spots</span>
                  <span className="font-medium">{system.capacity - system.currentOccupancy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Utilization</span>
                  <span className="font-medium">{occupancyPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Trays</span>
                  <span className="font-medium">{systemTrays.filter(t => t.status === 'growing').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ready to Harvest</span>
                  <span className="font-medium">{systemTrays.filter(t => t.status === 'ready').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};