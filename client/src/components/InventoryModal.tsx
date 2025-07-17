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
      return {
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        minimumStock: item.minimumStock,
        category: item.category,
        supplier: item.supplier || ''
      };
    }
    return {
      name: '',
      currentStock: 0,
      unit: 'units',
      minimumStock: 0,
      category: 'supplies',
      supplier: ''
    };
  });

  // Update form data when item changes
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        minimumStock: item.minimumStock,
        category: item.category,
        supplier: item.supplier || ''
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        currentStock: 0,
        unit: 'units',
        minimumStock: 0,
        category: 'supplies',
        supplier: ''
      });
    }
  }, [item, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }
    
    if (formData.currentStock < 0 || formData.minimumStock < 0) {
      alert('Stock quantities cannot be negative');
      return;
    }

    const itemData = {
      ...formData,
      currentStock: parseInt(formData.currentStock.toString()),
      minimumStock: parseInt(formData.minimumStock.toString()),
      id: item?.id
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
    { value: 'supplies', label: 'Supplies' },
    { value: 'equipment', label: 'Equipment' }
  ];

  const units = [
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
    { value: 'liters', label: 'Liters' },
    { value: 'packets', label: 'Packets' },
    { value: 'bags', label: 'Bags' },
    { value: 'pieces', label: 'Pieces' }
  ];

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