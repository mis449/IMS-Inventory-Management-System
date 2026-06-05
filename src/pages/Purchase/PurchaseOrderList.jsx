import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Filter, RefreshCw, Download, Eye, Trash2, FileInput } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import MaterialReceivedModal from './MaterialReceivedModal';
import { getPurchaseOrders, deletePurchaseOrder } from '../../services/PurchaseOrderService';

export default function PurchaseOrderList({ onConvertToPurchase }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  
  const [filters, setFilters] = useState({
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const fetchPurchaseOrdersData = async () => {
    setIsLoading(true);
    try {
      const data = await getPurchaseOrders();
      setPurchaseOrders(data || []);
    } catch (error) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrdersData();
  }, []);

  const handleClearFilters = () => {
    setFilters({ searchQuery: '' });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleRefresh = () => {
    fetchPurchaseOrdersData();
    toast.success('Data refreshed');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePurchaseOrder(id);
        setPurchaseOrders(prev => prev.filter(p => String(p.id) !== String(id)));
        toast.success('Purchase Order deleted successfully');
      } catch (error) {
        toast.error('Failed to delete purchase order');
      }
    }
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  const handleView = (item) => {
    setSelectedOrder(item);
    setShowFormModal(true);
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(p => {
      if (activeTab !== 'All' && p.status !== activeTab) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          (p.docNo || '').toLowerCase().includes(query) ||
          (p.vendorName || '').toLowerCase().includes(query)
        );
      }
      return true;
    }).reverse();
  }, [purchaseOrders, filters, activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Doc #", "Doc Date", "Vendor Name", "State", 
    "Mobile", "Amount", "Action"
  ];

  const renderRow = (item, idx) => (
    <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
      <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.docNo || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.docDate || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-900 whitespace-nowrap truncate max-w-[150px]">{item.vendorName || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.state || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.mobile || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap flex items-center justify-center gap-2">
        <button onClick={() => onConvertToPurchase?.(item)} className="p-1 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded transition shadow-sm" title="Material Received">
          <FileInput size={14} />
        </button>
        <button onClick={() => handleView(item)} className="p-1 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded transition shadow-sm" title="View/Edit">
          <Eye size={14} />
        </button>
        <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm" title="Delete">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );

  const renderCard = (item, idx) => (
    <div key={item.id || idx} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-sky-100">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.vendorName || '-'}</span>
        </div>
        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          {item.docNo || '-'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Date</span>
          <span className="text-slate-700 font-medium">{item.docDate || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">State</span>
          <span className="text-slate-700 font-medium">{item.state || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Mobile</span>
          <span className="text-slate-700 font-medium">{item.mobile || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Amount</span>
          <span className="text-emerald-600 font-bold">₹{Number(item.amount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-2">
        <button onClick={() => onConvertToPurchase?.(item)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded transition shadow-sm" title="Material Received">
          <FileInput size={14} />
        </button>
        <button onClick={() => handleView(item)} className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded transition shadow-sm" title="View/Edit">
          <Eye size={14} />
        </button>
        <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row flex-1 w-full gap-2 lg:gap-3 items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
              />
            </div>
            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden flex items-center justify-center rounded-xl shadow-sm h-[38px] w-[38px] flex-shrink-0 transition-all bg-white border border-slate-200">
              <Filter size={15} />
            </button>
            <button onClick={() => { setSelectedOrder(null); setShowFormModal(true); }} className="lg:hidden flex items-center justify-center bg-teal-600 text-white rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-md">
              <Plus size={18} />
            </button>
          </div>
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible justify-end`}>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 h-[38px] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 cursor-pointer shadow-sm"
            >
              <option value="All">All ({purchaseOrders.length})</option>
            </select>
            <button onClick={handleRefresh} className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold">
              <RefreshCw size={14} /> <span className="hidden md:inline">Refresh</span>
            </button>
            <button onClick={handleExport} className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold">
              <Download size={14} /> <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedOrder(null); setShowFormModal(true); }}
            className="hidden lg:flex bg-teal-600 hover:bg-teal-700 text-white rounded-xl items-center justify-center gap-1.5 transition shadow-md h-[38px] px-4 flex-shrink-0 text-xs font-bold"
          >
            <Plus size={16} /> New
          </button>
          <button
            onClick={() => setShowMaterialModal(true)}
            className="hidden lg:flex bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl items-center justify-center gap-1.5 transition shadow-sm h-[38px] px-4 flex-shrink-0 text-xs font-bold"
          >
            <Plus size={16} /> Material Received
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500">Loading orders...</span>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedOrders}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1000px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredOrders.length}
            itemsPerPageOptions={[20, 50, 100]}
          />
        )}
      </div>

      {showFormModal && (
        <PurchaseOrderFormModal
          isOpen={showFormModal}
          initialData={selectedOrder}
          onClose={() => {
            setShowFormModal(false);
            setSelectedOrder(null);
          }}
          onSave={(newOrder) => {
            if (selectedOrder) {
              setPurchaseOrders(prev => prev.map(p => p.id === selectedOrder.id ? { ...newOrder, id: selectedOrder.id } : p));
              toast.success('Purchase Order updated');
            } else {
              setPurchaseOrders(prev => [...prev, newOrder]);
              toast.success('Purchase Order saved');
            }
            setShowFormModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      <MaterialReceivedModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        onSubmit={(data) => {
          setShowMaterialModal(false);
          // Pass this data if needed, or simply switch tab
          onConvertToPurchase?.({ vendorName: data.vendor, ...data });
        }}
      />
    </div>
  );
}
