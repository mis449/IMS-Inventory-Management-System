import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Calendar, Box, Tag, Layers, DollarSign, Filter, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { TabSwitcher } from '../../components/StandardButtons';
import useDataStore from '../../store/dataStore';

export default function InventoryForm() {
  const { items, isLoading, error, fetchItems, transactions, addTransaction, updateTransaction, removeTransaction, fetchTransactions, inventorySummary, fetchInventorySummary } = useDataStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Completed'

  // Add Inventory Form State
  const [commonData, setCommonData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'Purchase',
    vendorName: '',
    notes: '',
    status: 'Pending' // New logs default to Pending status
  });

  const getEmptyProduct = () => ({ id: Date.now() + Math.random(), itemCode: '', itemName: '', category: '', brand: '', price: 0, qty: '', openingQty: 0, totalPrice: 0 });
  const [products, setProducts] = useState([getEmptyProduct()]);

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
    fetchInventorySummary();
  }, [fetchItems, fetchTransactions, fetchInventorySummary]);

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
  const handleItemCodeSelect = (code, rowId) => {
    const item = items.find(i => (i.ItemCode || i.code) === code);
    const summary = inventorySummary.find(s => s.item_code === code) || { closing_qty: 0 };
    if (item) {
      setProducts(prev => prev.map(p => p.id === rowId ? {
        ...p,
        itemCode: code,
        itemName: item.ItemName || item.name || '',
        category: item.Category || item.category || '',
        brand: item.BrandName || item.brand || '',
        price: Number(item.MRP || item.price || 0),
        openingQty: summary.closing_qty,
        totalPrice: Number(item.MRP || item.price || 0) * (Number(p.qty) || 0)
      } : p));
    }
  };

  // Pre-fill fields when selecting Item Name
  const handleItemNameSelect = (name, rowId) => {
    const item = items.find(i => (i.ItemName || i.name) === name);
    if (item) {
      const code = item.ItemCode || item.code || '';
      const summary = inventorySummary.find(s => s.item_code === code) || { closing_qty: 0 };
      setProducts(prev => prev.map(p => p.id === rowId ? {
        ...p,
        itemCode: code,
        itemName: name,
        category: item.Category || item.category || '',
        brand: item.BrandName || item.brand || '',
        price: Number(item.MRP || item.price || 0),
        openingQty: summary.closing_qty,
        totalPrice: Number(item.MRP || item.price || 0) * (Number(p.qty) || 0)
      } : p));
    }
  };

  const handleProductChange = (rowId, field, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === rowId) {
        const newRow = { ...p, [field]: value };
        if (field === 'qty' || field === 'price') {
          newRow.totalPrice = (Number(newRow.qty) || 0) * (Number(newRow.price) || 0);
        }
        return newRow;
      }
      return p;
    }));
  };

  const addRow = () => {
    setProducts(prev => [...prev, getEmptyProduct()]);
  };

  const removeRow = (rowId) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(p => p.id !== rowId));
    }
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();

    if (!commonData.date) {
      toast.error('Please select a date!');
      return;
    }

    const validProducts = products.filter(p => p.itemCode && Number(p.qty) > 0);
    if (validProducts.length === 0) {
      toast.error('Please add at least one valid item with quantity > 0!');
      return;
    }

    const baseRemarks = commonData.notes.trim();

    const txPayloads = validProducts.map(p => ({
      date: commonData.date,
      type: commonData.transactionType,
      itemCode: p.itemCode,
      itemName: p.itemName,
      category: p.category,
      brand: p.brand,
      vendorName: commonData.vendorName,
      price: p.price,
      qty: Number(p.qty),
      totalPrice: p.totalPrice,
      remarks: baseRemarks,
      status: commonData.status
    }));

    try {
      await addTransaction(txPayloads);
      
      // Reset Form Data
      setCommonData({
        date: new Date().toISOString().split('T')[0],
        transactionType: 'Purchase',
        vendorName: '',
        notes: '',
        status: 'Pending'
      });
      setProducts([getEmptyProduct()]);
      setShowFormModal(false);
      toast.success(`Logged ${validProducts.length} transactions successfully!`);
    } catch(err) {
      toast.error('Failed to save transactions.');
    }
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
    "Category", "Brand", "Vendor", "Unit Price", "Qty", "Total Price", "Remarks", "Actions"
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
        <td className="px-4 py-3 text-center text-[11px] font-semibold text-slate-700 whitespace-nowrap">{item.vendorName || '-'}</td>
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
        submitText="Save Logs"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-6">
          
          {/* Common Fields Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-sky-50/40 p-5 rounded-2xl border border-sky-100">
            {/* Select Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Select Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-[12px] text-slate-400" size={14} />
                <input
                  type="date"
                  value={commonData.date}
                  onChange={(e) => setCommonData({ ...commonData, date: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none bg-white"
                  required
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Transaction Type *</label>
              <SearchableDropdown
                options={[
                  { value: 'Purchase', label: 'Purchase' },
                  { value: 'Sales', label: 'Sales' },
                  { value: 'Purchase Return', label: 'Purchase Return' },
                  { value: 'Sales Return', label: 'Sales Return' }
                ]}
                value={commonData.transactionType}
                onChange={(val) => setCommonData({ ...commonData, transactionType: val })}
                placeholder="Select Type"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-xl"
              />
            </div>

            {/* Vendor Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                Vendor Name {(commonData.transactionType === 'Sales' || commonData.transactionType === 'Sales Return') ? '(Optional)' : '*'}
              </label>
              <input
                type="text"
                value={commonData.vendorName}
                onChange={(e) => setCommonData({ ...commonData, vendorName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none bg-white"
                placeholder="Enter Vendor Name"
                required={commonData.transactionType === 'Purchase' || commonData.transactionType === 'Purchase Return'}
              />
            </div>
          </div>

          {/* Dynamic Product Rows */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Products</h3>
            
            {/* Desktop Header for Grid */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
              <div className="col-span-3 text-left">Item Code & Name</div>
              <div className="col-span-2">Category & Brand</div>
              <div className="col-span-1">Opening</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1"></div>
            </div>

            {products.map((product, index) => (
              <div key={product.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white border border-slate-100 md:border-none p-3 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none">
                
                <div className="col-span-1 md:col-span-3 space-y-2 text-left">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Item</div>
                  <SearchableDropdown
                    options={items.map(item => ({ value: item.ItemCode || item.code, label: `${item.ItemCode || item.code} - ${item.ItemName || item.name}` }))}
                    value={product.itemCode}
                    onChange={(val) => handleItemCodeSelect(val, product.id)}
                    placeholder="Search Item Code / Name"
                    className="w-full"
                    height="h-[36px]"
                    rounded="rounded-lg"
                  />
                  {product.itemName && (
                    <div className="text-[10px] text-slate-500 truncate px-1" title={product.itemName}>{product.itemName}</div>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                   <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Category/Brand</div>
                   <input type="text" value={product.category} readOnly className="w-full bg-slate-50 text-slate-500 text-xs px-2 py-1.5 rounded-lg border border-slate-100 outline-none text-center" placeholder="Category" />
                   <input type="text" value={product.brand} readOnly className="w-full bg-slate-50 text-slate-500 text-xs px-2 py-1.5 rounded-lg border border-slate-100 outline-none text-center" placeholder="Brand" />
                </div>

                <div className="col-span-1 md:col-span-1 space-y-1 text-center">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Opening</div>
                  <input type="text" value={product.openingQty} readOnly className="w-full bg-slate-50 font-bold text-slate-400 text-xs px-2 py-2 rounded-lg border border-slate-100 outline-none text-center" />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Quantity *</div>
                  <input type="number" min="1" value={product.qty} onChange={(e) => handleProductChange(product.id, 'qty', e.target.value)} className="w-full border border-sky-200 text-sky-700 font-bold text-sm px-2 py-2 rounded-lg outline-none text-center focus:ring-2 focus:ring-sky-500/20" placeholder="Qty" required />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Unit Price</div>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-slate-400 text-xs">₹</span>
                    <input type="number" value={product.price} onChange={(e) => handleProductChange(product.id, 'price', e.target.value)} className="w-full border border-slate-200 text-slate-700 text-xs pl-5 pr-2 py-2 rounded-lg outline-none text-center bg-white" placeholder="0" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-1 text-center font-bold text-emerald-600 text-sm">
                   <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase mb-1 text-left">Total</div>
                   ₹{product.totalPrice.toLocaleString('en-IN')}
                </div>

                <div className="col-span-1 md:col-span-1 flex justify-center md:justify-end">
                   <button type="button" onClick={() => removeRow(product.id)} disabled={products.length === 1} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Remove Row">
                      <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors">
                <Plus size={14} /> Add Row
              </button>
              <div className="text-sm font-black text-slate-800 bg-slate-100 px-5 py-2.5 rounded-xl border border-slate-200">
                Grand Total: <span className="text-emerald-600 ml-2">₹{products.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Remarks / Notes</label>
            <textarea
              rows="2"
              value={commonData.notes}
              onChange={(e) => setCommonData({ ...commonData, notes: e.target.value })}
              placeholder="Enter transaction remarks or notes here..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm transition-all outline-none"
            />
          </div>

        </div>
      </ModalForm>

    </div>
  );
}
