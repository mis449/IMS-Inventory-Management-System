import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Box, Tag, Layers, DollarSign, Calendar, Filter, RefreshCw, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import useDataStore from '../../store/dataStore';

export default function InventoryHistory() {
  const { transactions, removeTransaction, fetchTransactions } = useDataStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    fromDate: '',
    toDate: '',
    type: '',
    category: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      fromDate: '',
      toDate: '',
      type: '',
      category: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleDelete = (txId) => {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      removeTransaction(txId);
      toast.success('Record deleted.');
    }
  };

  // Extract unique filter sets
  const categoriesList = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).filter(Boolean).sort();
  }, [transactions]);

  // Filter completed transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Inventory history only displays completed logs
      if (t.status !== 'Completed') return false;

      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;

      // Date range filter
      if (filters.fromDate && t.date < filters.fromDate) return false;
      if (filters.toDate && t.date > filters.toDate) return false;

      // Text search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          t.serialNo.toLowerCase().includes(q) ||
          t.itemCode.toLowerCase().includes(q) ||
          t.itemName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.brand.toLowerCase().includes(q) ||
          (t.remarks && t.remarks.toLowerCase().includes(q))
        );
      }
      return true;
    }).reverse(); // Latest transaction first
  }, [transactions, filters]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Serial No", "Date", "Transaction Type", "Item Code", "Item Name",
    "Category", "Brand", "Unit Price", "Qty", "Total Price", "Remarks", "Actions"
  ];

  const renderRow = (item, idx) => {
    const typeColors = {
      'Purchase': 'bg-emerald-100 text-emerald-700 font-bold',
      'Sales': 'bg-blue-100 text-blue-700 font-bold',
      'Purchase Return': 'bg-amber-100 text-amber-700 font-bold',
      'Sales Return': 'bg-rose-100 text-rose-700 font-bold'
    };

    return (
      <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.serialNo}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{item.date}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase ${typeColors[item.type] || 'bg-gray-100 text-gray-700'}`}>
            {item.type}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-900 font-semibold whitespace-nowrap">{item.itemCode}</td>
        <td className="px-4 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap uppercase truncate max-w-[180px]">{item.itemName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.category}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.brand}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">₹{Number(item.price || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.totalPrice || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-left text-xs text-gray-500 whitespace-nowrap truncate max-w-[200px]" title={item.remarks}>{item.remarks || '-'}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm"
            title="Delete Log"
          >
            <Trash2 size={14} />
          </button>
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const typeColors = {
      'Purchase': 'bg-emerald-100 text-emerald-700',
      'Sales': 'bg-blue-100 text-blue-700',
      'Purchase Return': 'bg-amber-100 text-amber-700',
      'Sales Return': 'bg-rose-100 text-rose-700'
    };

    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-sky-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-sky-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.itemName}</span>
          </div>
          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
            {item.serialNo}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Date</span>
            <span className="text-gray-700 font-medium">{item.date}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Type</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold inline-block ${typeColors[item.type]}`}>
              {item.type}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Item Code</span>
            <span className="text-gray-700 font-medium">{item.itemCode}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Qty</span>
            <span className="text-sky-600 font-bold">{item.qty}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Category / Brand</span>
            <span className="text-gray-700 font-medium">{item.category} ({item.brand})</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Unit Price / Total</span>
            <span className="text-gray-700 font-medium">₹{item.price} / <strong className="text-emerald-600">₹{item.totalPrice}</strong></span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
          <span />
          <button
            onClick={() => handleDelete(item.id)}
            className="text-xs font-black text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Filters Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          {/* Search bar input */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search transaction history..."
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
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200 rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-sm active:scale-95"
              title="Clear Filters"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Expanded dropdowns and date selectors */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
            {/* From Date picker */}
            <div className="flex-1 min-w-0 lg:min-w-[130px] relative">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
                title="From Date"
              />
            </div>

            {/* To Date picker */}
            <div className="flex-1 min-w-0 lg:min-w-[130px] relative">
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
                title="To Date"
              />
            </div>

            {/* Type Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[160px]">
              <SearchableDropdown
                options={[
                  { value: 'Purchase', label: 'Purchase' },
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Purchase Return', label: 'Purchase Return' },
                  { value: 'Sales Return', label: 'Sales Return' }
                ]}
                value={filters.type}
                onChange={(val) => setFilters({ ...filters, type: val })}
                placeholder="All Types"
                className="h-[38px]"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

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

      {/* Table content displaying logs */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedStocks || paginatedTransactions}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1300px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredTransactions.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

    </div>
  );
}
