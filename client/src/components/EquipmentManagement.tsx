import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Grid, List, Plus, Edit2, Settings, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { SystemConfigurationModal } from './SystemConfigurationModal';
import { SystemDetailsPanel } from './SystemDetailsPanel';
import { SystemVisualizer } from './SystemVisualizer';
import { useQuery } from '@tanstack/react-query';
import { GrowingSystem } from '@shared/schema';
import { sampleTrays } from '../data/trayTracking';
import { getStoredAuth } from '../lib/auth';

export const EquipmentManagement: React.FC = () => {
  const [systems, setSystems] = useState<GrowingSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<GrowingSystem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const auth = getStoredAuth();
  const isCorporateManager = auth.user?.role === 'corporate';
  
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

  // Calculate overall statistics
  const stats = {
    totalCapacity: systems.reduce((sum, s) => sum + s.capacity, 0),
    totalOccupied: systems.reduce((sum, s) => sum + s.currentOccupancy, 0),
    utilizationRate: 0,
    systemsAtCapacity: systems.filter(s => s.currentOccupancy >= s.capacity).length
  };
  stats.utilizationRate = stats.totalCapacity > 0 
    ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100) 
    : 0;

  return (
    <div className="equipment-management space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold">{stats.totalCapacity}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Occupied</p>
                <p className="text-2xl font-bold">{stats.totalOccupied}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold">{stats.utilizationRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Systems at Capacity</p>
                <p className="text-2xl font-bold text-red-600">{stats.systemsAtCapacity}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            size="sm"
          >
            <Grid className="h-4 w-4 mr-2" />
            Grid View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
        
        {isCorporateManager && (
          <Button
            onClick={() => setShowConfigModal(true)}
            className="bg-[#2D8028] hover:bg-[#203B17]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add System
          </Button>
        )}
      </div>

      {/* Systems Display */}
      <div className="space-y-8">
        {/* Microgreens Section */}
        <div className="system-category">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🌱 <span className="ml-2">Microgreen Systems</span>
          </h2>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {systemsByCategory.microgreens.map(system => (
              <SystemCard
                key={system.id}
                system={system}
                viewMode={viewMode}
                onSelect={() => setSelectedSystem(system.id.toString())}
                onEdit={isCorporateManager ? () => {
                  setEditingSystem(system);
                  setShowConfigModal(true);
                } : undefined}
              />
            ))}
          </div>
        </div>

        {/* Leafy Greens Section */}
        <div className="system-category">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🥬 <span className="ml-2">Leafy Green Systems</span>
          </h2>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {systemsByCategory.leafyGreens.map(system => (
              <SystemCard
                key={system.id}
                system={system}
                viewMode={viewMode}
                onSelect={() => setSelectedSystem(system.id.toString())}
                onEdit={isCorporateManager ? () => {
                  setEditingSystem(system);
                  setShowConfigModal(true);
                } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* System Details Panel */}
      {selectedSystem && (
        <SystemDetailsPanel
          systemId={selectedSystem}
          systems={systems}
          trays={sampleTrays}
          onClose={() => setSelectedSystem(null)}
        />
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <SystemConfigurationModal
          system={editingSystem}
          onSave={(systemData) => {
            if (editingSystem) {
              setSystems(systems.map(s => 
                s.id === editingSystem.id ? { ...s, ...systemData } : s
              ));
            } else {
              setSystems([...systems, { ...systemData, id: Date.now() }]);
            }
            setShowConfigModal(false);
            setEditingSystem(null);
          }}
          onClose={() => {
            setShowConfigModal(false);
            setEditingSystem(null);
          }}
        />
      )}
    </div>
  );
};

// System Card Component
const SystemCard: React.FC<{
  system: GrowingSystem;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onEdit?: () => void;
}> = ({ system, viewMode, onSelect, onEdit }) => {
  const occupancyPercent = Math.round(
    (system.currentOccupancy / system.capacity) * 100
  );
  
  const getStatusColor = () => {
    if (occupancyPercent >= 90) return 'red';
    if (occupancyPercent >= 70) return 'yellow';
    return 'green';
  };

  const getStatusBadge = () => {
    if (occupancyPercent >= 90) return <Badge className="bg-red-100 text-red-800">At Capacity</Badge>;
    if (occupancyPercent >= 70) return <Badge className="bg-yellow-100 text-yellow-800">High Usage</Badge>;
    return <Badge className="bg-green-100 text-green-800">Available</Badge>;
  };

  if (viewMode === 'grid') {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{system.name}</CardTitle>
              <p className="text-sm text-gray-600">{system.type}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            <SystemVisualizer system={system} />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Occupancy</span>
                <span className="font-medium">{system.currentOccupancy} / {system.capacity}</span>
              </div>
              <Progress value={occupancyPercent} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {occupancyPercent}% Full
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-semibold">{system.name}</h3>
              <p className="text-sm text-gray-600">{system.type}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium">{system.currentOccupancy}</span>
              <span className="text-gray-500"> / {system.capacity}</span>
            </div>
            
            <div className="w-24">
              <Progress value={occupancyPercent} className="h-2" />
            </div>
            
            {getStatusBadge()}
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};