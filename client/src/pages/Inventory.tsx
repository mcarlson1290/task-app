import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Package, Search, Plus, TrendingDown, Mail, Edit, DollarSign } from "lucide-react";
import { InventoryItem } from "@shared/schema";
import { getStoredAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import InventoryModal from "@/components/InventoryModal";
import SubHeader from "@/components/SubHeader";

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("name");
  const [showModal, setShowModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = React.useState<'add' | 'edit'>('add');
  const auth = getStoredAuth();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'corporate';
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest("POST", "/api/inventory", itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setShowModal(false);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest("PATCH", `/api/inventory/${itemData.id}`, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setShowModal(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => apiRequest("DELETE", `/api/inventory/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setShowModal(false);
    },
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "seeds", label: "Seeds" },
    { value: "nutrients", label: "Nutrients" },
    { value: "supplies", label: "Supplies" },
    { value: "equipment", label: "Equipment" },
  ];

  // Cost calculation functions
  const getItemCostPerUnit = (item: InventoryItem): number => {
    // Mock cost data - in production, this would come from the database
    const costs = {
      'Arugula Seeds': 0.25,
      'Basil Seeds': 0.30,
      'Lettuce Seeds': 0.20,
      'Spinach Seeds': 0.22,
      'Broccoli Seeds': 0.28,
      'Kale Seeds': 0.26,
      'Hydroponic Nutrient Solution': 0.05,
      'pH Test Kit': 15.00,
      'Growing Trays': 2.50,
      'Grow Lights': 45.00,
      'Pruning Shears': 12.00,
      'Harvesting Containers': 1.75,
      'Seedling Trays': 1.25,
      'Watering System': 85.00,
      'Thermometer': 8.50,
      'Humidity Sensor': 25.00,
    };
    return costs[item.name as keyof typeof costs] || 1.00;
  };

  const getItemTotalValue = (item: InventoryItem): number => {
    return item.currentStock * getItemCostPerUnit(item);
  };

  const getTotalInventoryValue = (): number => {
    return inventory.reduce((total, item) => total + getItemTotalValue(item), 0);
  };

  const filteredInventory = React.useMemo(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(item => item.currentStock <= item.minimumStock);
    }

    // Sort the filtered items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock":
          return a.currentStock - b.currentStock;
        case "category":
          return a.category.localeCompare(b.category);
        case "cost":
          return getItemCostPerUnit(b) - getItemCostPerUnit(a); // Highest cost first
        case "value":
          return getItemTotalValue(b) - getItemTotalValue(a); // Highest value first
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, categoryFilter, showLowStockOnly, sortBy]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minimumStock) {
      return { status: "low", color: "bg-red-100 text-red-800", label: "Low Stock" };
    }
    if (item.currentStock <= item.minimumStock * 1.5) {
      return { status: "warning", color: "bg-yellow-100 text-yellow-800", label: "Warning" };
    }
    return { status: "good", color: "bg-green-100 text-green-800", label: "In Stock" };
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      seeds: "🌱",
      nutrients: "🧪",
      supplies: "📦",
      equipment: "⚙️",
    };
    return icons[category as keyof typeof icons] || "📋";
  };

  const handleReorder = (item: InventoryItem) => {
    const reorderAmount = item.minimumStock * 2; // Default reorder amount
    const subject = `Reorder Request: ${item.name}`;
    const body = `Item: ${item.name}
Current Quantity: ${item.currentStock} ${item.unit}
Minimum Quantity: ${item.minimumStock} ${item.unit}
Requested Reorder Amount: ${reorderAmount} ${item.unit}
Supplier: ${item.supplier || 'TBD'}

Requesting Location: Grow Space Vertical Farm
Requested By: ${auth.user?.name}
Date: ${new Date().toLocaleDateString()}

Please process this reorder request at your earliest convenience.`;

    const mailtoLink = `mailto:accounting@growspace.farm?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveItem = (itemData: any) => {
    if (modalMode === 'edit') {
      updateItemMutation.mutate(itemData);
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const handleDeleteItem = (itemId: number) => {
    deleteItemMutation.mutate(itemId);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubHeader>
        <button className="btn-primary" onClick={handleAddItem}>
          <span>+</span> Add Item
        </button>
        <div className="filter-group flex-grow">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search inventory items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="filter-dropdown" 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="seeds">Seeds</option>
            <option value="nutrients">Nutrients</option>
            <option value="supplies">Supplies</option>
            <option value="equipment">Equipment</option>
          </select>
          <select 
            className="filter-dropdown" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>
        <label className="checkbox-filter">
          <input 
            type="checkbox" 
            checked={showLowStockOnly} 
            onChange={(e) => setShowLowStockOnly(e.target.checked)} 
          />
          Low Stock Only
        </label>
      </SubHeader>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Inventory Value</p>
            <p className="text-xl font-bold text-[#203B17]">
              ${getTotalInventoryValue().toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alerts ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getCategoryIcon(item.category)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.currentStock} {item.unit} remaining
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleReorder(item)}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown by Category */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <DollarSign className="h-5 w-5 mr-2" />
            Inventory Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.slice(1).map((category) => {
              const categoryItems = inventory.filter(item => item.category === category.value);
              const categoryValue = categoryItems.reduce((total, item) => total + getItemTotalValue(item), 0);
              const percentage = getTotalInventoryValue() > 0 ? (categoryValue / getTotalInventoryValue()) * 100 : 0;
              
              return (
                <div key={category.value} className="p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{getCategoryIcon(category.value)}</span>
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{category.label}</h4>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-blue-600">${categoryValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{categoryItems.length} items</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inventory items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="stock">Sort by Stock Level</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
            <SelectItem value="cost">Sort by Cost per Unit</SelectItem>
            <SelectItem value="value">Sort by Total Value</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="lowStock"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="h-4 w-4 text-[#2D8028] rounded border-gray-300 focus:ring-[#2D8028]"
          />
          <label htmlFor="lowStock" className="text-sm text-gray-700 flex items-center whitespace-nowrap">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            Low Stock Only
          </label>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">
            {searchTerm || categoryFilter
              ? "Try adjusting your search or filter"
              : "No inventory items available. Add some items to get started."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                      <div>
                        <h3 className="font-semibold text-[#203B17]">{item.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                      </div>
                    </div>
                    <Badge className={`${stockStatus.color} border-none`}>
                      {stockStatus.label}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Stock</span>
                      <span className="font-medium text-[#203B17]">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Minimum Stock</span>
                      <span className="font-medium text-gray-900">
                        {item.minimumStock} {item.unit}
                      </span>
                    </div>

                    {item.supplier && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Supplier</span>
                        <span className="font-medium text-gray-900">{item.supplier}</span>
                      </div>
                    )}

                    {item.lastRestocked && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Restocked</span>
                        <span className="font-medium text-gray-900">
                          {new Date(item.lastRestocked).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Cost Information */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cost per {item.unit}</span>
                      <span className="font-medium text-green-600">
                        ${getItemCostPerUnit(item).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Value</span>
                      <span className="font-semibold text-[#203B17]">
                        ${getItemTotalValue(item).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[#2D8028] border-[#2D8028] hover:bg-[#2D8028] hover:text-white"
                      onClick={() => handleReorder(item)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Reorder
                    </Button>
                    {isManager && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <InventoryModal
        item={editingItem}
        mode={modalMode}
        isOpen={showModal}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Inventory;
