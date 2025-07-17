import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { GrowingSystem } from '@shared/schema';

interface SystemEditModalProps {
  system: GrowingSystem | null;
  onSave: (systemData: any) => void;
  onClose: () => void;
}

export const SystemEditModal: React.FC<SystemEditModalProps> = ({ system, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: system?.name || '',
    category: system?.category || 'nursery',
    type: system?.type || 'microgreen',
    capacity: system?.capacity || 0,
    currentOccupancy: system?.currentOccupancy || 0,
    systemData: system?.systemData || {
      sections: {},
      units: [],
      channels: []
    },
    isActive: system?.isActive ?? true
  });

  const systemTypes = {
    microgreen: ['nursery', 'staging', 'final'],
    'leafy-green': ['nursery', 'staging', 'final']
  };

  const handleAddSection = () => {
    const newSection = formData.type === 'microgreen' 
      ? { capacity: 20, occupied: [] }
      : { capacity: 18, crop: null, occupied: [] };
      
    const sectionId = `section-${Date.now()}`;
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        sections: {
          ...formData.systemData.sections,
          [sectionId]: newSection
        }
      }
    });
  };

  const handleAddUnit = () => {
    const newUnit = {
      id: `unit-${Date.now()}`,
      type: 'regular',
      totalPorts: 44,
      occupiedPorts: []
    };
    
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        units: [...(formData.systemData.units || []), newUnit]
      }
    });
  };

  const handleAddChannel = () => {
    const newChannel = {
      id: formData.systemData.channels?.length || 0,
      capacity: 20,
      crop: null,
      occupied: []
    };
    
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        channels: [...(formData.systemData.channels || []), newChannel]
      }
    });
  };

  const updateSection = (sectionId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        sections: {
          ...formData.systemData.sections,
          [sectionId]: {
            ...formData.systemData.sections[sectionId],
            [field]: value
          }
        }
      }
    });
  };

  const updateUnit = (index: number, field: string, value: any) => {
    const units = [...(formData.systemData.units || [])];
    units[index] = { ...units[index], [field]: value };
    
    if (field === 'type') {
      units[index].totalPorts = value === 'HD' ? 176 : 44;
    }
    
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        units
      }
    });
  };

  const updateChannel = (index: number, field: string, value: any) => {
    const channels = [...(formData.systemData.channels || [])];
    channels[index] = { ...channels[index], [field]: value };
    
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        channels
      }
    });
  };

  const removeSection = (sectionId: string) => {
    const sections = { ...formData.systemData.sections };
    delete sections[sectionId];
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        sections
      }
    });
  };

  const removeUnit = (index: number) => {
    const units = [...(formData.systemData.units || [])];
    units.splice(index, 1);
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        units
      }
    });
  };

  const removeChannel = (index: number) => {
    const channels = [...(formData.systemData.channels || [])];
    channels.splice(index, 1);
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        channels
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total capacity based on configuration
    let totalCapacity = 0;
    if (formData.systemData.sections) {
      totalCapacity += Object.values(formData.systemData.sections).reduce((sum, section: any) => sum + section.capacity, 0);
    }
    if (formData.systemData.units) {
      totalCapacity += formData.systemData.units.reduce((sum, unit) => sum + unit.totalPorts, 0);
    }
    if (formData.systemData.channels) {
      totalCapacity += formData.systemData.channels.reduce((sum, channel) => sum + channel.capacity, 0);
    }
    
    const systemData = {
      ...formData,
      capacity: totalCapacity || formData.capacity,
      id: system?.id
    };
    
    onSave(systemData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{system ? 'Edit System' : 'Add New System'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">System Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({
                  ...formData,
                  type: value as any,
                  category: systemTypes[value as keyof typeof systemTypes][0]
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="microgreen">Microgreen</SelectItem>
                  <SelectItem value="leafy-green">Leafy Green</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemTypes[formData.type as keyof typeof systemTypes].map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Manual Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                placeholder="Leave blank for auto-calculation"
              />
            </div>
          </div>

          {/* Configuration based on type */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">System Configuration</h4>
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddSection} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
                <Button type="button" onClick={handleAddUnit} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Unit
                </Button>
                <Button type="button" onClick={handleAddChannel} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Channel
                </Button>
              </div>
            </div>

            {/* Sections */}
            {formData.systemData.sections && Object.keys(formData.systemData.sections).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(formData.systemData.sections).map(([sectionId, section]: [string, any]) => (
                    <div key={sectionId} className="flex items-center gap-3 p-3 border rounded">
                      <Input
                        placeholder="Section ID"
                        value={sectionId}
                        onChange={(e) => {
                          const newSections = { ...formData.systemData.sections };
                          delete newSections[sectionId];
                          newSections[e.target.value] = section;
                          setFormData({
                            ...formData,
                            systemData: { ...formData.systemData, sections: newSections }
                          });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Capacity"
                        value={section.capacity}
                        onChange={(e) => updateSection(sectionId, 'capacity', parseInt(e.target.value))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSection(sectionId)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Units */}
            {formData.systemData.units && formData.systemData.units.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Units (Towers)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.systemData.units.map((unit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      <Input
                        placeholder="Unit ID (e.g., A1)"
                        value={unit.id}
                        onChange={(e) => updateUnit(index, 'id', e.target.value)}
                      />
                      <Select
                        value={unit.type}
                        onValueChange={(value) => updateUnit(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular (44 ports)</SelectItem>
                          <SelectItem value="HD">HD (176 ports)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={unit.totalPorts}
                        onChange={(e) => updateUnit(index, 'totalPorts', parseInt(e.target.value))}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeUnit(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Channels */}
            {formData.systemData.channels && formData.systemData.channels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Channels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.systemData.channels.map((channel, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      <Input
                        type="number"
                        placeholder="Channel ID"
                        value={channel.id}
                        onChange={(e) => updateChannel(index, 'id', parseInt(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Capacity"
                        value={channel.capacity}
                        onChange={(e) => updateChannel(index, 'capacity', parseInt(e.target.value))}
                      />
                      <Input
                        placeholder="Current Crop"
                        value={channel.crop || ''}
                        onChange={(e) => updateChannel(index, 'crop', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeChannel(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2D8028] hover:bg-[#203B17]">
              {system ? 'Update System' : 'Create System'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};