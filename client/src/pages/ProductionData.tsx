import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { Download, AlertTriangle, Sprout, Calendar, TrendingUp, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrayService, ProductionTray } from "@/services/trayService";
import SystemConfiguration from "@/components/SystemConfiguration";
import { EquipmentManagement } from "@/components/EquipmentManagement";
import TrayTracking from "@/pages/TrayTracking";

interface Crop {
  id: number;
  name: string;
  category: string;
  expectedYieldPerTray: number;
  averageGrowthTime: number;
  lightRequirements: string;
  status: string;
  checklistTemplate: any;
}

interface Tray {
  id: string;
  cropType: string;
  cropId?: number;
  datePlanted: string;
  assignedSystem: string;
  estimatedHarvestDate: string;
  status: string;
  actualYield?: number;
  notes?: string;
}

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
  trays: ProductionTray[];
  crops: Crop[];
  onUpdateTray: (tray: ProductionTray) => void;
}> = ({ trays, crops, onUpdateTray }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      growing: { label: 'Growing', className: 'bg-blue-100 text-blue-800' },
      split: { label: 'Split', className: 'bg-purple-100 text-purple-800' },
      harvested: { label: 'Harvested', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Calculate metrics from actual tray data
  const activeTrayCount = trays.filter(t => t.status === 'active' || t.status === 'growing').length;
  const readyToHarvestCount = trays.filter(t => {
    // Ready if planted more than expected growth time ago
    const plantedDate = new Date(t.datePlanted);
    const daysGrowing = Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    return t.status === 'growing' && daysGrowing >= 25; // Approximate ready threshold
  }).length;
  const harvestedCount = trays.filter(t => t.status === 'harvested').length;
  const totalTrayCount = trays.length;

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
            <CardTitle className="text-sm font-medium">Total Trays</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrayCount}</div>
            <p className="text-xs text-muted-foreground">All trays tracked</p>
          </CardContent>
        </Card>
      </div>



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
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const [crops, setCrops] = useState<Crop[]>(mockCrops);
  const [trays, setTrays] = useState<ProductionTray[]>([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  
  const tabs = [
    { id: 'dashboard', label: '📊 Live Dashboard', icon: '📊' },
    { id: 'trays', label: '📦 Tray Tracking', icon: '📦' },
    { id: 'equipment', label: '🏭 Equipment', icon: '🏭' },
    ...(isCorporateManager ? [{ id: 'crops', label: '🌾 Crop Config', icon: '🌾' }] : []),
    ...(isCorporateManager ? [{ id: 'systems', label: '⚙️ System Config', icon: '⚙️' }] : [])
  ];

  // Check scroll indicators
  useEffect(() => {
    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs.length]);
  
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      // Check scroll indicators after scrolling
      setTimeout(() => {
        if (tabsRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
          setShowLeftScroll(scrollLeft > 0);
          setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
        }
      }, 300);
    }
  };

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
        <div></div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleExport} className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Horizontal Scrolling Tabs */}
      <div className="tab-navigation-wrapper relative">
        {showLeftScroll && (
          <Button 
            variant="outline" 
            size="sm"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md"
            onClick={() => scrollTabs('left')}
          >
            <ChevronLeft size={20} />
          </Button>
        )}
        
        <div 
          className="flex overflow-x-auto scrollbar-hide space-x-2 px-8 pb-2"
          ref={tabsRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setShowLeftScroll(target.scrollLeft > 0);
            setShowRightScroll(target.scrollLeft + target.clientWidth < target.scrollWidth - 5);
          }}
        >
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#2D8028] text-white' : 'bg-white text-gray-600'}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        
        {showRightScroll && (
          <Button 
            variant="outline" 
            size="sm"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md"
            onClick={() => scrollTabs('right')}
          >
            <ChevronRight size={20} />
          </Button>
        )}
      </div>
      
      {/* Tab Content */}
      <div className="tab-content mt-6">
        {activeTab === 'dashboard' && (
          <ProductionDashboard 
            trays={trays}
            crops={crops}
            onUpdateTray={handleUpdateTray}
          />
        )}
        
        {activeTab === 'trays' && (
          <TrayTracking />
        )}
        
        {activeTab === 'equipment' && (
          <EquipmentManagement />
        )}
        
        {activeTab === 'crops' && isCorporateManager && (
          <CropConfiguration
            crops={crops}
            onAddCrop={handleAddCrop}
            onEditCrop={handleEditCrop}
            onDeleteCrop={handleDeleteCrop}
          />
        )}
        
        {activeTab === 'systems' && isCorporateManager && (
          <SystemConfiguration isCorporateManager={isCorporateManager} />
        )}
      </div>

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