import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Calendar, Box, Tag, Layers, DollarSign, Filter, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { TabSwitcher } from '../../components/StandardButtons';
import useDataStore from '../../store/dataStore';

export default function InventoryForm() {
  const { items, isLoading, error, fetchItems, transactions, addTransaction, updateTransaction, removeTransaction, fetchTransactions } = useDataStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Completed'

  // Add Inventory Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemCode: '',
    itemName: '',
    category: '',
    brand: '',
    price: 0,
    transactionType: 'Purchase',
    qty: '',
    openingQty: 0, // Opening Qty must ALWAYS default to 0
    notes: '',
    status: 'Pending' // New logs default to Pending status
  });

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

  // Fetch catalog items on mount
  useEffect(() => {
    fetchItems(true);
    fetchTransactions();
  }, [fetchItems, fetchTransactions]);

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

  // Pre-fill fields when selecting Item Code
  const handleItemCodeSelect = (code) => {
    const item = items.find(i => (i.ItemCode || i.code) === code);
    if (item) {
      setFormData(prev => ({
        ...prev,
        itemCode: code,
        itemName: item.ItemName || item.name || '',
        category: item.Category || item.category || '',
        brand: item.BrandName || item.brand || '',
        price: Number(item.MRP || item.price || 0)
      }));
    }
  };

  // Pre-fill fields when selecting Item Name
  const handleItemNameSelect = (name) => {
    const item = items.find(i => (i.ItemName || i.name) === name);
    if (item) {
      setFormData(prev => ({
        ...prev,
        itemCode: item.ItemCode || item.code || '',
        itemName: name,
        category: item.Category || item.category || '',
        brand: item.BrandName || item.brand || '',
        price: Number(item.MRP || item.price || 0)
      }));
    }
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();

    if (!formData.date || !formData.itemCode) {
      toast.error('Please select date and item code!');
      return;
    }

    const qty = Number(formData.qty) || 0;
    if (qty <= 0) {
      toast.error('Please enter a valid quantity!');
      return;
    }

    addTransaction({
      date: formData.date,
      type: formData.transactionType,
      itemCode: formData.itemCode,
      itemName: formData.itemName,
      category: formData.category,
      brand: formData.brand,
      price: formData.price,
      qty: qty,
      totalPrice: formData.price * qty,
      remarks: formData.notes.trim(),
      status: formData.status // 'Pending' or 'Completed'
    });

    // Reset Form Data
    setFormData({
      date: new Date().toISOString().split('T')[0],
      itemCode: '',
      itemName: '',
      category: '',
      brand: '',
      price: 0,
      transactionType: 'Purchase',
      qty: '',
      openingQty: 0,
      notes: '',
      status: 'Pending'
    });

    setShowFormModal(false);
    toast.success(`Logged transaction successfully!`);
  };

  const handleApprove = (txId) => {
    updateTransaction(txId, { status: 'Completed' });
    toast.success('Transaction approved and completed!');
  };

  const handleDelete = (txId) => {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      removeTransaction(txId);
      toast.success('Record deleted.');
    }
  };

  const categoriesList = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).filter(Boolean).sort();
  }, [transactions]);

  // Apply search/filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by active tab (Pending vs Completed)
      if (t.status !== activeTab) return false;

      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.fromDate && t.date < filters.fromDate) return false;
      if (filters.toDate && t.date > filters.toDate) return false;

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
    }).reverse();
  }, [transactions, filters, activeTab]);

  const pendingCount = useMemo(() => transactions.filter(t => t.status === 'Pending').length, [transactions]);
  const completedCount = useMemo(() => transactions.filter(t => t.status === 'Completed').length, [transactions]);

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
      <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
        <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.serialNo}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.date}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase ${typeColors[item.type] || 'bg-slate-100 text-slate-700'}`}>
            {item.type}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs text-slate-900 font-semibold whitespace-nowrap">{item.itemCode}</td>
        <td className="px-4 py-3 text-left text-xs font-semibold text-slate-900 whitespace-nowrap uppercase truncate max-w-[180px]">{item.itemName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.category}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.brand}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">₹{Number(item.price || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.totalPrice || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-left text-xs text-gray-500 whitespace-nowrap truncate max-w-[200px]" title={item.remarks}>{item.remarks || '-'}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap flex items-center justify-center gap-2">
          {item.status === 'Pending' && (
            <button
              onClick={() => handleApprove(item.id)}
              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded transition shadow-sm"
              title="Approve / Complete"
            >
              <CheckCircle size={14} />
            </button>
          )}
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm"
            title="Delete"
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
      <div key={item.id || idx} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-sky-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.itemName}</span>
          </div>
          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
            {item.serialNo}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Date</span>
            <span className="text-slate-700 font-medium">{item.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Type</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold inline-block ${typeColors[item.type]}`}>
              {item.type}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Item Code</span>
            <span className="text-slate-700 font-medium">{item.itemCode}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Qty</span>
            <span className="text-sky-600 font-bold">{item.qty}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Category / Brand</span>
            <span className="text-slate-700 font-medium">{item.category} ({item.brand})</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Unit Price / Total</span>
            <span className="text-slate-700 font-medium">₹{item.price} / <strong className="text-emerald-600">₹{item.totalPrice}</strong></span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
          {item.status === 'Pending' ? (
            <button
              onClick={() => handleApprove(item.id)}
              className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <CheckCircle size={12} /> Approve
            </button>
          ) : <span />}
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
      
      {/* Header Filters & Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search inventory transactions..."
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
              onClick={() => setShowFormModal(true)}
              className="lg:hidden flex items-center justify-center bg-sky-600 text-white rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-md shadow-sky-100 active:scale-95"
              title="Add Transaction"
            >
              <Plus size={18} />
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
            
            <div className="flex-1 min-w-0 lg:min-w-[130px] relative">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
                title="From Date"
              />
            </div>

            <div className="flex-1 min-w-0 lg:min-w-[130px] relative">
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
                title="To Date"
              />
            </div>

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

        <button
          onClick={() => setShowFormModal(true)}
          className="hidden lg:flex bg-sky-600 hover:bg-sky-700 text-white rounded-xl items-center justify-center gap-1.5 transition shadow-md shadow-sky-100 h-[38px] px-4 flex-shrink-0 text-xs font-bold"
          title="Add Inventory"
        >
          <Plus size={16} /> Add Inventory
        </button>
      </div>

      {/* Tabs Switcher for Pending vs History */}
      <div className="px-2 sm:px-0">
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'Pending', label: 'Pending ', count: pendingCount },
            { id: 'Completed', label: 'History', count: completedCount }
          ]}
        />
      </div>

      {/* Main Transactions DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedTransactions}
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

      {/* Pop-up Inventory Form Modal */}
      <ModalForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Add Inventory"
        onSubmit={handleSaveTransaction}
        submitText="Save Log"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Select Date */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider">Select Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-[12px] text-slate-400" size={14} />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none bg-white"
                  required
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider">Transaction Type *</label>
              <SearchableDropdown
                options={[
                  { value: 'Purchase', label: 'Purchase' },
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Purchase Return', label: 'Purchase Return' },
                  { value: 'Sales Return', label: 'Sales Return' }
                ]}
                value={formData.transactionType}
                onChange={(val) => setFormData({ ...formData, transactionType: val })}
                placeholder="Select Type"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Item Code search select */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider">Item Code *</label>
              <SearchableDropdown
                options={items.map(item => ({ value: item.ItemCode || item.code, label: item.ItemCode || item.code }))}
                value={formData.itemCode}
                onChange={handleItemCodeSelect}
                placeholder="Search Item Code"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            {/* Item Name search select */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider">Item Name Selector *</label>
              <SearchableDropdown
                options={items.map(item => ({ value: item.ItemName || item.name, label: item.ItemName || item.name }))}
                value={formData.itemName}
                onChange={handleItemNameSelect}
                placeholder="Search Item Name"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            
            {/* Category Pre-fill */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Category</label>
              <div className="relative">
                <Layers className="absolute left-3 top-[12px] text-slate-400" size={14} />
                <input
                  type="text"
                  value={formData.category}
                  className="w-full pl-9 pr-4 py-2 border border-slate-150 bg-slate-100/50 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-xs md:text-sm h-[38px] outline-none"
                  readOnly
                  placeholder="-"
                />
              </div>
            </div>

            {/* Brand Pre-fill */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Brand</label>
              <div className="relative">
                <Tag className="absolute left-3 top-[12px] text-slate-400" size={14} />
                <input
                  type="text"
                  value={formData.brand}
                  className="w-full pl-9 pr-4 py-2 border border-slate-150 bg-slate-100/50 text-slate-500 font-semibold rounded-xl cursor-not-allowed text-xs md:text-sm h-[38px] outline-none"
                  readOnly
                  placeholder="-"
                />
              </div>
            </div>

            {/* Unit Price Pre-fill */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Unit Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-[12px] text-slate-400" size={14} />
                <input
                  type="text"
                  value={formData.price ? `₹${formData.price}` : ''}
                  className="w-full pl-9 pr-4 py-2 border border-slate-150 bg-slate-100/50 text-slate-600 font-bold rounded-xl cursor-not-allowed text-xs md:text-sm h-[38px] outline-none"
                  readOnly
                  placeholder="-"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 bg-sky-50/20 p-4 rounded-2xl border border-sky-100/30">
            
            {/* Single Quantity */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider text-center">Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                placeholder="Enter Quantity"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm h-[42px] focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-center font-bold bg-white"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Opening Qty (always defaults to 0) */}
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Opening Qty (Read-only)</label>
              <input
                type="number"
                value={formData.openingQty}
                readOnly
                className="w-full px-4 py-2 border border-slate-150 bg-slate-100/50 text-slate-450 font-bold rounded-xl cursor-not-allowed text-xs md:text-sm h-[38px] outline-none"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-700 font-bold uppercase tracking-wider">Remarks / Notes</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter transaction remarks or notes here..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm transition-all outline-none"
            />
          </div>

        </div>
      </ModalForm>

    </div>
  );
}
