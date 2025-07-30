import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, MapPin, Clock, Users, Split, ArrowRight, Search, Filter, Calendar } from 'lucide-react';
import { Tray, TrayMovement } from '../data/trayTracking';
import { GrowingSystem } from '../data/systemsData';
import { TrayMovementService } from '../services/trayMovement';
import { TraySplitInterface } from '../components/TraySplitInterface';
import { useQuery } from '@tanstack/react-query';
import TrayDataService from '../services/trayDataService';

const TrayTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cropFilter, setCropFilter] = useState('all');
  const [selectedTray, setSelectedTray] = useState<Tray | null>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [trays, setTrays] = useState<Tray[]>([]);
  const [movements, setMovements] = useState<TrayMovement[]>([]);

  const { data: systems = [] } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems']
  });

  // Load trays on component mount
  useEffect(() => {
    const loadTrays = () => {
      const loadedTrays = TrayDataService.loadTrays();
      console.log('TrayTracking: Loaded', loadedTrays.length, 'trays');
      setTrays(loadedTrays);
    };
    
    loadTrays();
    
    // Listen for tray data updates
    const handleTrayUpdate = (event: any) => {
      console.log('TrayTracking: Received tray data update event');
      loadTrays();
    };
    
    window.addEventListener('trayDataUpdated', handleTrayUpdate);
    
    return () => {
      window.removeEventListener('trayDataUpdated', handleTrayUpdate);
    };
  }, []);

  useEffect(() => {
    // Check for automatic movements
    const automaticMovements = TrayMovementService.checkAutomaticMovements(trays, systems);
    setMovements(automaticMovements);
  }, [trays, systems]);

  const filteredTrays = trays.filter(tray => {
    const matchesSearch = tray.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tray.cropType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tray.status === statusFilter;
    const matchesCrop = cropFilter === 'all' || tray.cropCategory === cropFilter;
    
    return matchesSearch && matchesStatus && matchesCrop;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'seeded': return 'bg-yellow-100 text-yellow-800';
      case 'germinating': return 'bg-orange-100 text-orange-800';
      case 'growing': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'harvested': return 'bg-gray-100 text-gray-800';
      case 'split': return 'bg-purple-100 text-purple-800';
      case 'discarded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSystemIcon = (systemType: string) => {
    switch (systemType) {
      case 'nursery': return '🌱';
      case 'blackout': return '🌑';
      case 'microgreens': return '🌿';
      case 'towers': return '🏗️';
      case 'nft': return '💧';
      case 'ebbFlow': return '🌊';
      default: return '📦';
    }
  };

  const handleSplitTray = (splits: Array<{
    systemId: string;
    systemType: string;
    spotIds: string[];
    plantCount: number;
  }>) => {
    if (!selectedTray) return;

    console.log('TrayTracking: Handling split for tray', selectedTray.id);
    
    // Use the shared TrayDataService for splitting
    const { originalTray, splitTrays } = TrayDataService.splitTray(
      selectedTray.id,
      splits.length
    );

    console.log('TrayTracking: Split completed, reloading trays');
    
    // Reload trays from service (this will trigger re-render)
    const updatedTrays = TrayDataService.loadTrays();
    setTrays(updatedTrays);

    setShowSplitModal(false);
    setSelectedTray(null);
  };

  const handleMoveTray = (tray: Tray, toSystemId: string, toSystemType: string) => {
    const updatedTray = TrayMovementService.moveTray(
      tray,
      toSystemId,
      toSystemType,
      [], // Would need to select specific spots
      'Current User',
      'Manual movement'
    );

    setTrays(prevTrays => prevTrays.map(t => t.id === tray.id ? updatedTray : t));
  };

  const getDaysInSystem = (tray: Tray) => {
    const daysSinceMoved = Math.floor(
      (Date.now() - tray.currentLocation.movedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceMoved;
  };

  const getDaysUntilHarvest = (tray: Tray) => {
    const daysUntilHarvest = Math.floor(
      (tray.expectedHarvest.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilHarvest;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tray Tracking</h1>
          <p className="text-gray-600">Monitor tray locations and movement throughout the growing process</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            {trays.length} Total Trays
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <ArrowRight className="w-4 h-4" />
            {movements.length} Pending Movements
          </Badge>
          {/* Debug button for testing splits */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('=== TESTING SPLIT FUNCTIONALITY ===');
              const firstTray = trays.find(t => t.status === 'growing');
              if (firstTray) {
                console.log('Testing split for tray:', firstTray.id);
                const result = TrayDataService.splitTray(firstTray.id, 2);
                console.log('Split test result:', result);
                // Reload trays to see changes
                const updatedTrays = TrayDataService.loadTrays();
                setTrays(updatedTrays);
              } else {
                console.log('No growing trays found for split test');
              }
            }}
          >
            🧪 Test Split
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trays" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trays">Active Trays</TabsTrigger>
          <TabsTrigger value="movements">Pending Movements</TabsTrigger>
          <TabsTrigger value="history">Location History</TabsTrigger>
        </TabsList>

        <TabsContent value="trays" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by tray ID or crop type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="seeded">Seeded</SelectItem>
                <SelectItem value="germinating">Germinating</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="split">Split</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by crop type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                <SelectItem value="microgreens">Microgreens</SelectItem>
                <SelectItem value="leafyGreens">Leafy Greens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tray Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrays.map((tray) => (
              <Card key={tray.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tray.id}</CardTitle>
                    <Badge className={getStatusColor(tray.status)}>
                      {tray.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{tray.cropType}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-2xl">{getSystemIcon(tray.currentLocation.systemType)}</span>
                    <div>
                      <p className="font-medium">{tray.currentLocation.systemId}</p>
                      <p className="text-gray-500">{tray.currentLocation.systemType}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Plants</p>
                      <p className="font-medium">{tray.plantCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days in System</p>
                      <p className="font-medium">{getDaysInSystem(tray)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days to Harvest</p>
                      <p className={`font-medium ${getDaysUntilHarvest(tray) <= 2 ? 'text-orange-600' : ''}`}>
                        {getDaysUntilHarvest(tray)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created By</p>
                      <p className="font-medium">{tray.createdBy}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Tray Details: {tray.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">Crop Information</p>
                              <p className="text-sm text-gray-600">{tray.cropType}</p>
                              <p className="text-sm text-gray-600">{tray.cropCategory}</p>
                            </div>
                            <div>
                              <p className="font-medium">Timeline</p>
                              <p className="text-sm text-gray-600">
                                Planted: {tray.datePlanted.toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                Expected Harvest: {tray.expectedHarvest.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium mb-2">Location History</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {tray.locationHistory.map((location, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                                  <span className="text-lg">{getSystemIcon(location.systemType)}</span>
                                  <div className="flex-1">
                                    <p className="font-medium">{location.systemId}</p>
                                    <p className="text-gray-500">{location.reason}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-gray-500">{location.movedDate.toLocaleDateString()}</p>
                                    <p className="text-gray-500">{location.movedBy}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {tray.cropCategory === 'leafyGreens' && tray.status === 'growing' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTray(tray);
                          setShowSplitModal(true);
                        }}
                      >
                        <Split className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Automatic Movements</CardTitle>
              <p className="text-sm text-gray-600">
                System-triggered movements based on growth stages
              </p>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending movements</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">{movement.trayId}</p>
                          <p className="text-sm text-gray-600">{movement.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {movement.fromSystem} → {movement.toSystem}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Execute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Location Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trays.flatMap(tray => 
                  tray.locationHistory.slice(-1).map(location => ({
                    ...location,
                    trayId: tray.id,
                    cropType: tray.cropType
                  }))
                ).sort((a, b) => b.movedDate.getTime() - a.movedDate.getTime()).slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSystemIcon(entry.systemType)}</span>
                      <div>
                        <p className="font-medium">{entry.trayId}</p>
                        <p className="text-sm text-gray-600">{entry.cropType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{entry.systemId}</p>
                      <p className="text-sm text-gray-600">{entry.movedDate.toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{entry.movedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Split Modal */}
      {showSplitModal && selectedTray && (
        <Dialog open={showSplitModal} onOpenChange={setShowSplitModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Split Tray</DialogTitle>
            </DialogHeader>
            <TraySplitInterface
              tray={selectedTray}
              systems={systems}
              onSplit={handleSplitTray}
              onCancel={() => setShowSplitModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrayTracking;