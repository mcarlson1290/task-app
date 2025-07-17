import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GrowingSystem } from '@shared/schema';

interface SystemConfigurationModalProps {
  system: GrowingSystem | null;
  onSave: (system: GrowingSystem) => void;
  onClose: () => void;
}

export const SystemConfigurationModal: React.FC<SystemConfigurationModalProps> = ({
  system,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: system?.name || '',
    type: system?.type || 'nursery',
    category: system?.category || 'microgreens',
    capacity: system?.capacity || 50,
    currentOccupancy: system?.currentOccupancy || 0,
    location: system?.location || '',
    status: system?.status || 'active',
    notes: system?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: system?.id || Date.now(),
      ...formData
    } as GrowingSystem);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {system ? 'Edit System Configuration' : 'Add New Growing System'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Microgreen Nursery A"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">System Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select system type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nursery">Nursery</SelectItem>
                  <SelectItem value="blackout">Blackout</SelectItem>
                  <SelectItem value="ebbFlow">Ebb & Flow</SelectItem>
                  <SelectItem value="towers">Towers</SelectItem>
                  <SelectItem value="nft">NFT</SelectItem>
                  <SelectItem value="microgreens">Microgreen Racks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="microgreens">Microgreens</SelectItem>
                  <SelectItem value="leafyGreens">Leafy Greens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Total Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentOccupancy">Current Occupancy</Label>
              <Input
                id="currentOccupancy"
                type="number"
                value={formData.currentOccupancy}
                onChange={(e) => setFormData({ ...formData, currentOccupancy: parseInt(e.target.value) })}
                min="0"
                max={formData.capacity}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room A, Bay 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this system..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2D8028] hover:bg-[#203B17]">
              {system ? 'Update' : 'Create'} System
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};