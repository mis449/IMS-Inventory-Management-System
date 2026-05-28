  import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Box, Eye, Filter, RefreshCw, Layers, CheckCircle, Package } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import ModalView from '../../components/ModalView';
import useDataStore from '../../store/dataStore';

export default function Dasboard() {
  const { items, isLoading, error, fetchItems, transactions, fetchTransactions } = useDataStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: '',
    brand: '',
    stockLevel: '' // 'Stock Full' | 'Stock Low' | ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);

  // Fetch items on mount
  useEffect(() => {
    fetchItems(true);
    fetchTransactions();
  }, [fetchItems, fetchTransactions]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      brand: '',
      stockLevel: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Compile active categories and brands for filtering dropdowns
  const categoriesList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.Category || i.category))).filter(Boolean).sort();
  }, [items]);

  const brandsList = useMemo(() => {
    return Array.from(new Set(items.map(i => i.BrandName || i.brand))).filter(Boolean).sort();
  }, [items]);

  // Compute live stock summary metrics crossing master items catalog with transaction logs
  const computedStocks = useMemo(() => {
    return items.map(item => {
      const openingQty = 0; // Opening Qty must ALWAYS default to 0

      // Extract transaction aggregates
      const itemTx = transactions.filter(t => t.itemCode === item.ItemCode || t.itemCode === item.code);

      const purchaseQty = itemTx
        .filter(t => t.type === 'Purchase')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const salesQty = itemTx
        .filter(t => t.type === 'Sales')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const purchaseReturnQty = itemTx
        .filter(t => t.type === 'Purchase Return')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const salesReturnQty = itemTx
        .filter(t => t.type === 'Sales Return')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      // Current Qty = StockQty (Available Stock) + Opening + Purchase - Sales - Purchase Return + Sales Return
      const currentQty = (item.StockQty || 0) + openingQty + purchaseQty - salesQty - purchaseReturnQty + salesReturnQty;
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
  }, [items, transactions]);

  // Apply filters
  const filteredStocks = useMemo(() => {
    return computedStocks.filter(item => {
      const cat = item.Category || item.category || '';
      const brnd = item.BrandName || item.brand || '';
      const name = item.ItemName || item.name || '';
      const code = item.ItemCode || item.code || '';

      if (filters.category && cat !== filters.category) return false;
      if (filters.brand && brnd !== filters.brand) return false;
      if (filters.stockLevel && item.stockLevel !== filters.stockLevel) return false;

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
  }, [computedStocks, filters]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockAlerts = computedStocks.filter(item => item.currentQty < 50).length;
    const pendingIndents = transactions.filter(t => t.status === 'Pending').length;
    const completedIndents = transactions.filter(t => t.status === 'Completed').length;

    return {
      totalItems,
      lowStockAlerts,
      pendingIndents,
      completedIndents
    };
  }, [items, computedStocks, transactions]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const tableHeaders = [
    "Serial No", "Item Code", "Item Name", "Category", "Brand", "Unit Price / MRP", 
    "Opening Qty", "Purchase Qty", "Sales Qty", "Purchase Return Qty", "Sales Return Qty", "Current Qty", "Stock Level", "Action"
  ];

  const renderRow = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';
    const priceVal = Number(item.MRP || 0);

    return (
      <tr key={item.ItmID || item.ItemCode} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
        <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-900 font-bold whitespace-nowrap">{item.ItemCode}</td>
        <td className="px-4 py-3 text-justify text-xs font-semibold text-slate-900 whitespace-normal uppercase min-w-[350px]">{item.ItemName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.Category}</td>
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
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button 
            onClick={() => handleRowClick(item)}
            className="p-1 text-sky-600 hover:text-sky-900 rounded hover:bg-sky-50 transition"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';
    const priceVal = Number(item.MRP || 0);

    return (
      <div key={item.ItmID || item.ItemCode} className="bg-white rounded-lg border border-slate-100 shadow-sm p-2.5 space-y-1.5 transition-all hover:shadow-md hover:border-sky-100">
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
            <span className="text-slate-400 block uppercase text-[7px] tracking-tight">Category / Brand</span>
            <span className="text-slate-700 font-medium truncate block">{item.Category} ({item.BrandName})</span>
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

        <div className="flex justify-between items-center border-t border-slate-100 pt-1.5 text-[10px]">
          <button 
            onClick={() => handleRowClick(item)}
            className="flex items-center gap-1 text-sky-600 font-bold hover:text-sky-900"
          >
            <Eye size={10} /> View
          </button>
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
      
      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 px-2 sm:px-0">
        
        {/* Total Registered Products */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider block">Total Products</span>
            <span className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{stats.totalItems}</span>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Box size={18} className="md:w-5 md:h-5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{stats.lowStockAlerts}</span>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Package size={18} className={`md:w-5 md:h-5 ${stats.lowStockAlerts > 0 ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Pending Indents */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider block">Pending Indents</span>
            <span className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{stats.pendingIndents}</span>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Layers size={18} className="md:w-5 md:h-5" />
          </div>
        </div>

        {/* Complete Indents */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 md:p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider block">Complete Indents</span>
            <span className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{stats.completedIndents}</span>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle size={18} className="md:w-5 md:h-5" />
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="border-b border-slate-100 mx-2 sm:mx-0"></div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          {/* Search items box */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search stock catalog..."
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

            {/* Stock Level Alert Dropdown */}
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

            {/* Pagination Dropdown */}
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

            {/* Pagination Arrows */}
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

      {/* Item Details Drawer/Modal */}
      {selectedItem && (
        <ModalView
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Product Specifications: ${selectedItem.ItemCode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase">{selectedItem.ItemName}</h3>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{selectedItem.Category} &bull; {selectedItem.BrandName}</span>
              </div>
              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold rounded">
                ID: {selectedItem.ItmID}
              </span>
            </div>

            {/* Grid specifications */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">Brand / Category</span>
                <span className="text-gray-800 font-bold">{selectedItem.BrandName || '-'} / {selectedItem.Category || '-'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">UOM / Unit Size</span>
                <span className="text-gray-800 font-bold">{selectedItem.UOM || 'PCS'} / {selectedItem.Size || 'Standard'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">Color / Weight</span>
                <span className="text-gray-800 font-bold">{selectedItem.Color || 'N/A'} / {selectedItem.Weight ? `${selectedItem.Weight} kg` : '-'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-semibold">HSN Code / Packing</span>
                <span className="text-gray-800 font-bold">{selectedItem.HSNCode || '-'} / {selectedItem.Packing || '-'}</span>
              </div>
            </div>

            {/* Inventory Levels */}
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Live Inventory Balance</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded">
                  <span className="text-[8px] uppercase text-emerald-600 font-bold block">Available Stock</span>
                  <span className="text-sm font-black text-emerald-700">{(selectedItem.StockQty || 0)}</span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-2 rounded">
                  <span className="text-[8px] uppercase text-blue-600 font-bold block">Reserved Qty</span>
                  <span className="text-sm font-black text-blue-700">{selectedItem.ReservedQty || 0}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 p-2 rounded">
                  <span className="text-[8px] uppercase text-amber-600 font-bold block">Display Qty</span>
                  <span className="text-sm font-black text-amber-700">{selectedItem.DisplayQty || 0}</span>
                </div>
                <div className="bg-sky-50/50 border border-sky-100 p-2 rounded">
                  <span className="text-[8px] uppercase text-sky-600 font-bold block">Current Stock</span>
                  <span className="text-sm font-black text-sky-700">{selectedItem.currentQty || 0}</span>
                </div>
              </div>
            </div>

            {/* Pricing details */}
            <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Retail Unit MRP</span>
                <span className="text-lg font-black text-slate-800">₹{(selectedItem.MRP || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total Stock Valuation</span>
                <span className="text-lg font-black text-emerald-600">₹{((selectedItem.currentQty || 0) * (selectedItem.MRP || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedItem.Notes && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Notes / Details</span>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                  {selectedItem.Notes}
                </p>
              </div>
            )}
          </div>
        </ModalView>
      )}

    </div>
  );
}
