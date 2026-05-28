import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Box, Tag, Layers, DollarSign, Filter, RefreshCw } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import useDataStore from '../../store/dataStore';

export default function ItemDetails() {
  const { items, isLoading, error, fetchItems } = useDataStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: '',
    brand: '',
    itemName: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch items on mount
  useEffect(() => {
    fetchItems(true);
  }, [fetchItems]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      brand: '',
      itemName: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Unique lists for Filters Dropdowns
  const categoriesList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.Category || i.category))).filter(Boolean).sort();
  }, [items]);

  const brandsList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.BrandName || i.brand))).filter(Boolean).sort();
  }, [items]);

  const itemNamesList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.ItemName || i.name))).filter(Boolean).sort();
  }, [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const cat = item.Category || item.category || '';
      const brnd = item.BrandName || item.brand || '';
      const name = item.ItemName || item.name || '';
      const code = item.ItemCode || item.code || '';

      if (filters.category && cat !== filters.category) return false;
      if (filters.brand && brnd !== filters.brand) return false;
      if (filters.itemName && name !== filters.itemName) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          code.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          brnd.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, filters]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Serial No", "Item Code", "Item Name", "Brand", "Category", "Unit Price / MRP"
  ];

  const renderRow = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const priceVal = Number(item.MRP || item.price || 0);
    return (
      <tr key={item.ItmID || item.code} className="hover:bg-sky-50/25 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-900 font-bold whitespace-nowrap">{item.ItemCode}</td>
        <td className="px-4 py-3 text-justify text-xs font-semibold text-slate-900 whitespace-normal uppercase min-w-[350px]">{item.ItemName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-700 whitespace-nowrap">{item.BrandName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.Category}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{priceVal.toLocaleString('en-IN')}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const priceVal = Number(item.MRP || item.price || 0);
    return (
      <div key={item.ItmID || item.code} className="bg-white rounded-xl border border-sky-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-sky-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              {globalIdx}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.ItemName}</span>
          </div>
          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
            {item.ItemCode}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Category</span>
            <span className="text-gray-700 font-medium">{item.Category}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Brand</span>
            <span className="text-gray-700 font-medium">{item.BrandName}</span>
          </div>
          <div className="col-span-2 pt-1 border-t border-slate-200/30 flex justify-between items-center">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Unit Price / MRP</span>
            <span className="text-emerald-600 font-bold">₹{priceVal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton rendering
  const renderSkeletons = () => {
    return (
      <div className="space-y-4 p-6">
        <div className="flex gap-4 items-center">
          <div className="h-10 bg-slate-100 rounded w-1/3 animate-pulse"></div>
          <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded animate-pulse flex items-center justify-between px-4">
              <div className="h-4 bg-slate-100 rounded w-12"></div>
              <div className="h-4 bg-slate-100 rounded w-24"></div>
              <div className="h-4 bg-slate-100 rounded w-48"></div>
              <div className="h-4 bg-slate-100 rounded w-24"></div>
              <div className="h-4 bg-slate-100 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search items..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
              />
            </div>
            <button
               onClick={() => setShowMobileFilters(!showMobileFilters)}
               className={`lg:hidden flex items-center justify-center rounded-xl shadow-sm h-[38px] w-[38px] flex-shrink-0 transition-all ${showMobileFilters ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'}`}
               title="Toggle Filters"
            >
              <Filter size={15} />
            </button>
            <button
              onClick={() => fetchItems(true)}
              className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-sm transition active:scale-95"
              title="Reload from API"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-sky-600' : ''} />
            </button>
            <button
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200 rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-sm active:scale-95"
              title="Clear Filters"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Filtering dropdowns */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
            {/* Category Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[160px]">
              <SearchableDropdown
                options={categoriesList.map(c => ({ value: c, label: c }))}
                value={filters.category}
                onChange={(val) => setFilters({ ...filters, category: val })}
                placeholder="All Categories"
                className="h-[38px]"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            {/* Brand Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[160px]">
              <SearchableDropdown
                options={brandsList.map(b => ({ value: b, label: b }))}
                value={filters.brand}
                onChange={(val) => setFilters({ ...filters, brand: val })}
                placeholder="All Brands"
                className="h-[38px]"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            {/* Item Name Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[180px]">
              <SearchableDropdown
                options={itemNamesList.map(n => ({ value: n, label: n }))}
                value={filters.itemName}
                onChange={(val) => setFilters({ ...filters, itemName: val })}
                placeholder="All Item Names"
                className="h-[38px]"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="hidden lg:flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200 rounded-xl w-[38px] h-[38px] hover:bg-slate-150 transition-colors shadow-sm"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area using DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={() => fetchItems(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedItems}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1000px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredItems.length}
            itemsPerPageOptions={[50, 100, 200, 500, 1000]}
          />
        )}
      </div>

    </div>
  );
}
