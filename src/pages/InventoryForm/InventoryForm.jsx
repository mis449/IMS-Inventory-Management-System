import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Filter, RefreshCw, Box } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import useDataStore from '../../store/dataStore';

export default function InventoryForm() {
  const { items, isLoading, error, fetchItems, inventorySummary, fetchInventorySummary } = useDataStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    brand: '',
    stockLevel: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);

  // Fetch items on mount
  useEffect(() => {
    fetchItems(true);
    fetchInventorySummary();
  }, [fetchItems, fetchInventorySummary]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      brand: '',
      stockLevel: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const brandsList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.BrandName || i.brand))).filter(Boolean).sort();
  }, [items]);

  // Merge items with DB trigger-driven inventory summary
  const computedStocks = useMemo(() => {
    return items.map(item => {
      const summary = inventorySummary.find(s => s.item_code === item.ItemCode || s.item_code === item.code) || {};

      const openingQty = summary.opening_qty || 0;
      const purchaseQty = summary.purchase_qty || 0;
      const salesQty = summary.sales_qty || 0;
      const purchaseReturnQty = summary.purchase_return_qty || 0;
      const salesReturnQty = summary.sales_return_qty || 0;

      const currentQty = summary.closing_qty || 0;
      const stockLevel = currentQty >= 50 ? 'Stock Full' : 'Stock Low';

      return {
        ...item,
        openingQty,
        purchaseQty,
        salesQty,
        purchaseReturnQty,
        salesReturnQty,
        currentQty,
        stockLevel
      };
    });
  }, [items, inventorySummary]);

  // Apply filters
  const filteredStocks = useMemo(() => {
    return computedStocks.filter(item => {
      const brnd = item.BrandName || item.brand || '';
      const name = item.ItemName || item.name || '';
      const code = item.ItemCode || item.code || '';

      if (filters.brand && brnd !== filters.brand) return false;
      if (filters.stockLevel && item.stockLevel !== filters.stockLevel) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          code.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          brnd.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [computedStocks, filters]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Serial No", "Item Code", "Item Name", "Brand", "Unit Price / MRP", 
    "Opening Qty", "Purchase Qty", "Sales Qty", "Purchase Return Qty", "Sales Return Qty", "Current Qty", "Stock Level"
  ];

  const renderRow = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';
    const priceVal = Number(item.MRP || 0);

    return (
      <tr key={item.ItmID || item.ItemCode} className="hover:bg-sky-50/50 transition-colors border-b border-slate-100 cursor-pointer">
        <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-900 font-bold whitespace-nowrap">{item.ItemCode}</td>
        <td className="px-4 py-3 text-justify text-xs font-semibold text-slate-900 whitespace-normal uppercase min-w-[350px]">{item.ItemName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.BrandName}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">₹{priceVal.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-500 font-bold whitespace-nowrap">{item.openingQty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">+{item.purchaseQty}</td>
        <td className="px-4 py-3 text-center text-xs text-rose-600 font-bold whitespace-nowrap">-{item.salesQty}</td>
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-bold whitespace-nowrap">-{item.purchaseReturnQty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-500 font-bold whitespace-nowrap">+{item.salesReturnQty}</td>
        <td className="px-4 py-3 text-center text-xs text-sky-600 font-black whitespace-nowrap bg-sky-50/25">{item.currentQty}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
            isFull ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {item.stockLevel}
          </span>
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';
    const priceVal = Number(item.MRP || 0);

    return (
      <div key={item.ItmID || item.ItemCode} className="bg-white rounded-lg border border-slate-100 shadow-sm p-2.5 space-y-1.5 transition-all hover:shadow-md hover:border-sky-100 cursor-pointer">
        <div className="flex justify-between items-center pb-1.5 border-b border-slate-50">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 flex-shrink-0">
              {globalIdx}
            </span>
            <span className="text-[10px] font-bold text-slate-900 uppercase truncate">{item.ItemName}</span>
          </div>
          <span className="bg-slate-50 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex-shrink-0 ml-1">
            {item.ItemCode}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-50 rounded-md p-1.5 border border-slate-100/50">
          <div>
            <span className="text-slate-400 block uppercase text-[7px] tracking-tight">Brand</span>
            <span className="text-slate-700 font-medium truncate block">{item.BrandName}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[7px] tracking-tight">Unit Price</span>
            <span className="text-slate-700 font-medium">₹{priceVal.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[7px] tracking-tight">Purchase / Sales</span>
            <span className="text-slate-700 font-medium"><span className="text-emerald-600 font-bold">+{item.purchaseQty}</span> / <span className="text-rose-600 font-bold">-{item.salesQty}</span></span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[7px] tracking-tight">Current Qty</span>
            <span className="text-sky-600 font-bold">{item.currentQty}</span>
          </div>
        </div>

        <div className="flex justify-end items-center border-t border-slate-100 pt-1.5 text-[10px]">
          <span className={`px-1.5 py-0.5 rounded text-[7px] uppercase font-black ${
            isFull ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {item.stockLevel}
          </span>
        </div>
      </div>
    );
  };

  const renderSkeletons = () => {
    return (
      <div className="space-y-4 p-6">
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
      
      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        
        <div className="flex flex-col lg:flex-row w-full lg:flex-[2] gap-2 lg:gap-3 items-center justify-end">
          
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search inventory..."
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
              onClick={() => { fetchItems(true); fetchInventorySummary(); }}
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

          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
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

            <div className="flex-1 min-w-0 lg:min-w-[160px]">
              <SearchableDropdown
                options={[
                  { value: 'Stock Full', label: 'Stock Full (Green)' },
                  { value: 'Stock Low', label: 'Stock Low (Red)' }
                ]}
                value={filters.stockLevel}
                onChange={(val) => setFilters({ ...filters, stockLevel: val })}
                placeholder="All Stock Levels"
                className="h-[38px]"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            <div className="flex-1 min-w-0 lg:min-w-[130px]">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none font-medium text-slate-600"
              >
                {[200, 400, 600, 800, 1000].map(val => (
                  <option key={val} value={val}>{val} / page</option>
                ))}
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-xl w-[38px] h-[38px] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                &lt;
              </button>
              <span className="text-xs font-bold text-slate-600 w-12 text-center">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages || 1, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-xl w-[38px] h-[38px] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                &gt;
              </button>
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

      {/* Main Stock Table */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={() => fetchItems(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedStocks}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1400px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredStocks.length}
            itemsPerPageOptions={[200, 400, 600, 800, 1000]}
            hidePagination={true}
          />
        )}
      </div>

    </div>
  );
}
