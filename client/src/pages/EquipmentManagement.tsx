import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Zap, Clock, AlertTriangle, CheckCircle, Settings, TrendingUp, TrendingDown } from "lucide-react";
import SubHeader from "@/components/SubHeader";
import { useLocation } from "@/contexts/LocationContext";
import { getStoredAuth } from "@/lib/auth";

interface SensorReading {
  id: string;
  systemId: string;
  type: 'pH' | 'EC' | 'temperature' | 'humidity' | 'light' | 'co2';
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  optimalMin: number;
  optimalMax: number;
}

interface EquipmentSystem {
  id: string;
  name: string;
  type: 'nursery' | 'nft' | 'towers' | 'microgreens' | 'ebb-flow' | 'blackout';
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'warning';
  currentCrop?: string;
  capacity: number;
  occupied: number;
  lastMaintenance: string;
  nextMaintenance: string;
  sensors: SensorReading[];
}

const EquipmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sensors' | 'maintenance'>('overview');
  const [selectedSystem, setSelectedSystem] = useState<EquipmentSystem | null>(null);
  const [systems, setSystems] = useState<EquipmentSystem[]>([]);
  const { currentLocation } = useLocation();
  const auth = getStoredAuth();
  const isCorporateManager = auth.user?.role === 'corporate';

  // Generate realistic sensor data
  useEffect(() => {
    const generateSensorData = (): EquipmentSystem[] => {
      const systemTypes = ['nursery', 'nft', 'towers', 'microgreens', 'ebb-flow', 'blackout'] as const;
      const crops = ['Lettuce', 'Spinach', 'Kale', 'Broccoli Microgreens', 'Arugula', 'Basil'];
      
      return Array.from({ length: 8 }, (_, i) => {
        const type = systemTypes[i % systemTypes.length];
        const isOnline = Math.random() > 0.1; // 90% online
        const hasWarning = Math.random() > 0.7; // 30% warning
        
        // Generate realistic sensor readings based on system type
        const generateSensorReading = (sensorType: SensorReading['type']): SensorReading => {
          let value: number;
          let optimalMin: number;
          let optimalMax: number;
          let unit: string;
          
          switch (sensorType) {
            case 'pH':
              optimalMin = 5.5;
              optimalMax = 6.5;
              value = 5.5 + Math.random() * 2; // 5.5-7.5
              unit = 'pH';
              break;
            case 'EC':
              optimalMin = 1.2;
              optimalMax = 2.0;
              value = 1.0 + Math.random() * 1.5; // 1.0-2.5
              unit = 'mS/cm';
              break;
            case 'temperature':
              optimalMin = 18;
              optimalMax = 24;
              value = 16 + Math.random() * 12; // 16-28°C
              unit = '°C';
              break;
            case 'humidity':
              optimalMin = 65;
              optimalMax = 75;
              value = 55 + Math.random() * 30; // 55-85%
              unit = '%';
              break;
            case 'light':
              optimalMin = 200;
              optimalMax = 400;
              value = 150 + Math.random() * 350; // 150-500 PPFD
              unit = 'PPFD';
              break;
            case 'co2':
              optimalMin = 800;
              optimalMax = 1200;
              value = 600 + Math.random() * 800; // 600-1400 ppm
              unit = 'ppm';
              break;
            default:
              value = 0;
              optimalMin = 0;
              optimalMax = 100;
              unit = '';
          }
          
          const status: SensorReading['status'] = 
            value < optimalMin || value > optimalMax 
              ? (Math.abs(value - (optimalMin + optimalMax) / 2) > (optimalMax - optimalMin) / 2 ? 'critical' : 'warning')
              : 'normal';
          
          return {
            id: `sensor-${sensorType}-${i}`,
            systemId: `system-${i}`,
            type: sensorType,
            value: Math.round(value * 100) / 100,
            unit,
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            status,
            optimalMin,
            optimalMax
          };
        };
        
        const sensorTypes: SensorReading['type'][] = ['pH', 'EC', 'temperature', 'humidity'];
        if (type !== 'blackout') {
          sensorTypes.push('light');
        }
        if (type === 'nursery' || type === 'nft') {
          sensorTypes.push('co2');
        }
        
        const sensors = sensorTypes.map(generateSensorReading);
        
        // Determine system status based on sensors
        const criticalSensors = sensors.filter(s => s.status === 'critical');
        const warningSensors = sensors.filter(s => s.status === 'warning');
        
        let systemStatus: EquipmentSystem['status'] = 'online';
        if (!isOnline) {
          systemStatus = 'offline';
        } else if (criticalSensors.length > 0) {
          systemStatus = 'warning';
        } else if (warningSensors.length > 0) {
          systemStatus = 'warning';
        }
        
        return {
          id: `system-${i}`,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} System ${i + 1}`,
          type,
          location: currentLocation,
          status: systemStatus,
          currentCrop: Math.random() > 0.3 ? crops[Math.floor(Math.random() * crops.length)] : undefined,
          capacity: 100 + Math.floor(Math.random() * 200),
          occupied: Math.floor(Math.random() * 180),
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 3600000).toISOString(),
          nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 3600000).toISOString(),
          sensors
        };
      });
    };
    
    setSystems(generateSensorData());
    
    // Update sensor readings every 30 seconds
    const interval = setInterval(() => {
      setSystems(prev => prev.map(system => ({
        ...system,
        sensors: system.sensors.map(sensor => ({
          ...sensor,
          value: Math.round((sensor.value + (Math.random() - 0.5) * 0.1) * 100) / 100,
          timestamp: new Date().toISOString()
        }))
      })));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentLocation]);

  const getStatusIcon = (status: EquipmentSystem['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: EquipmentSystem['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSensorIcon = (type: SensorReading['type']) => {
    switch (type) {
      case 'pH':
        return <Droplets className="h-4 w-4" />;
      case 'EC':
        return <Zap className="h-4 w-4" />;
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplets className="h-4 w-4" />;
      case 'light':
        return <Zap className="h-4 w-4" />;
      case 'co2':
        return <Zap className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getSensorStatusColor = (status: SensorReading['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const SystemOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {systems.map((system) => (
          <Card key={system.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSystem(system)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{system.name}</CardTitle>
                <Badge className={getStatusColor(system.status)}>
                  {getStatusIcon(system.status)}
                  {system.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 capitalize">{system.type}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {system.currentCrop && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Crop</span>
                    <span className="font-medium">{system.currentCrop}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capacity</span>
                  <span className="font-medium">{system.occupied}/{system.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#2D8028] h-2 rounded-full" 
                    style={{ width: `${(system.occupied / system.capacity) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {system.sensors.slice(0, 4).map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        {getSensorIcon(sensor.type)}
                        <span className="ml-1 text-xs text-gray-600">{sensor.type}</span>
                      </div>
                      <span className={`text-sm font-medium ${getSensorStatusColor(sensor.status)}`}>
                        {sensor.value}{sensor.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SensorMonitoring = () => (
    <div className="space-y-6">
      {systems.map((system) => (
        <Card key={system.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {system.name}
                <Badge className={`ml-2 ${getStatusColor(system.status)}`}>
                  {getStatusIcon(system.status)}
                  {system.status}
                </Badge>
              </CardTitle>
              <span className="text-sm text-gray-600">{system.currentCrop || 'No crop'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {system.sensors.map((sensor) => (
                <div key={sensor.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getSensorIcon(sensor.type)}
                      <span className="ml-2 font-medium capitalize">{sensor.type}</span>
                    </div>
                    <Badge className={getSensorStatusColor(sensor.status)}>
                      {sensor.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {sensor.value}{sensor.unit}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Optimal: {sensor.optimalMin} - {sensor.optimalMax} {sensor.unit}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        sensor.status === 'normal' ? 'bg-green-500' :
                        sensor.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (sensor.value / (sensor.optimalMax * 1.5)) * 100))}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(sensor.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const MaintenanceSchedule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((system) => {
          const nextMaintenance = new Date(system.nextMaintenance);
          const lastMaintenance = new Date(system.lastMaintenance);
          const daysSinceLastMaintenance = Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
          const daysUntilNextMaintenance = Math.floor((nextMaintenance.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <Card key={system.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{system.name}</CardTitle>
                  <Badge className={
                    daysUntilNextMaintenance < 7 ? 'bg-red-100 text-red-800' :
                    daysUntilNextMaintenance < 14 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {daysUntilNextMaintenance < 0 ? 'Overdue' : `${daysUntilNextMaintenance} days`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Maintenance</span>
                    <span className="font-medium">{daysSinceLastMaintenance} days ago</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Maintenance</span>
                    <span className="font-medium">
                      {daysUntilNextMaintenance < 0 ? 'Overdue' : `In ${daysUntilNextMaintenance} days`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Priority</span>
                    <span className={`font-medium ${
                      daysUntilNextMaintenance < 0 ? 'text-red-600' :
                      daysUntilNextMaintenance < 7 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysUntilNextMaintenance < 0 ? 'Critical' :
                       daysUntilNextMaintenance < 7 ? 'High' :
                       daysUntilNextMaintenance < 14 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  {isCorporateManager && (
                    <div className="pt-3 border-t">
                      <button className="w-full bg-[#2D8028] hover:bg-[#203B17] text-white py-2 px-4 rounded-lg text-sm">
                        Schedule Maintenance
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemOverview />;
      case 'sensors':
        return <SensorMonitoring />;
      case 'maintenance':
        return <MaintenanceSchedule />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className="space-y-6">
      <SubHeader>
        <div className="sub-tabs">
          <button
            className={`sub-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            🏭 System Overview
          </button>
          <button
            className={`sub-tab ${activeTab === 'sensors' ? 'active' : ''}`}
            onClick={() => setActiveTab('sensors')}
          >
            📊 Sensor Monitoring
          </button>
          <button
            className={`sub-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            🔧 Maintenance Schedule
          </button>
        </div>
      </SubHeader>

      {renderContent()}

      {/* System Detail Modal */}
      {selectedSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedSystem.name}</h2>
                <button
                  onClick={() => setSelectedSystem(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">System Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{selectedSystem.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(selectedSystem.status)}>
                        {selectedSystem.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Crop:</span>
                      <span>{selectedSystem.currentCrop || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span>{selectedSystem.occupied}/{selectedSystem.capacity}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Maintenance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Last Maintenance:</span>
                      <span>{new Date(selectedSystem.lastMaintenance).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Maintenance:</span>
                      <span>{new Date(selectedSystem.nextMaintenance).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Live Sensor Readings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSystem.sensors.map((sensor) => (
                    <div key={sensor.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getSensorIcon(sensor.type)}
                          <span className="ml-2 font-medium capitalize">{sensor.type}</span>
                        </div>
                        <Badge className={getSensorStatusColor(sensor.status)}>
                          {sensor.status}
                        </Badge>
                      </div>
                      <div className="text-xl font-bold mb-1">
                        {sensor.value}{sensor.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        Optimal: {sensor.optimalMin} - {sensor.optimalMax} {sensor.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;