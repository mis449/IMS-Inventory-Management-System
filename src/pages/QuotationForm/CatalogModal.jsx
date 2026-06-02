import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, CameraOff, Plus, Minus, Check, ArrowLeft, Filter } from 'lucide-react';
import useDataStore from '../../store/dataStore';

export default function CatalogModal({ isOpen, onClose, onSubmitCart }) {
  const { items } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeBrandFilter, setActiveBrandFilter] = useState('All');
  const [cart, setCart] = useState({}); // { itemCode: { item, qty } }
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    if (isOpen) {
      setCart({});
      setSearchQuery('');
      setActiveFilter('All');
      setActiveBrandFilter('All');
      setCurrentPage(1);
    }
  }, [isOpen]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.Category || i.category))).filter(Boolean).sort();
    return ['All', ...cats];
  }, [items]);

  const brands = useMemo(() => {
    const bnds = Array.from(new Set(items.map(i => i.BrandName || i.brand))).filter(Boolean).sort();
    return ['All', ...bnds];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeFilter !== 'All') {
      result = result.filter(i => (i.Category || i.category) === activeFilter);
    }
    if (activeBrandFilter !== 'All') {
      result = result.filter(i => (i.BrandName || i.brand) === activeBrandFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => {
        const name = (i.ItemName || i.name || '').toLowerCase();
        const code = (i.ItemCode || i.code || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }
    return result;
  }, [items, activeFilter, activeBrandFilter, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddToCart = (item) => {
    const code = item.ItemCode || item.code;
    setCart(prev => {
      const currentQty = prev[code]?.qty || 0;
      return {
        ...prev,
        [code]: { item, qty: currentQty + 1 }
      };
    });
  };

  const handleRemoveFromCart = (itemCode) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemCode].qty > 1) {
        newCart[itemCode].qty -= 1;
      } else {
        delete newCart[itemCode];
      }
      return newCart;
    });
  };

  const handleSubmit = () => {
    const cartItems = Object.values(cart).map(cartItem => ({
      ...cartItem.item,
      selectedQty: cartItem.qty
    }));
    onSubmitCart(cartItems);
    onClose();
  };

  if (!isOpen) return null;

  const totalCartItems = Object.values(cart).reduce((sum, current) => sum + current.qty, 0);

  return createPortal(
    // z-[9999] ensures it overlays everything. inset-0 anchors it to screen.
    <div className="fixed inset-0 lg:left-56 2xl:left-60 z-[9999] bg-slate-50 flex flex-col shadow-2xl overflow-hidden pt-2">
      
      {/* Top Bar (Header) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
        
        {/* Left: Back Button */}
        <button onClick={onClose} className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold shadow-sm">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Form</span>
        </button>
        
        {/* Middle: Search & Filter */}
        <div className="flex-1 max-w-2xl mx-4 flex items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative w-[150px] shrink-0">
            <select 
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-semibold text-slate-700 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>

          {/* Brand Dropdown */}
          <div className="relative w-[150px] shrink-0">
            <select 
              value={activeBrandFilter}
              onChange={(e) => { setActiveBrandFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-semibold text-slate-700 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
              {brands.map(brand => <option key={brand} value={brand}>{brand === 'All' ? 'All Brands' : brand}</option>)}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items by code or name..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm"
            />
          </div>
        </div>

        {/* Right: Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={totalCartItems === 0}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${totalCartItems > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          <Check size={16} /> Submit Cart {totalCartItems > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{totalCartItems}</span>}
        </button>
      </div>

      {/* Main Content (Grid) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {paginatedItems.map(item => {
            const code = item.ItemCode || item.code;
            const name = item.ItemName || item.name;
            const price = Number(item.MRP || item.price || 0);
            const cartData = cart[code];
            const qty = cartData ? cartData.qty : 0;

            return (
              <div key={code} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-2">
                   <span className="text-xs font-black text-sky-700 tracking-tight">{code}</span>
                   <span className="text-[10px] uppercase font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{item.BrandName || item.brand || 'NO BRAND'}</span>
                </div>
                
                <div className="p-3 flex-1 flex flex-col gap-3">
                   <div className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[36px]" title={name}>
                     {name}
                   </div>
                   
                   <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 py-4 min-h-[120px]">
                     {item.imageUrl ? (
                       <img src={item.imageUrl} alt={name} className="max-h-24 object-contain mix-blend-multiply" />
                     ) : (
                       <div className="flex flex-col items-center justify-center text-slate-300">
                         <CameraOff size={24} className="mb-1" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
                       </div>
                     )}
                   </div>
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-slate-500">Price</span>
                     <span className="text-sm font-black text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                  </div>

                  {qty > 0 ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-1 shadow-inner">
                      <button onClick={() => handleRemoveFromCart(code)} className="p-1.5 bg-white text-emerald-600 rounded shadow-sm hover:bg-emerald-100 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-emerald-800 text-sm w-8 text-center">{qty}</span>
                      <button onClick={() => handleAddToCart(item)} className="p-1.5 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full bg-white border border-slate-300 text-slate-700 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg py-1.5 text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {paginatedItems.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 font-medium">
              No items found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pagination Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 absolute bottom-0 left-0 right-0">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Page : <span className="text-slate-900">{currentPage} / {totalPages}</span> 
          <span className="mx-2 text-slate-300">|</span> 
          Records : <span className="text-slate-900">{filteredItems.length}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            Previous
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            Next
          </button>
        </div>
      </div>

    </div>,
    document.body
  );
}
