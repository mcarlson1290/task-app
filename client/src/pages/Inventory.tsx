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
import AddInventoryModal, { AddInventoryData } from "@/components/AddInventoryModal";

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("name");
  const [showModal, setShowModal] = React.useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = React.useState<'add' | 'edit'>('add');
  const [isCostBreakdownOpen, setIsCostBreakdownOpen] = React.useState(true);
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

  const addInventoryMutation = useMutation({
    mutationFn: (data: { itemId: number; quantity: number; unitCost: number; notes: string }) => 
      apiRequest("POST", "/api/inventory/add-stock", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setShowAddInventoryModal(false);
    },
    onError: (error) => {
      console.error("Failed to add inventory:", error);
    },
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "seeds", label: "Seeds" },
    { value: "nutrients", label: "Nutrients" },
    { value: "farm-supplies", label: "Farm Supplies" },
    { value: "other-supplies", label: "Other Supplies" },
    { value: "equipment", label: "Equipment" },
  ];

  const categoryDetails = [
    { id: 'seeds', name: 'Seeds', icon: '🌱', color: '#22c55e' },
    { id: 'nutrients', name: 'Nutrients', icon: '🧪', color: '#3b82f6' },
    { id: 'farm-supplies', name: 'Farm Supplies', icon: '🚜', color: '#f59e0b' },
    { id: 'other-supplies', name: 'Other Supplies', icon: '📦', color: '#8b5cf6' },
    { id: 'equipment', name: 'Equipment', icon: '🔧', color: '#6366f1' }
  ];

  const calculateCategoryTotals = () => {
    const totals = {
      'seeds': { value: 0, count: 0 },
      'nutrients': { value: 0, count: 0 },
      'farm-supplies': { value: 0, count: 0 },
      'other-supplies': { value: 0, count: 0 },
      'equipment': { value: 0, count: 0 }
    };
    
    inventory.forEach(item => {
      const categoryKey = item.category?.toLowerCase().replace(/\s+/g, '-') || 'other-supplies';
      if (totals[categoryKey as keyof typeof totals]) {
        totals[categoryKey as keyof typeof totals].value += getItemTotalValue(item);
        totals[categoryKey as keyof typeof totals].count += 1;
      }
    });
    
    const grandTotal = Object.values(totals).reduce((sum, cat) => sum + cat.value, 0);
    
    // Add percentages
    Object.keys(totals).forEach(category => {
      const cat = category as keyof typeof totals;
      (totals[cat] as any).percentage = grandTotal > 0 
        ? ((totals[cat].value / grandTotal) * 100).toFixed(1)
        : '0.0';
    });
    
    return { totals, grandTotal };
  };

  // Cost calculation functions
  const getItemCostPerUnit = (item: InventoryItem): number => {
    // Use the weighted average cost from the database
    return item.avgCostPerUnit || 0;
  };

  const getItemTotalValue = (item: InventoryItem): number => {
    // Use the total value from the database or calculate it
    return item.totalValue || ((item.currentStock || 0) * getItemCostPerUnit(item));
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
      filtered = filtered.filter(item => (item.currentStock || 0) <= (item.minimumStock || 0));
    }

    // Sort the filtered items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock":
          return (a.currentStock || 0) - (b.currentStock || 0);
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
    const currentStock = item.currentStock || 0;
    const minimumStock = item.minimumStock || 0;
    if (currentStock <= minimumStock) {
      return { status: "low", color: "bg-red-100 text-red-800", label: "Low Stock" };
    }
    if (currentStock <= minimumStock * 1.5) {
      return { status: "warning", color: "bg-yellow-100 text-yellow-800", label: "Warning" };
    }
    return { status: "good", color: "bg-green-100 text-green-800", label: "In Stock" };
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      seeds: "🌱",
      nutrients: "🧪",
      "farm-supplies": "🚜",
      "other-supplies": "📦",
      equipment: "🔧",
      // Legacy support
      supplies: "📦",
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

  const handleAddInventory = async (data: AddInventoryData) => {
    // Transform the data to match API expectations
    const apiData = {
      itemId: data.itemId,
      quantity: data.quantity,
      unitCost: data.costPerUnit, // API expects unitCost, not costPerUnit
      notes: data.notes
    };
    await addInventoryMutation.mutateAsync(apiData);
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
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto bg-gray-50">
      {/* Collapsible Cost Breakdown - At Top */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        {/* Collapsible Header */}
        <div 
          className="flex justify-between items-center px-6 py-5 cursor-pointer select-none hover:bg-gray-50 transition-colors"
          onClick={() => setIsCostBreakdownOpen(!isCostBreakdownOpen)}
        >
          <h2 className="text-lg font-semibold text-[#203B17] flex items-center gap-2 m-0">
            <span className="text-xl">{isCostBreakdownOpen ? '▼' : '▶'}</span>
            💰 Inventory Cost Breakdown
          </h2>
          <div className="text-xl font-bold text-[#203B17]">
            ${calculateCategoryTotals().grandTotal.toFixed(2)}
          </div>
        </div>
        
        {/* Collapsible Content */}
        {isCostBreakdownOpen && (
          <div className="px-6 pb-6 border-t border-gray-200">
            {/* Total Inventory Value Display */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6 text-center mt-6">
              <p className="text-sm text-gray-600 mb-2">Total Inventory Value</p>
              <p className="text-3xl font-bold text-[#203B17]">
                ${calculateCategoryTotals().grandTotal.toFixed(2)}
              </p>
            </div>
            
            {/* Category Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categoryDetails.map((category) => {
                const totals = calculateCategoryTotals().totals;
                const categoryData = totals[category.id as keyof typeof totals];
                return (
                  <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{categoryData.percentage}%</p>
                    <p className="font-bold text-[#203B17] text-sm mb-1">
                      ${categoryData.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{categoryData.count} items</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Single-Line Control Bar */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[300px] w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inventory items or suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        
        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="stock">Sort by Stock</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
            <SelectItem value="cost">Sort by Cost</SelectItem>
            <SelectItem value="value">Sort by Value</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Low stock checkbox */}
        <label className="flex items-center gap-2 whitespace-nowrap px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="h-4 w-4 text-[#2D8028] rounded border-gray-300 focus:ring-[#2D8028]"
          />
          <span className="text-sm text-gray-700 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            Low Stock Only
          </span>
        </label>
        
        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 mx-1"></div>
        
        {/* Action buttons */}
        <button 
          onClick={() => setShowAddInventoryModal(true)}
          className="bg-[#2D8028] hover:bg-[#236622] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          📥 Add to Inventory
        </button>
        
        {isManager && (
          <button 
            onClick={handleAddItem}
            className="bg-[#2D8028] hover:bg-[#236622] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockItems.length > 0 && (
        <div className="mb-10 p-5 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alerts ({lowStockItems.length})
          </h3>
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-red-100 rounded-md shadow-sm">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getCategoryIcon(item.category)}</span>
                  <div>
                    <p className="font-medium text-red-900">{item.name}</p>
                    <p className="text-sm text-red-700">
                      {item.currentStock} {item.unit} remaining • Reorder at {item.minimumStock} {item.unit}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReorder(item)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center gap-1 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Inventory Items Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          📦 All Inventory Items ({filteredInventory.length})
        </h3>





      {/* Inventory Grid */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-20 px-5">
          <div className="text-5xl mb-4">📦</div>
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
                        <p className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                          SKU: {item.sku}
                        </p>
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
      </div>

      {/* Add/Edit Item Modal */}
      <InventoryModal
        item={editingItem}
        mode={modalMode}
        isOpen={showModal}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        onClose={handleCloseModal}
      />

      {/* Add to Inventory Modal */}
      <AddInventoryModal
        isOpen={showAddInventoryModal}
        onClose={() => setShowAddInventoryModal(false)}
        items={inventory}
        onSave={handleAddInventory}
      />
    </div>
  );
};

export default Inventory;
