import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddInventoryData) => Promise<void>;
}

export interface AddInventoryData {
  name: string;
  sku: string;
  category: string;
  trackingCategory: string;
  trackingType: string;
  quantity: number;
  unit: string;
  totalCost: number;
  costPerUnit: number;
  supplier: string;
  minimumStock: number;
  location: string;
  notes: string;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [inventoryData, setInventoryData] = useState<AddInventoryData>({
    name: '',
    sku: '',
    category: 'seeds',
    trackingCategory: 'General',
    trackingType: 'exact',
    quantity: 0,
    unit: 'oz',
    totalCost: 0,
    costPerUnit: 0,
    supplier: '',
    minimumStock: 0,
    location: 'K',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCostChange = (field: 'totalCost' | 'quantity', value: string) => {
    const numValue = parseFloat(value) || 0;
    const updates = { ...inventoryData, [field]: numValue };
    
    if (field === 'totalCost' || field === 'quantity') {
      const total = field === 'totalCost' ? numValue : inventoryData.totalCost;
      const qty = field === 'quantity' ? numValue : inventoryData.quantity;
      
      if (qty > 0 && total > 0) {
        updates.costPerUnit = Math.round((total / qty) * 100) / 100; // Round to 2 decimal places
      } else {
        updates.costPerUnit = 0;
      }
    }
    
    setInventoryData(updates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryData.name || !inventoryData.sku || inventoryData.quantity <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(inventoryData);
      // Reset form
      setInventoryData({
        name: '',
        sku: '',
        category: 'seeds',
        trackingCategory: 'General',
        trackingType: 'exact',
        quantity: 0,
        unit: 'oz',
        totalCost: 0,
        costPerUnit: 0,
        supplier: '',
        minimumStock: 0,
        location: 'K',
        notes: ''
      });
      onClose();
    } catch (error) {
      console.error("Failed to add inventory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🌱 Add New Item to Inventory
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              type="text"
              value={inventoryData.name}
              onChange={(e) => setInventoryData({...inventoryData, name: e.target.value})}
              placeholder="e.g., Spinach Seeds - Bloomsdale"
              required
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (4 characters max) *</Label>
            <Input
              id="sku"
              type="text"
              value={inventoryData.sku}
              onChange={(e) => setInventoryData({...inventoryData, sku: e.target.value.toUpperCase().slice(0, 4)})}
              placeholder="SPIN"
              maxLength={4}
              required
            />
            <div className="text-sm text-gray-500">
              4-character code for tray IDs
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={inventoryData.category}
              onValueChange={(value) => setInventoryData({...inventoryData, category: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seeds">Seeds</SelectItem>
                <SelectItem value="nutrients">Nutrients</SelectItem>
                <SelectItem value="farm-supplies">Farm Supplies</SelectItem>
                <SelectItem value="other-supplies">Other Supplies</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Category */}
          <div className="space-y-2">
            <Label htmlFor="trackingCategory">Tracking Category</Label>
            <Select
              value={inventoryData.trackingCategory}
              onValueChange={(value) => setInventoryData({ ...inventoryData, trackingCategory: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tracking category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Microgreen">🌱 Microgreen Supplies</SelectItem>
                <SelectItem value="Leafy Green">🥬 Leafy Green Supplies</SelectItem>
                <SelectItem value="General">📦 General Supplies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity and Unit Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Add *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={inventoryData.quantity || ''}
                onChange={(e) => handleCostChange('quantity', e.target.value)}
                placeholder="50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={inventoryData.unit}
                onValueChange={(value) => setInventoryData({...inventoryData, unit: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oz">oz</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="grams">grams</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pieces">pieces</SelectItem>
                  <SelectItem value="liters">liters</SelectItem>
                  <SelectItem value="gallons">gallons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              type="text"
              value={inventoryData.supplier}
              onChange={(e) => setInventoryData({...inventoryData, supplier: e.target.value})}
              placeholder="e.g., Johnny Seeds"
            />
          </div>

          {/* Total Cost */}
          <div className="space-y-2">
            <Label htmlFor="total-cost">Total Cost Paid ($) *</Label>
            <Input
              id="total-cost"
              type="number"
              min="0.01"
              step="0.01"
              value={inventoryData.totalCost || ''}
              onChange={(e) => handleCostChange('totalCost', e.target.value)}
              placeholder="e.g., 125.00"
              required
            />
            <div className="text-sm text-gray-500">
              Enter the total amount paid for this quantity
            </div>
          </div>

          {/* Minimum Stock Level */}
          <div className="space-y-2">
            <Label htmlFor="minimum-stock">Minimum Stock Level</Label>
            <Input
              id="minimum-stock"
              type="number"
              min="0"
              step="0.1"
              value={inventoryData.minimumStock || ''}
              onChange={(e) => setInventoryData({...inventoryData, minimumStock: parseFloat(e.target.value) || 0})}
              placeholder="0"
            />
            <div className="text-sm text-gray-500">
              Alert when stock falls below this level
            </div>
          </div>

          {/* Calculated Cost Per Unit */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-blue-900">Cost Per Unit (Calculated)</Label>
            <div className="text-xl font-bold text-blue-900">
              ${inventoryData.costPerUnit.toFixed(2)} / {inventoryData.unit}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={inventoryData.notes}
              onChange={(e) => setInventoryData({...inventoryData, notes: e.target.value})}
              placeholder="e.g., Purchased from Supplier X, Invoice #12345"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-[#2D8028] hover:bg-[#203B17]"
              disabled={isSubmitting || !inventoryData.name || !inventoryData.sku || inventoryData.quantity <= 0}
            >
              {isSubmitting ? "Adding..." : "Add New Item"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryModal;