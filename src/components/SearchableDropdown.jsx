import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus } from 'lucide-react';

/**
 * SearchableDropdown Component
 * A custom select component with built-in search functionality.
 * 
 * @param {Array} options - Array of { value, label } objects.
 * @param {any} value - Currently selected value.
 * @param {Function} onChange - Callback function when an option is selected.
 * @param {string} placeholder - Text to show when no value is selected.
 * @param {string} className - Additional CSS classes for the container.
 */
const SearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  onAdd, 
  placeholder = "Select option...", 
  className = "",
  height = "h-[38px]",
  rounded = "rounded-xl"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find the label for the current value
  const selectedOption = options.find(opt => opt.value === value);

  // Determine direction based on space
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300; // Estimated max height
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking/touching outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selection Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full bg-white border border-slate-200 ${rounded} px-3 py-2 flex justify-between items-center cursor-pointer hover:border-sky-500 transition-all ${height} shadow-sm group outline-none focus:ring-4 focus:ring-sky-500/10 active:scale-[0.98]`}
      >
        <span className={`text-xs md:text-sm truncate ${selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 group-hover:text-sky-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute left-0 right-0 ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} bg-white border border-slate-200 rounded-xl shadow-xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[200px]`}>
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-[8px] text-slate-400" size={12} />
              <input
                autoFocus
                type="text"
                placeholder="Filter options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-xs md:text-sm focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 text-xs md:text-sm cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors group ${value === opt.value
                      ? 'bg-sky-50/70 text-sky-700 font-bold'
                      : 'text-slate-700'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && (
                    <Check size={14} className="text-sky-600 flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-xs text-center text-slate-400 italic">
                No matching results found
              </div>
            )}
          </div>

          {/* Always visible Add New at the bottom */}
          {onAdd && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
                setIsOpen(false);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
                setIsOpen(false);
              }}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-sky-600 hover:bg-sky-50 transition-all flex items-center justify-center gap-2 bg-white active:bg-sky-100 font-bold text-xs uppercase tracking-wider"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add New Option</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
