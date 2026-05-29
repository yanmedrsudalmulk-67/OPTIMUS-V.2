import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Pilih opsi...', label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(query.toLowerCase()));

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="min-h-[48px] w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 cursor-pointer shadow-3xs flex flex-wrap items-center gap-2 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-xs font-semibold px-1">{placeholder}</span>
        ) : (
          selected.map(item => (
            <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold shadow-sm">
              {item}
              <button 
                type="button"
                onClick={(e) => removeOption(e, item)}
                className="hover:bg-emerald-200/60 p-0.5 rounded-full transition-colors text-emerald-600 hover:text-emerald-950"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto pointer-events-none">
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-gray-100 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs outline-none focus:ring-0"
              placeholder="Cari..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-emerald-100">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500 font-medium">Tidak ada hasil</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <div 
                    key={option}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50/70 rounded-lg cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(option);
                    }}
                  >
                    <div className={`w-4 h-4 rounded-[4px] border border-gray-300 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white'}`}>
                      {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{option}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
