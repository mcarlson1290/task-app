import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, AlertTriangle, Sprout, Calendar, TrendingUp, Plus, Edit2, Trash2 } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrayService, Tray as TrayType, Crop as CropType } from "@/services/trayService";
import SystemConfiguration from "@/components/SystemConfiguration";
import { EquipmentManagement } from "@/components/EquipmentManagement";

interface Crop extends CropType {
  checklistTemplate: any;
}

interface Tray extends TrayType {}

// Mock data for initial implementation
const mockCrops: Crop[] = [
  {
    id: 1,
    name: 'Romaine Lettuce',
    category: 'Leafy Green',
    expectedYieldPerTray: 2.5,
    averageGrowthTime: 35,
    lightRequirements: 'Medium (14-16 hours)',
    status: 'active',
    checklistTemplate: null
  },
  {
    id: 2,
    name: 'Broccoli Microgreens',
    category: 'Microgreen',
    expectedYieldPerTray: 0.75,
    averageGrowthTime: 7,
    lightRequirements: 'Low (8-10 hours)',
    status: 'active',
    checklistTemplate: null
  },
  {
    id: 3,
    name: 'Arugula',
    category: 'Leafy Green',
    expectedYieldPerTray: 1.8,
    averageGrowthTime: 28,
    lightRequirements: 'Medium (12-14 hours)',
    status: 'active',
    checklistTemplate: null
  },
  {
    id: 4,
    name: 'Basil',
    category: 'Herb',
    expectedYieldPerTray: 1.2,
    averageGrowthTime: 42,
    lightRequirements: 'High (16-18 hours)',
    status: 'active',
    checklistTemplate: null
  }
];

const mockTrays: Tray[] = [
  {
    id: 'K071725-MG-BROC-1C',
    cropType: 'Broccoli Microgreens',
    cropId: 2,
    datePlanted: '2024-03-10',
    assignedSystem: 'Tower 3 - Level A',
    estimatedHarvestDate: '2024-03-17',
    status: 'growing',
    actualYield: null,
    notes: ''
  },
  {
    id: 'K071725-LG-ROM-2A',
    cropType: 'Romaine Lettuce',
    cropId: 1,
    datePlanted: '2024-02-15',
    assignedSystem: 'NFT System 1',
    estimatedHarvestDate: '2024-03-22',
    status: 'growing',
    actualYield: null,
    notes: 'Looking healthy'
  },
  {
    id: 'K071725-LG-ARU-3B',
    cropType: 'Arugula',
    cropId: 3,
    datePlanted: '2024-03-01',
    assignedSystem: 'Tower 2 - Level B',
    estimatedHarvestDate: '2024-03-29',
    status: 'growing',
    actualYield: null,
    notes: ''
  },
  {
    id: 'K071725-MG-BROC-2C',
    cropType: 'Broccoli Microgreens',
    cropId: 2,
    datePlanted: '2024-03-08',
    assignedSystem: 'Tower 3 - Level B',
    estimatedHarvestDate: '2024-03-15',
    status: 'ready-to-harvest',
    actualYield: null,
    notes: 'Ready for harvest'
  },
  {
    id: 'K071725-LG-ROM-1A',
    cropType: 'Romaine Lettuce',
    cropId: 1,
    datePlanted: '2024-02-10',
    assignedSystem: 'NFT System 2',
    estimatedHarvestDate: '2024-03-17',
    status: 'harvested',
    actualYield: 2.3,
    harvestDate: '2024-03-16',
    notes: 'Good yield'
  }
];

const CropModal: React.FC<{
  crop: Crop | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (crop: Crop) => void;
}> = ({ crop, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Crop>>({
    name: crop?.name || '',
    category: crop?.category || 'Leafy Green',
    expectedYieldPerTray: crop?.expectedYieldPerTray || 0,
    averageGrowthTime: crop?.averageGrowthTime || 0,
    lightRequirements: crop?.lightRequirements || 'Medium (12-14 hours)',
    status: crop?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: crop?.id || Date.now(),
      ...formData
    } as Crop);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{crop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Crop Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leafy Green">Leafy Green</SelectItem>
                <SelectItem value="Microgreen">Microgreen</SelectItem>
                <SelectItem value="Herb">Herb</SelectItem>
                <SelectItem value="Vegetable">Vegetable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yield">Expected Yield Per Tray (lbs)</Label>
            <Input
              id="yield"
              type="number"
              step="0.1"
              value={formData.expectedYieldPerTray}
              onChange={(e) => setFormData({ ...formData, expectedYieldPerTray: parseFloat(e.target.value) })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="growthTime">Average Growth Time (days)</Label>
            <Input
              id="growthTime"
              type="number"
              value={formData.averageGrowthTime}
              onChange={(e) => setFormData({ ...formData, averageGrowthTime: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lightRequirements">Light Requirements</Label>
            <Select value={formData.lightRequirements} onValueChange={(value) => setFormData({ ...formData, lightRequirements: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select light requirements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low (8-10 hours)">Low (8-10 hours)</SelectItem>
                <SelectItem value="Medium (12-14 hours)">Medium (12-14 hours)</SelectItem>
                <SelectItem value="Medium (14-16 hours)">Medium (14-16 hours)</SelectItem>
                <SelectItem value="High (16-18 hours)">High (16-18 hours)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2D8028] hover:bg-[#203B17]">
              {crop ? 'Update' : 'Create'} Crop
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ProductionDashboard: React.FC<{
  trays: Tray[];
  crops: Crop[];
  onUpdateTray: (tray: Tray) => void;
}> = ({ trays, crops, onUpdateTray }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      growing: { label: 'Growing', className: 'bg-blue-100 text-blue-800' },
      'ready-to-harvest': { label: 'Ready to Harvest', className: 'bg-yellow-100 text-yellow-800' },
      harvested: { label: 'Harvested', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.growing;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const activeTrayCount = trays.filter(t => t.status === 'growing').length;
  const readyToHarvestCount = trays.filter(t => t.status === 'ready-to-harvest').length;
  const harvestedCount = trays.filter(t => t.status === 'harvested').length;
  const totalYield = trays.filter(t => t.actualYield).reduce((sum, t) => sum + (t.actualYield || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trays</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrayCount}</div>
            <p className="text-xs text-muted-foreground">Currently growing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Harvest</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{readyToHarvestCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting harvest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harvested</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{harvestedCount}</div>
            <p className="text-xs text-muted-foreground">Completed trays</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalYield.toFixed(1)} lbs</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Tray Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tray Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Tray ID</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Crop Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Date Planted</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">System</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Est. Harvest</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Yield</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {trays.map((tray) => (
                  <tr key={tray.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-mono text-sm">{tray.id}</td>
                    <td className="border border-gray-200 px-4 py-2">{tray.cropType}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(tray.datePlanted).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">{tray.assignedSystem}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(tray.estimatedHarvestDate).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {getStatusBadge(tray.status)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {tray.actualYield ? `${tray.actualYield} lbs` : '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                      {tray.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CropConfiguration: React.FC<{
  crops: Crop[];
  onAddCrop: () => void;
  onEditCrop: (crop: Crop) => void;
  onDeleteCrop: (cropId: number) => void;
}> = ({ crops, onAddCrop, onEditCrop, onDeleteCrop }) => {
  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      'Leafy Green': { className: 'bg-green-100 text-green-800' },
      'Microgreen': { className: 'bg-blue-100 text-blue-800' },
      'Herb': { className: 'bg-purple-100 text-purple-800' },
      'Vegetable': { className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig['Leafy Green'];
    return <Badge className={config.className}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Crop Configuration</h2>
        <Button onClick={onAddCrop} className="bg-[#2D8028] hover:bg-[#203B17]">
          <Plus className="h-4 w-4 mr-2" />
          Add New Crop
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map((crop) => (
          <Card key={crop.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{crop.name}</CardTitle>
                  {getCategoryBadge(crop.category)}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCrop(crop)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCrop(crop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Yield:</span>
                  <span className="font-medium">{crop.expectedYieldPerTray} lbs/tray</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth Time:</span>
                  <span className="font-medium">{crop.averageGrowthTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Light Requirements:</span>
                  <span className="font-medium">{crop.lightRequirements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={crop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {crop.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProductionData: React.FC = () => {
  const auth = getStoredAuth();
  const isCorporateManager = auth.user?.role === 'corporate';
  const isManager = auth.user?.role === 'manager' || isCorporateManager;
  const { toast } = useToast();

  const [crops, setCrops] = useState<Crop[]>(mockCrops);
  const [trays, setTrays] = useState<Tray[]>([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  // Initialize trays from TrayService
  useEffect(() => {
    setTrays(TrayService.getAllTrays());
  }, []);

  // Listen for tray updates
  useEffect(() => {
    const handleTrayAdded = (event: any) => {
      setTrays(prevTrays => [...prevTrays, event.detail]);
    };
    
    const handleTrayUpdated = () => {
      setTrays(TrayService.getAllTrays());
    };
    
    window.addEventListener('trayAdded', handleTrayAdded);
    window.addEventListener('trayUpdated', handleTrayUpdated);
    
    return () => {
      window.removeEventListener('trayAdded', handleTrayAdded);
      window.removeEventListener('trayUpdated', handleTrayUpdated);
    };
  }, []);

  const handleAddCrop = () => {
    setEditingCrop(null);
    setShowCropModal(true);
  };

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setShowCropModal(true);
  };

  const handleSaveCrop = (crop: Crop) => {
    if (editingCrop) {
      setCrops(crops.map(c => c.id === crop.id ? crop : c));
      toast({
        title: "Crop Updated",
        description: "Crop configuration has been updated successfully.",
      });
    } else {
      setCrops([...crops, crop]);
      toast({
        title: "Crop Added",
        description: "New crop has been added to the system.",
      });
    }
    setShowCropModal(false);
    setEditingCrop(null);
  };

  const handleDeleteCrop = (cropId: number) => {
    if (window.confirm('Are you sure you want to delete this crop?')) {
      setCrops(crops.filter(c => c.id !== cropId));
      toast({
        title: "Crop Deleted",
        description: "Crop has been removed from the system.",
      });
    }
  };

  const handleUpdateTray = (tray: Tray) => {
    TrayService.updateTray(tray.id, tray);
  };

  const handleExport = () => {
    const csvContent = [
      ['Tray ID', 'Crop Type', 'Date Planted', 'System', 'Est. Harvest', 'Status', 'Yield', 'Notes'],
      ...trays.map(tray => [
        tray.id,
        tray.cropType,
        new Date(tray.datePlanted).toLocaleDateString(),
        tray.assignedSystem,
        new Date(tray.estimatedHarvestDate).toLocaleDateString(),
        tray.status,
        tray.actualYield ? `${tray.actualYield} lbs` : 'N/A',
        tray.notes || ''
      ])
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 text-center">
              This page is only available to managers and corporate users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#203B17] mb-2">Production Data</h1>
          <p className="text-gray-600">Track crop production and tray management</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleExport} className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className={`grid w-full ${isCorporateManager ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <TabsTrigger value="dashboard">📊 Live Dashboard</TabsTrigger>
          {isCorporateManager && <TabsTrigger value="crops">🌾 Crop Configuration</TabsTrigger>}
          {isCorporateManager && <TabsTrigger value="systems">⚙️ System Configuration</TabsTrigger>}
          <TabsTrigger value="equipment">🏭 Equipment Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <ProductionDashboard 
            trays={trays}
            crops={crops}
            onUpdateTray={handleUpdateTray}
          />
        </TabsContent>
        
        {isCorporateManager && (
          <TabsContent value="crops" className="space-y-4">
            <CropConfiguration
              crops={crops}
              onAddCrop={handleAddCrop}
              onEditCrop={handleEditCrop}
              onDeleteCrop={handleDeleteCrop}
            />
          </TabsContent>
        )}
        
        {isCorporateManager && (
          <TabsContent value="systems" className="space-y-4">
            <SystemConfiguration isCorporateManager={isCorporateManager} />
          </TabsContent>
        )}
        
        <TabsContent value="equipment" className="space-y-4">
          <EquipmentManagement />
        </TabsContent>
      </Tabs>

      {/* Crop Modal */}
      <CropModal
        crop={editingCrop}
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setEditingCrop(null);
        }}
        onSave={handleSaveCrop}
      />
    </div>
  );
};

export default ProductionData;