import React from 'react';
import { StoneShape, StoneType, FilterState } from '../types';
import { X, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from './Button';

interface FilterBarProps {
  isOpen: boolean;
  onClose: () => void;
  shapes: StoneShape[];
  types: StoneType[];
  categories: string[];
  lines: string[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  minPriceGlobal: number;
  maxPriceGlobal: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  isOpen, onClose, shapes, types, categories, lines, filters, setFilters, minPriceGlobal, maxPriceGlobal
}) => {
  
  const handleReset = () => {
    setFilters({
      reference: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      shapeIds: [],
      stoneTypeIds: [],
      line: null,
    });
  };

  const toggleShape = (id: number) => {
    const current = filters.shapeIds;
    const newIds = current.includes(id) 
      ? current.filter(i => i !== id) 
      : [...current, id];
    setFilters({ ...filters, shapeIds: newIds });
  };

  const toggleType = (id: number) => {
    const current = filters.stoneTypeIds;
    const newIds = current.includes(id) 
      ? current.filter(i => i !== id) 
      : [...current, id];
    setFilters({ ...filters, stoneTypeIds: newIds });
  };

  // Drawer classes
  const drawerClasses = `fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const overlayClasses = `fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

  return (
    <>
      <div className={overlayClasses} onClick={onClose} aria-hidden="true" />
      
      <div className={drawerClasses}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gold-100 flex justify-between items-center bg-gold-50">
            <h2 className="text-xl font-serif text-slate-900 flex items-center gap-2">
              <SlidersHorizontal size={20} /> Filtres
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Reference (1st Filter) */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Référence</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={filters.reference || ''}
                  onChange={(e) => setFilters({...filters, reference: e.target.value || null})}
                  placeholder="Rechercher une réf..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Catégorie</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category"
                      checked={filters.category === null}
                      onChange={() => setFilters({...filters, category: null})}
                      className="accent-gold-600 w-4 h-4"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900">Toutes</span>
                  </label>
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category"
                      checked={filters.category === cat}
                      onChange={() => setFilters({...filters, category: cat})}
                      className="accent-gold-600 w-4 h-4"
                    />
                    <span className="text-slate-700 group-hover:text-slate-900">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Prix</h3>
              <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs text-slate-500">Min</label>
                   <input 
                     type="number" 
                     inputMode="numeric"
                     placeholder={minPriceGlobal.toString()}
                     value={filters.minPrice ?? ''}
                     onChange={(e) => {
                       const val = e.target.value;
                       setFilters({...filters, minPrice: val === '' ? null : Number(val)});
                     }}
                     className="w-full border-b border-gold-200 py-1 focus:outline-none focus:border-gold-500 bg-transparent text-sm"
                     aria-label="Prix minimum"
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-xs text-slate-500">Max</label>
                   <input 
                     type="number" 
                     inputMode="numeric"
                     placeholder={maxPriceGlobal.toString()}
                     value={filters.maxPrice ?? ''}
                     onChange={(e) => {
                       const val = e.target.value;
                       setFilters({...filters, maxPrice: val === '' ? null : Number(val)});
                     }}
                     className="w-full border-b border-gold-200 py-1 focus:outline-none focus:border-gold-500 bg-transparent text-sm"
                     aria-label="Prix maximum"
                   />
                 </div>
              </div>
            </div>

            {/* Lines / Collections */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Collection</h3>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:border-gold-500 outline-none"
                value={filters.line || ''}
                onChange={(e) => setFilters({...filters, line: e.target.value || null})}
              >
                <option value="">Toutes les collections</option>
                {lines.map(line => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>
            </div>

            {/* Shape (Multi-select Chips) */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Forme de pierre</h3>
              <div className="flex flex-wrap gap-2">
                {shapes.map(shape => {
                  const isSelected = filters.shapeIds.includes(shape.id);
                  return (
                    <button
                      key={shape.id}
                      onClick={() => toggleShape(shape.id)}
                      className={`text-sm md:text-xs py-1.5 px-3 rounded-full border transition-all duration-200 ${
                        isSelected 
                        ? 'bg-gold-600 text-white border-gold-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-gold-400'
                      }`}
                    >
                      {shape.description}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stone Type (Multi-select Chips - UPDATED to Button style) */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gold-600 mb-3">Type de pierre</h3>
              <div className="flex flex-wrap gap-2">
                {types.map(t => {
                  const isSelected = filters.stoneTypeIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleType(t.id)}
                      className={`text-sm md:text-xs py-1.5 px-3 rounded-full border transition-all duration-200 ${
                        isSelected 
                        ? 'bg-gold-600 text-white border-gold-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-gold-400'
                      }`}
                    >
                      {t.description}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gold-50 border-t border-gold-100 flex gap-3">
             <Button variant="outline" fullWidth onClick={handleReset}>Réinitialiser</Button>
             <Button fullWidth onClick={onClose}>Voir les résultats</Button>
          </div>
        </div>
      </div>
    </>
  );
};