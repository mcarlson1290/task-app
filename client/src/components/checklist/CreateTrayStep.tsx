import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import TrayDataService from '../../services/trayDataService';
import { Tray } from '../../data/trayTracking';

interface CreateTrayStepProps {
  stepData: any;
  onComplete: (data: any) => void;
  defaultInstance?: number;
  defaultTrayType?: 'MG' | 'LG' | 'HB';
  defaultSeedsOz?: string;
  defaultGrowingMedium?: string;
  instructions?: string;
}

interface Variety {
  id: string;
  seedId: string;
  seedName: string;
  sku: string;
  quantity: number;
  seedsOz: number;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
}

const CreateTrayStep: React.FC<CreateTrayStepProps> = ({ 
  stepData, 
  onComplete,
  defaultInstance = 1,
  defaultTrayType = 'LG',
  defaultSeedsOz = '',
  defaultGrowingMedium = '',
  instructions = ''
}) => {
  const [selectedSeed, setSelectedSeed] = useState<InventoryItem | null>(null);
  const [trayType, setTrayType] = useState<'MG' | 'LG' | 'HB'>(
    stepData?.config?.defaultTrayType || defaultTrayType
  );
  const [instanceNumber, setInstanceNumber] = useState(
    stepData?.config?.defaultInstance || defaultInstance
  );
  const [seedsOz, setSeedsOz] = useState(
    stepData?.config?.defaultSeedsOz || defaultSeedsOz
  );
  const [growingMedium, setGrowingMedium] = useState(
    stepData?.config?.defaultGrowingMedium === 'user-selects' ? '' : 
    stepData?.config?.defaultGrowingMedium || defaultGrowingMedium
  );
  const [varieties, setVarieties] = useState<Variety[]>([
    { id: '1', seedId: '', seedName: '', sku: '', quantity: 0, seedsOz: 0 }
  ]);
  const [totalSlots, setTotalSlots] = useState(0);
  const [notes, setNotes] = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [availableSeeds, setAvailableSeeds] = useState<InventoryItem[]>([]);
  const [availableVarieties, setAvailableVarieties] = useState<string[]>(['Standard']);
  
  // Calculate total plants
  const totalPlants = varieties.reduce((sum, v) => sum + (parseInt(v.quantity.toString()) || 0), 0);

  // Get current user and location
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const locationCode = currentUser.location === 'kenosha' ? 'K' : 
                      currentUser.location === 'racine' ? 'R' : 
                      currentUser.location === 'milwaukee' ? 'MKE' : 'K';

  // Load seed inventory on mount
  useEffect(() => {
    // Load from the same source as the Inventory page
    fetch('/api/inventory')
      .then(res => res.json())
      .then(inventory => {
        // Filter to only show seeds
        const seeds = inventory.filter((item: InventoryItem) => 
          item.category.toLowerCase().includes('seed')
        );
        setAvailableSeeds(seeds);
      })
      .catch(err => {
        console.error('Failed to load inventory:', err);
        // Fallback: try to load from localStorage if API fails
        const localInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const seeds = localInventory.filter((item: InventoryItem) => 
          item.category.toLowerCase().includes('seed')
        );
        setAvailableSeeds(seeds);
      });
  }, []);

  // Update available varieties when seed type changes
  useEffect(() => {
    if (selectedSeed && selectedSeed.sku) {
      const varietiesBySeed: Record<string, string[]> = {
        'BROC': ['Calabrese', 'De Cicco', 'Waltham 29', 'Standard'],
        'ARU': ['Astro', 'Roquette', 'Wild Rocket', 'Standard'],
        'ROM': ['Parris Island', 'Little Gem', 'Vivian', 'Cos', 'Standard'],
        'BASIL': ['Genovese', 'Sweet', 'Purple Ruffles', 'Lemon', 'Thai', 'Standard'],
        'SPI': ['Space', 'Bloomsdale', 'Giant Winter', 'Standard'],
        'KALE': ['Dwarf Blue Curled', 'Winterbor', 'Red Russian', 'Lacinato', 'Standard'],
        'RADI': ['China Rose', 'Daikon', 'Red Arrow', 'Standard'],
        'SUNF': ['Black Oil', 'Mammoth', 'Standard'],
        'PEAS': ['Dwarf Grey Sugar', 'Oregon Sugar Pod', 'Standard']
      };
      
      const seedVarieties = varietiesBySeed[selectedSeed.sku] || ['Standard'];
      setAvailableVarieties(seedVarieties);
      
      // Reset varieties when seed changes
      setVarieties([{ id: '1', seedId: '', seedName: '', sku: '', quantity: 0, seedsOz: 0 }]);
    } else {
      setAvailableVarieties(['Standard']);
    }
  }, [selectedSeed]);

  // Generate tray ID whenever inputs change
  useEffect(() => {
    const date = new Date();
    const dateStr = 
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getFullYear().toString().slice(2);
    
    // If multiple varieties, use MIX, otherwise use first seed's SKU
    let sku = 'MIX';
    if (varieties.length === 1 && varieties[0].seedId) {
      const seed = availableSeeds.find(s => s.id === varieties[0].seedId);
      if (seed) sku = seed.sku || seed.productCode || 'MIX';
    }
    
    const id = `${locationCode}${dateStr}-${trayType}-${sku}-${instanceNumber}`;
    setGeneratedId(id);
  }, [locationCode, trayType, varieties, instanceNumber, availableSeeds]);

  const addVariety = () => {
    setVarieties([...varieties, { 
      id: Date.now().toString(), 
      seedId: '', 
      seedName: '', 
      sku: '', 
      quantity: 0, 
      seedsOz: 0 
    }]);
  };

  const removeVariety = (id: string) => {
    if (varieties.length > 1) {
      setVarieties(varieties.filter(v => v.id !== id));
    }
  };

  const updateVariety = (id: string, field: keyof Variety, value: any) => {
    setVarieties(varieties.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!growingMedium || totalSlots === 0) {
      alert('Please fill in growing medium and total slots');
      return;
    }

    if (totalPlants > totalSlots) {
      alert(`Total plants (${totalPlants}) exceeds available slots (${totalSlots})`);
      return;
    }

    // Build variety details
    const varietyDetails = varieties
      .filter(v => v.seedId && v.quantity > 0)
      .map(v => {
        const seed = availableSeeds.find(s => s.id === v.seedId);
        return {
          seedId: v.seedId,
          seedName: seed?.name || 'Unknown',
          sku: seed?.sku || '',
          quantity: parseInt(v.quantity.toString()),
          seedsOz: parseFloat(v.seedsOz.toString()) || 0
        };
      });

    if (varietyDetails.length === 0) {
      alert('Please add at least one variety with quantity');
      return;
    }

    // Check inventory for each variety
    for (const variety of varietyDetails) {
      const seed = availableSeeds.find(s => s.id === variety.seedId);
      if (seed && variety.seedsOz > (seed as any).currentStock) {
        alert(`Not enough ${seed.name} in inventory. Available: ${(seed as any).currentStock} ${seed.unit}`);
        return;
      }
    }

    try {
      // Create new tray object with multiple varieties
      const newTray: Tray = {
        id: generatedId,
        cropType: varietyDetails.length === 1 ? varietyDetails[0].seedName : 'Mixed Varieties',
        cropCategory: trayType === 'MG' ? 'microgreens' : 'leafyGreens',
        datePlanted: new Date(),
        expectedHarvest: new Date(Date.now() + (trayType === 'MG' ? 7 : 30) * 24 * 60 * 60 * 1000),
        status: 'seeded',
        currentLocation: {
          systemId: trayType === 'MG' ? 'nursery-A1' : 'staging-B1',
          systemType: trayType === 'MG' ? 'Nursery' : 'Staging',
          spotIds: ['1'],
          movedDate: new Date()
        },
        locationHistory: [{
          systemId: trayType === 'MG' ? 'nursery-A1' : 'staging-B1',
          systemType: trayType === 'MG' ? 'Nursery' : 'Staging',
          spotIds: ['1'],
          movedDate: new Date(),
          movedBy: currentUser.username || 'Unknown',
          reason: 'Initial seeding'
        }],
        plantCount: totalPlants,
        varieties: varietyDetails, // Store variety information
        notes: notes || `Varieties: ${varietyDetails.map(v => `${v.quantity} ${v.seedName} (${v.seedsOz}oz)`).join(', ')}, Medium: ${growingMedium}`,
        createdBy: currentUser.username || 'Unknown',
        createdDate: new Date()
      };

      // Add to tray tracking system using the addTray method
      TrayDataService.addTray(newTray);

      // Deduct inventory for each variety
      for (const variety of varietyDetails) {
        try {
          await fetch('/api/inventory/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId: variety.seedId,
              quantity: variety.seedsOz,
              reason: `Seeded tray ${generatedId}`
            })
          });
          console.log(`Deducted ${variety.seedsOz} oz of ${variety.seedName} from inventory`);
        } catch (err) {
          console.warn('Failed to deduct from API, updating locally:', err);
          // Fallback to local inventory update
          const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
          const updatedInventory = inventory.map((item: InventoryItem) => {
            if (item.id === variety.seedId) {
              return { ...item, currentStock: (item as any).currentStock - variety.seedsOz };
            }
            return item;
          });
          localStorage.setItem('inventory', JSON.stringify(updatedInventory));
        }
      }
      
      console.log('Created tray:', newTray);
      
      // Complete the step with tray data
      onComplete({
        trayId: generatedId,
        varietiesUsed: varietyDetails,
        trayCreated: true,
        ...newTray
      });

    } catch (error) {
      console.error('Failed to create tray:', error);
      alert('Failed to create tray. Please try again.');
    }
  };

  const displayInstructions = stepData?.config?.instructions || instructions;

  return (
    <div className="create-tray-step">
      <h3 className="text-lg font-semibold mb-4">Create New Tray</h3>
      
      {displayInstructions && (
        <div className="instructions bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Instructions:</h4>
          <p className="text-sm text-blue-700">{displayInstructions}</p>
        </div>
      )}
      
      {generatedId && (
        <div className="tray-id-preview bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <strong className="text-green-800">Tray ID:</strong> 
          <span className="font-mono text-lg ml-2">{generatedId}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Type*</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={trayType} 
              onChange={(e) => setTrayType(e.target.value as any)}
            >
              <option value="MG">MG - Microgreens</option>
              <option value="LG">LG - Leafy Greens</option>
              <option value="HB">HB - Herbs</option>
            </select>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Instance #</label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              type="number"
              value={instanceNumber}
              onChange={(e) => setInstanceNumber(parseInt(e.target.value) || 1)}
              min={1}
              max={99}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Growing Medium*</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={growingMedium} 
              onChange={(e) => setGrowingMedium(e.target.value)}
            >
              <option value="">Select Medium</option>
              <option value="Oasis Cubes">Oasis Cubes</option>
              <option value="Rockwool">Rockwool</option>
              <option value="Hemp Mat">Hemp Mat</option>
            </select>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Total Slots Available*</label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              type="number"
              value={totalSlots}
              onChange={(e) => setTotalSlots(parseInt(e.target.value) || 0)}
              placeholder="e.g., 200"
              min={1}
            />
            <small className="text-xs text-gray-500">Rockwool: typically 200, Oasis: varies</small>
          </div>
        </div>

        <div className="varieties-section">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium">Crop Varieties</h4>
            <div className="text-sm text-gray-600">
              Total Plants: <span className="font-medium">{totalPlants}</span> / <span className="font-medium">{totalSlots || '?'}</span>
              {totalSlots > 0 && totalPlants > totalSlots && (
                <span className="ml-2 text-red-600 font-medium">⚠️ Exceeds capacity!</span>
              )}
            </div>
          </div>

          {varieties.map((variety, index) => (
            <div key={variety.id} className="variety-row bg-gray-50 p-3 rounded-lg mb-3">
              <div className="grid grid-cols-4 gap-3">
                <select
                  className="col-span-2 p-2 border border-gray-300 rounded-md"
                  value={variety.seedId}
                  onChange={(e) => {
                    const seed = availableSeeds.find(s => s.id === e.target.value);
                    updateVariety(variety.id, 'seedId', e.target.value);
                    updateVariety(variety.id, 'seedName', seed?.name || '');
                    updateVariety(variety.id, 'sku', seed?.sku || '');
                  }}
                >
                  <option value="">Select seed...</option>
                  {availableSeeds.map(seed => (
                    <option key={seed.id} value={seed.id}>
                      [{seed.sku}] {seed.name}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  value={variety.quantity}
                  onChange={(e) => updateVariety(variety.id, 'quantity', parseInt(e.target.value) || 0)}
                  placeholder="Plants"
                  min={0}
                  className="p-2 border border-gray-300 rounded-md"
                />
                
                <input
                  type="number"
                  value={variety.seedsOz}
                  onChange={(e) => updateVariety(variety.id, 'seedsOz', parseFloat(e.target.value) || 0)}
                  placeholder="Seeds (oz)"
                  step="0.1"
                  min={0}
                  className="p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {varieties.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => removeVariety(variety.id)} 
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <button 
            type="button"
            onClick={addVariety} 
            className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 rounded-md"
          >
            <Plus size={16} /> Add Another Variety
          </button>
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
          />
        </div>

        <button 
          onClick={handleCreate} 
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
          disabled={!growingMedium || totalSlots === 0 || totalPlants === 0}
        >
          Create Multi-Variety Tray
        </button>
      </div>
    </div>
  );
};

export default CreateTrayStep;