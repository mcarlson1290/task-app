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
}

interface Variety {
  id: string;
  name: string;
  percentage: number;
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
  defaultGrowingMedium = ''
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
    stepData?.config?.defaultGrowingMedium || defaultGrowingMedium
  );
  const [varieties, setVarieties] = useState<Variety[]>([
    { id: '1', name: '', percentage: 100 }
  ]);
  const [notes, setNotes] = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [availableSeeds, setAvailableSeeds] = useState<InventoryItem[]>([]);
  const [availableVarieties, setAvailableVarieties] = useState<string[]>(['Standard']);

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
      setVarieties([{ id: '1', name: '', percentage: 100 }]);
    } else {
      setAvailableVarieties(['Standard']);
    }
  }, [selectedSeed]);

  // Generate tray ID whenever inputs change
  useEffect(() => {
    if (selectedSeed && selectedSeed.sku) {
      const date = new Date();
      const dateStr = 
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getFullYear().toString().slice(2);
      
      const id = `${locationCode}${dateStr}-${trayType}-${selectedSeed.sku}-${instanceNumber}`;
      setGeneratedId(id);
    } else {
      setGeneratedId('');
    }
  }, [locationCode, trayType, selectedSeed, instanceNumber]);

  const addVariety = () => {
    setVarieties([...varieties, { id: Date.now().toString(), name: '', percentage: 0 }]);
  };

  const removeVariety = (id: string) => {
    setVarieties(varieties.filter(v => v.id !== id));
  };

  const updateVariety = (id: string, field: 'name' | 'percentage', value: any) => {
    setVarieties(varieties.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!selectedSeed || !seedsOz || !growingMedium) {
      alert('Please select a seed type and fill in all required fields.');
      return;
    }

    // Check if we have enough seeds in inventory
    if (parseFloat(seedsOz) > selectedSeed.quantity) {
      alert(`Not enough ${selectedSeed.name} in inventory. Available: ${selectedSeed.quantity} ${selectedSeed.unit}`);
      return;
    }

    try {
      // Create new tray object matching the Tray interface
      const newTray: Tray = {
        id: generatedId,
        cropType: selectedSeed.name,
        cropCategory: trayType === 'MG' ? 'microgreens' : 'leafyGreens',
        datePlanted: new Date(),
        expectedHarvest: new Date(Date.now() + (trayType === 'MG' ? 7 : 30) * 24 * 60 * 60 * 1000), // 7 days for MG, 30 for LG
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
        plantCount: trayType === 'MG' ? Math.floor(parseFloat(seedsOz) * 1000) : Math.floor(parseFloat(seedsOz) * 200), // Rough estimates
        notes: notes || `Seeds: ${seedsOz}oz ${selectedSeed.name}, Medium: ${growingMedium}`,
        createdBy: currentUser.username || 'Unknown',
        createdDate: new Date()
      };

      // Add to tray tracking system using the addTray method
      TrayDataService.addTray(newTray);

      // Deduct inventory through API if available, otherwise update locally
      try {
        await fetch('/api/inventory/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedSeed.id,
            quantity: parseFloat(seedsOz),
            reason: `Seeded tray ${generatedId}`
          })
        });
        console.log(`Deducted ${seedsOz} ${selectedSeed.unit} of ${selectedSeed.name} from inventory`);
      } catch (err) {
        console.warn('Failed to deduct from API, updating locally:', err);
        // Fallback to local inventory update
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        const updatedInventory = inventory.map((item: InventoryItem) => {
          if (item.id === selectedSeed.id) {
            return { ...item, quantity: item.quantity - parseFloat(seedsOz) };
          }
          return item;
        });
        localStorage.setItem('inventory', JSON.stringify(updatedInventory));
      }
      
      console.log('Created tray:', newTray);
      
      // Complete the step with tray data
      onComplete({
        trayId: generatedId,
        seedsUsed: parseFloat(seedsOz),
        trayCreated: true,
        ...newTray
      });

    } catch (error) {
      console.error('Failed to create tray:', error);
      alert('Failed to create tray. Please try again.');
    }
  };

  return (
    <div className="create-tray-step">
      <h3 className="text-lg font-semibold mb-4">Create New Tray</h3>
      
      {generatedId && (
        <div className="tray-id-preview bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <strong className="text-green-800">Tray ID:</strong> 
          <span className="font-mono text-lg ml-2">{generatedId}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="form-group">
          <label className="block text-sm font-medium mb-2">Select Seed Type*</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedSeed?.id || ''} 
            onChange={(e) => {
              const seed = availableSeeds.find(s => s.id === e.target.value);
              setSelectedSeed(seed || null);
            }}
          >
            <option value="">Select seed...</option>
            {availableSeeds.map(seed => (
              <option key={seed.id} value={seed.id}>
                {seed.name} - {seed.sku} ({seed.quantity} {seed.unit} available)
              </option>
            ))}
          </select>
        </div>

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

        <div className="form-group">
          <label className="block text-sm font-medium mb-2">Seeds Planted (oz)*</label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md"
            type="number"
            value={seedsOz}
            onChange={(e) => setSeedsOz(e.target.value)}
            placeholder="0.5"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium mb-2">Growing Medium*</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md"
            value={growingMedium} 
            onChange={(e) => setGrowingMedium(e.target.value)}
          >
            <option value="">Select Medium</option>
            {trayType === 'MG' ? (
              <>
                <option value="Coco Mat">Coco Mat</option>
                <option value="Hemp Mat">Hemp Mat</option>
                <option value="Burlap">Burlap</option>
              </>
            ) : (
              <>
                <option value="Rockwool">Rockwool</option>
                <option value="Oasis Cubes">Oasis Cubes</option>
                <option value="Coco Coir">Coco Coir</option>
              </>
            )}
          </select>
        </div>

        <div className="varieties-section">
          <label className="block text-sm font-medium mb-2">Varieties</label>
          {varieties.map((variety) => (
            <div key={variety.id} className="grid grid-cols-3 gap-2 mb-2">
              <select
                className="col-span-2 p-2 border border-gray-300 rounded-md"
                value={variety.name}
                onChange={(e) => updateVariety(variety.id, 'name', e.target.value)}
              >
                <option value="">Select variety...</option>
                {availableVarieties.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  type="number"
                  value={variety.percentage}
                  onChange={(e) => updateVariety(variety.id, 'percentage', parseInt(e.target.value) || 0)}
                  placeholder="%"
                  min={0}
                  max={100}
                />
                {varieties.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeVariety(variety.id)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Minus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button 
            type="button"
            onClick={addVariety} 
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md"
          >
            <Plus size={16} /> Add Variety
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
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 transition-colors"
          disabled={!selectedSeed || !seedsOz || !growingMedium}
        >
          Create Tray
        </button>
      </div>
    </div>
  );
};

export default CreateTrayStep;