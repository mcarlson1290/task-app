import React, { useState, useRef, useEffect } from 'react';

interface AssignmentOption {
  value: string;
  label: string;
  type: 'none' | 'special' | 'role' | 'user';
  staffCount?: number;
  roles?: string[];
  searchText?: string;
}

interface AssignmentOptions {
  special: AssignmentOption[];
  roles: AssignmentOption[];
  users: AssignmentOption[];
}

interface SearchableAssignmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  assignmentOptions: AssignmentOptions;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableAssignmentSelect: React.FC<SearchableAssignmentSelectProps> = ({
  value,
  onChange,
  assignmentOptions,
  placeholder = "Search or select assignment...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Get all options in a flat list
  const getAllOptions = (): AssignmentOption[] => {
    const options: AssignmentOption[] = [];

    // Add "No default assignment" option
    options.push({
      value: 'no-assignment',
      label: 'No default assignment',
      type: 'none',
      searchText: 'no default assignment none'
    });

    // Add special options
    assignmentOptions.special.forEach(opt => {
      options.push({
        ...opt,
        type: 'special',
        searchText: `${opt.label} all staff`.toLowerCase()
      });
    });

    // Add roles
    assignmentOptions.roles.forEach(opt => {
      options.push({
        ...opt,
        type: 'role',
        searchText: `${opt.label} role`.toLowerCase()
      });
    });

    // Add users
    assignmentOptions.users.forEach(opt => {
      options.push({
        ...opt,
        type: 'user',
        searchText: `${opt.label} ${opt.roles?.join(' ') || ''}`.toLowerCase()
      });
    });

    return options;
  };

  // Filter options based on search
  const filteredOptions = getAllOptions().filter(option =>
    !searchQuery || option.searchText?.includes(searchQuery.toLowerCase())
  );

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value || value === 'no-assignment') return 'No default assignment';

    const allOptions = getAllOptions();
    const selected = allOptions.find(opt => opt.value === value);

    if (selected) {
      if (selected.staffCount !== undefined) {
        return `${selected.label} (${selected.staffCount} ${selected.staffCount === 1 ? 'person' : 'people'})`;
      }
      return selected.label;
    }

    return value;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const selectOption = (option: AssignmentOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(0);
  };

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  if (disabled) {
    return (
      <div className="searchable-select">
        <div className="select-input disabled">
          <div className="select-value">
            {getDisplayText()}
          </div>
          <div className="select-arrow">▼</div>
        </div>
      </div>
    );
  }

  return (
    <div className="searchable-select" ref={dropdownRef}>
      <div
        className="select-input"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <div className="select-value">
          {getDisplayText()}
        </div>
        <div className="select-arrow">▼</div>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <div className="search-box">
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="options-list">
            {filteredOptions.length === 0 ? (
              <div className="no-results">No matches found</div>
            ) : (
              <>
                {/* No assignment option */}
                {filteredOptions.filter(opt => opt.type === 'none').map((option, idx) => (
                  <div
                    key={option.value}
                    className={`option ${highlightedIndex === filteredOptions.indexOf(option) ? 'highlighted' : ''}`}
                    onClick={() => selectOption(option)}
                  >
                    {option.label}
                  </div>
                ))}

                {/* Special options */}
                {filteredOptions.filter(opt => opt.type === 'special').length > 0 && (
                  <div className="option-group-header">All Staff</div>
                )}
                {filteredOptions.filter(opt => opt.type === 'special').map((option) => {
                  const actualIdx = filteredOptions.indexOf(option);
                  return (
                    <div
                      key={option.value}
                      className={`option ${highlightedIndex === actualIdx ? 'highlighted' : ''}`}
                      onClick={() => selectOption(option)}
                    >
                      {option.label} ({option.staffCount} people)
                    </div>
                  );
                })}

                {/* Roles */}
                {filteredOptions.filter(opt => opt.type === 'role').length > 0 && (
                  <div className="option-group-header">Roles</div>
                )}
                {filteredOptions.filter(opt => opt.type === 'role').map((option) => {
                  const actualIdx = filteredOptions.indexOf(option);
                  return (
                    <div
                      key={option.value}
                      className={`option ${highlightedIndex === actualIdx ? 'highlighted' : ''}`}
                      onClick={() => selectOption(option)}
                    >
                      {option.label} ({option.staffCount} {option.staffCount === 1 ? 'person' : 'people'})
                    </div>
                  );
                })}

                {/* Users */}
                {filteredOptions.filter(opt => opt.type === 'user').length > 0 && (
                  <div className="option-group-header">People</div>
                )}
                {filteredOptions.filter(opt => opt.type === 'user').map((option) => {
                  const actualIdx = filteredOptions.indexOf(option);
                  return (
                    <div
                      key={option.value}
                      className={`option ${highlightedIndex === actualIdx ? 'highlighted' : ''}`}
                      onClick={() => selectOption(option)}
                    >
                      {option.label}
                      {option.roles && option.roles.length > 0 && (
                        <span className="option-roles"> - {option.roles.join(', ')}</span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableAssignmentSelect;