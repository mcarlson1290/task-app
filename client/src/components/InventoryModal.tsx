import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { InventoryItem } from "@shared/schema";

interface InventoryModalProps {
  item: InventoryItem | null;
  mode: 'add' | 'edit';
  isOpen: boolean;
  onSave: (itemData: any) => void;
  onDelete?: (itemId: number) => void;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  item,
  mode,
  isOpen,
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && item) {
      // Handle null values properly - convert null to number or use 0 as fallback
      const currentStock = typeof item.currentStock === 'number' ? item.currentStock : (item.currentStock || 0);
      const minimumStock = typeof item.minimumStock === 'number' ? item.minimumStock : (item.minimumStock || 0);
      
      return {
        name: item.name,
        sku: item.sku || (item as any).productCode || '',
        currentStock: currentStock,
        unit: item.unit,
        minimumStock: minimumStock,
        category: item.category,
        supplier: item.supplier || '',
        estimatedTotalValue: item?.totalValue?.toString() || '' // Not shown for edit mode
      };
    }
    return {
      name: '',
      sku: '',
      currentStock: 0,
      unit: 'units',
      minimumStock: 0,
      category: 'other-supplies',
      supplier: '',
      estimatedTotalValue: ''
    };
  });

  // Update form data when item changes OR when modal opens
  useEffect(() => {
    if (mode === 'edit' && item) {
      console.log('Edit form - item data:', item); // Debug log
      console.log('Available fields:', Object.keys(item)); // Debug log
      
      // Handle null values properly - convert null to number or use 0 as fallback
      const currentStock = typeof item.currentStock === 'number' ? item.currentStock : (item.currentStock || 0);
      const minimumStock = typeof item.minimumStock === 'number' ? item.minimumStock : (item.minimumStock || 0);
      
      console.log('Current stock value:', currentStock, 'Minimum stock value:', minimumStock); // Debug log
      
      const newFormData = {
        name: item.name,
        sku: item.sku || (item as any).productCode || '',
        currentStock: currentStock,
        unit: item.unit,
        minimumStock: minimumStock,
        category: item.category,
        supplier: item.supplier || '',
        estimatedTotalValue: '' // Not used in edit mode
      };
      
      console.log('Setting form data:', newFormData); // Debug log
      setFormData(newFormData);
    } else if (mode === 'add') {
      setFormData({
        name: '',
        sku: '',
        currentStock: 0,
        unit: 'units',
        minimumStock: 0,
        category: 'other-supplies',
        supplier: '',
        estimatedTotalValue: ''
      });
    }
  }, [item, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }
    
    if (!formData.sku.trim()) {
      alert('Please enter a SKU');
      return;
    }
    
    if (formData.sku.length > 4) {
      alert('SKU must be 4 characters or less');
      return;
    }
    
    if ((formData.currentStock || 0) < 0 || (formData.minimumStock || 0) < 0) {
      alert('Stock quantities cannot be negative');
      return;
    }

    // Validation for add mode with cost tracking
    if (mode === 'add') {
      const stock = parseInt(formData.currentStock.toString()) || 0;
      const totalValue = parseFloat(formData.estimatedTotalValue) || 0;
      
      if (totalValue > 0 && stock === 0) {
        alert('Cannot have a value without any stock quantity');
        return;
      }
      
      if (stock > 0 && totalValue === 0) {
        if (!confirm('Are you sure the total value is $0.00? This will set cost per unit to $0.00')) {
          return;
        }
      }
    }

    // Calculate cost data for new items
    const stock = parseInt((formData.currentStock || 0).toString()) || 0;
    const totalValue = parseFloat(formData.estimatedTotalValue) || 0;
    const costPerUnit = stock > 0 ? totalValue / stock : 0;

    const itemData = {
      ...formData,
      currentStock: stock,
      minimumStock: parseInt(formData.minimumStock.toString()),
      id: item?.id,
      // Add cost tracking fields for new items
      ...(mode === 'add' && {
        avgCostPerUnit: costPerUnit,
        totalValue: totalValue
      })
    };
    
    onSave(itemData);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
        onDelete(item.id);
      }
    }
  };

  const categories = [
    { value: 'seeds', label: 'Seeds' },
    { value: 'nutrients', label: 'Nutrients' },
    { value: 'farm-supplies', label: 'Farm Supplies' },
    { value: 'other-supplies', label: 'Other Supplies' },
    { value: 'equipment', label: 'Equipment' }
  ];

  const units = [
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
    { value: 'oz', label: 'Ounces' },
    { value: 'liters', label: 'Liters' },
    { value: 'packets', label: 'Packets' },
    { value: 'bags', label: 'Bags' },
    { value: 'pieces', label: 'Pieces' }
  ];

  // Calculate cost per unit for display
  const calculateCostPerUnit = () => {
    const stock = parseFloat(formData.currentStock.toString()) || 0;
    const totalValue = parseFloat(formData.estimatedTotalValue) || 0;
    
    if (stock > 0 && totalValue > 0) {
      return (totalValue / stock).toFixed(2);
    }
    return '0.00';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#203B17]">
            {mode === 'edit' ? 'Edit Inventory Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update the inventory item details below.' : 'Enter the details for the new inventory item.'}
          </DialogDescription>
          {/* Debug display for edit mode */}
          {mode === 'edit' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Debug: Stock={formData.currentStock}, Min={formData.minimumStock}
            </div>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Arugula Seeds"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (4 characters max) *</Label>
            <Input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase().slice(0, 4)})}
              placeholder="ARUG"
              maxLength={4}
              required
            />
            <p className="text-sm text-gray-600">4-character code for tray IDs (e.g., ARUG, ROM2, BASL)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value) || 0})}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumStock">Minimum Stock *</Label>
            <Input
              id="minimumStock"
              type="number"
              value={formData.minimumStock}
              onChange={(e) => setFormData({...formData, minimumStock: parseInt(e.target.value) || 0})}
              min="0"
              required
            />
            <p className="text-sm text-gray-600">Alert threshold for low stock</p>
          </div>

          {/* Estimated Total Value field - only for add mode */}
          {mode === 'add' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="estimatedTotalValue">Estimated Total Value ($)</Label>
                <Input
                  id="estimatedTotalValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedTotalValue}
                  onChange={(e) => setFormData({...formData, estimatedTotalValue: e.target.value})}
                  placeholder="e.g., 50.00"
                />
                <p className="text-sm text-gray-600">
                  Enter the estimated total value of your current stock (not per unit)
                </p>
              </div>

              {/* Show calculated cost per unit if both values are entered */}
              {(formData.currentStock || 0) > 0 && formData.estimatedTotalValue && (
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700">
                    Calculated Cost Per {formData.unit}: <span className="text-[#203B17] font-bold">${calculateCostPerUnit()}</span>
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue />
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

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              placeholder="e.g., Green Thumb Seeds"
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {mode === 'edit' && item && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2D8028] hover:bg-[#203B17]">
                {mode === 'edit' ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;