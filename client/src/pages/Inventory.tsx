import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Package, Search, Plus, TrendingDown } from "lucide-react";
import { InventoryItem } from "@shared/schema";

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");

  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "seeds", label: "Seeds" },
    { value: "nutrients", label: "Nutrients" },
    { value: "supplies", label: "Supplies" },
    { value: "equipment", label: "Equipment" },
  ];

  const filteredInventory = React.useMemo(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    return filtered;
  }, [inventory, searchTerm, categoryFilter]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#203B17] mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track supplies and manage stock levels</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button className="bg-[#2D8028] hover:bg-[#203B17] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
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
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inventory..."
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
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={stockStatus.status === "good"}
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Restock
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;
