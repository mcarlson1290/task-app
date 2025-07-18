import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { GrowingSystem } from '@shared/schema';
import { SystemEditModal } from './SystemEditModal';

interface SystemConfigurationProps {
  isCorporateManager: boolean;
}

const SystemConfiguration: React.FC<SystemConfigurationProps> = ({ isCorporateManager }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSystem, setEditingSystem] = useState<GrowingSystem | null>(null);
  const [showAddSystem, setShowAddSystem] = useState(false);

  const { data: systems = [], isLoading } = useQuery<GrowingSystem[]>({
    queryKey: ['/api/growing-systems'],
    queryFn: async () => {
      const response = await fetch('/api/growing-systems');
      if (!response.ok) throw new Error('Failed to fetch growing systems');
      return response.json();
    },
  });

  const deleteSystemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/growing-systems/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/growing-systems'] });
      toast({
        title: 'System Deleted',
        description: 'Growing system has been deleted successfully.',
      });
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (systemData: any) => {
      if (systemData.id) {
        return await apiRequest('PATCH', `/api/growing-systems/${systemData.id}`, systemData);
      } else {
        return await apiRequest('POST', '/api/growing-systems', systemData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/growing-systems'] });
      toast({
        title: 'System Updated',
        description: 'Growing system has been updated successfully.',
      });
    },
  });

  if (!isCorporateManager) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            System configuration is only available to corporate managers.
          </p>
        </div>
      </div>
    );
  }

  const microgreensystems = systems.filter(s => s.type === 'microgreen');
  const leafyGreenSystems = systems.filter(s => s.type === 'leafy-green');

  const handleSystemSave = (systemData: any) => {
    updateSystemMutation.mutate(systemData);
    setEditingSystem(null);
    setShowAddSystem(false);
  };

  const SystemList = ({ systems, category }: { systems: GrowingSystem[], category: string }) => (
    <div className="space-y-3">
      {systems.map((system) => (
        <Card key={system.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{system.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{system.category}</Badge>
                  <Badge variant="outline">
                    {system.currentOccupancy}/{system.capacity || '∞'} occupied
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSystem(system)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSystemMutation.mutate(system.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600">
              {system.systemData && (
                <div className="space-y-1">
                  {system.systemData.sections && (
                    <p>Sections: {Object.keys(system.systemData.sections).length}</p>
                  )}
                  {system.systemData.units && (
                    <p>Units: {system.systemData.units.length}</p>
                  )}
                  {system.systemData.channels && (
                    <p>Channels: {system.systemData.channels.length}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return <div className="p-6">Loading system configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">🏭 Growing System Configuration</h3>
          <p className="text-gray-600">Configure and manage growing systems for automated task generation</p>
        </div>
        <button 
          onClick={() => setShowAddSystem(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add System
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">🌱 Microgreen Systems</h4>
          <SystemList systems={microgreensystems} category="microgreens" />
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">🥬 Leafy Green Systems</h4>
          <SystemList systems={leafyGreenSystems} category="leafyGreens" />
        </div>
      </div>

      {systems.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Systems Configured</h3>
          <p className="text-gray-600 mb-4">
            Configure your first growing system to enable automated task generation.
          </p>
          <Button 
            onClick={() => setShowAddSystem(true)}
            className="bg-[#2D8028] hover:bg-[#203B17]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add System
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddSystem || editingSystem) && (
        <SystemEditModal
          system={editingSystem}
          onSave={handleSystemSave}
          onClose={() => {
            setEditingSystem(null);
            setShowAddSystem(false);
          }}
        />
      )}
    </div>
  );
};

export default SystemConfiguration;