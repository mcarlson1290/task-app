import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@shared/schema";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { itemId: number; quantity: number; unitCost: number; supplier: string; notes: string }) => Promise<void>;
}

export interface AddStockData {
  itemId: number;
  quantity: number;
  unitCost: number;
  supplier: string;
  notes: string;
}

const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const selectedItem = inventory.find(item => item.id === selectedItemId);
  const unitCost = quantity > 0 && totalCost > 0 ? totalCost / quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId || quantity <= 0 || totalCost <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        itemId: selectedItemId,
        quantity: quantity,
        unitCost: unitCost,
        supplier: supplier,
        notes: notes
      });
      
      // Reset form
      setSelectedItemId(null);
      setQuantity(0);
      setTotalCost(0);
      setSupplier('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error("Failed to add stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📦 Add Stock
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item">Select Item *</Label>
            <Select
              value={selectedItemId?.toString() || ''}
              onValueChange={(value) => setSelectedItemId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an item..." />
              </SelectTrigger>
              <SelectContent>
                {inventory.map(item => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    [{item.sku || item.productCode}] {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stock Display */}
          {selectedItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Current Stock:</strong> {selectedItem.currentStock} {selectedItem.unit}
              </div>
              <div className="text-sm text-blue-600">
                <strong>Category:</strong> {selectedItem.category}
              </div>
            </div>
          )}

          {/* Quantity to Add */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity || ''}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder={selectedItem ? `Amount in ${selectedItem.unit}` : "0"}
              required
            />
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
              value={totalCost || ''}
              onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
            <div className="text-sm text-gray-500">
              Enter the total amount paid for this quantity
            </div>
          </div>

          {/* Cost Per Unit (calculated) */}
          {quantity > 0 && totalCost > 0 && selectedItem && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <strong>Cost Per Unit:</strong> ${unitCost.toFixed(3)} / {selectedItem.unit}
              </div>
              <div className="text-sm text-green-600">
                <strong>New Total Stock:</strong> {(selectedItem.currentStock + quantity).toFixed(2)} {selectedItem.unit}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this restock"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#2D8028] hover:bg-[#203B17]"
              disabled={!selectedItemId || quantity <= 0 || totalCost <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockModal;