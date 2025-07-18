import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InventoryItem } from "@shared/schema";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSave: (data: AddInventoryData) => Promise<void>;
}

export interface AddInventoryData {
  itemId: number;
  quantity: number;
  totalCost: number;
  costPerUnit: number;
  notes: string;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  items,
  onSave
}) => {
  const [inventoryData, setInventoryData] = useState<AddInventoryData>({
    itemId: 0,
    quantity: 0,
    totalCost: 0,
    costPerUnit: 0,
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
    if (!inventoryData.itemId || inventoryData.quantity <= 0 || inventoryData.totalCost <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(inventoryData);
      // Reset form
      setInventoryData({
        itemId: 0,
        quantity: 0,
        totalCost: 0,
        costPerUnit: 0,
        notes: ''
      });
      onClose();
    } catch (error) {
      console.error("Failed to add inventory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = items.find(item => item.id === inventoryData.itemId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📥 Add to Inventory
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item-select">Select Item *</Label>
            <Select
              value={inventoryData.itemId.toString()}
              onValueChange={(value) => setInventoryData({...inventoryData, itemId: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an item..." />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stock Display */}
          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Current Stock</div>
              <div className="text-lg font-semibold text-[#203B17]">
                {selectedItem.currentStock} {selectedItem.unit}
              </div>
              {selectedItem.avgCostPerUnit > 0 && (
                <div className="text-sm text-gray-600">
                  Current avg. cost: ${selectedItem.avgCostPerUnit.toFixed(2)}/{selectedItem.unit}
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={inventoryData.quantity || ''}
              onChange={(e) => handleCostChange('quantity', e.target.value)}
              placeholder="e.g., 50"
              required
            />
            {selectedItem && (
              <div className="text-sm text-gray-500">
                Unit: {selectedItem.unit}
              </div>
            )}
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

          {/* Calculated Cost Per Unit */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-blue-900">Cost Per Unit (Calculated)</Label>
            <div className="text-xl font-bold text-blue-900">
              ${inventoryData.costPerUnit.toFixed(2)}
              {selectedItem && ` / ${selectedItem.unit}`}
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
              disabled={isSubmitting || !inventoryData.itemId || inventoryData.quantity <= 0 || inventoryData.totalCost <= 0}
            >
              {isSubmitting ? "Adding..." : "Add to Inventory"}
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