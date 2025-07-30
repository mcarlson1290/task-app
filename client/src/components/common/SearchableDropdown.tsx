import React, { useState, useEffect, useRef } from 'react';

interface SearchableDropdownProps<T> {
  options: T[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayField: keyof T;
  valueField: keyof T;
  renderOption?: (option: T) => React.ReactNode;
  className?: string;
}

const SearchableDropdown = <T extends Record<string, any>>({ 
  options, 
  value, 
  onChange, 
  placeholder = "Search...",
  displayField,
  valueField,
  renderOption,
  className = ""
}: SearchableDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<T[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Filter options based on search
    const filtered = options.filter(option => {
      const searchFields = [
        option[displayField],
        option[valueField],
        option.id,
        option.cropType,
        option.cropName
      ].filter(Boolean);
      
      return searchFields.some(field => 
        field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    setFilteredOptions(filtered);
  }, [searchTerm, options, displayField, valueField]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const selectedOption = options.find(opt => opt[valueField] === value);
  
  return (
    <div className={`searchable-dropdown ${className}`} ref={dropdownRef}>
      <div 
        className="dropdown-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selected-value">
          {selectedOption ? String(selectedOption[displayField]) : placeholder}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="dropdown-content">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Search trays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          
          <div className="dropdown-options">
            {filteredOptions.length === 0 ? (
              <div className="no-options">No trays found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={String(option[valueField])}
                  className={`dropdown-option ${value === option[valueField] ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(String(option[valueField]));
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {renderOption ? renderOption(option) : String(option[displayField])}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;