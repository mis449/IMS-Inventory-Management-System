import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Filter, RefreshCw, Download, Eye, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import PurchaseReturnFormModal from './PurchaseReturnFormModal';
import { getPurchaseReturns, deletePurchaseReturn } from '../../services/PurchaseReturnService';

export default function PurchaseReturnList({ conversionContext, clearConversionContext }) {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedPurchaseReturn, setSelectedPurchaseReturn] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  
  const [filters, setFilters] = useState({
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const fetchPurchaseReturnsData = async () => {
    setIsLoading(true);
    try {
      const data = await getPurchaseReturns();
      setPurchaseReturns(data || []);
    } catch (error) {
      toast.error('Failed to fetch purchase returns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseReturnsData();
  }, []);

  useEffect(() => {
    if (conversionContext && conversionContext.source === 'Purchase') {
      setShowFormModal(true);
    }
  }, [conversionContext]);
  const handleView = (item) => {
    setSelectedPurchaseReturn(item);
    setShowFormModal(true);
  };


  const handleClearFilters = () => {
    setFilters({ searchQuery: '' });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleRefresh = () => {
    fetchPurchaseReturnsData();
    toast.success('Data refreshed');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this purchase return?')) {
      try {
        await deletePurchaseReturn(id);
        setPurchaseReturns(prev => prev.filter(p => String(p.id) !== String(id)));
        toast.success('Purchase Return deleted successfully');
      } catch (error) {
        toast.error('Failed to delete purchase return');
      }
    }
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter(p => {
      if (activeTab !== 'All' && p.status !== activeTab) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          (p.returnNo || '').toLowerCase().includes(query) ||
          (p.vendor || '').toLowerCase().includes(query)
        );
      }
      return true;
    }).reverse();
  }, [purchaseReturns, filters, activeTab]);

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
  const paginatedReturns = filteredReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-sky-100 text-sky-700',
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Draft': 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const tableHeaders = [
    "Return No", "Date", "Vendor", "Mobile", "State", "Amount", "Status", "Action"
  ];

  const renderRow = (item, idx) => (
    <tr key={item.id || idx} className="hover:bg-rose-50/25 transition-colors border-b border-slate-100">
      <td className="px-4 py-3 text-center text-xs text-rose-600 font-bold whitespace-nowrap">{item.returnNo || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.date || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-900 whitespace-nowrap truncate max-w-[150px]">{item.vendor || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.mobile || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.state || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.amount || 0).toLocaleString('en-IN')}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(item.status)}`}>
          {item.status || 'Draft'}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap flex items-center justify-center gap-2">
        <button onClick={() => handleView(item)} className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded transition shadow-sm" title="View/Edit">
          <Eye size={14} />
        </button>
        <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm" title="Delete">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );

  const renderCard = (item, idx) => (
    <div key={item.id || idx} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-rose-100">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.vendor || '-'}</span>
        </div>
        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          {item.returnNo || '-'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Date</span>
          <span className="text-slate-700 font-medium">{item.date || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Mobile</span>
          <span className="text-slate-700 font-medium">{item.mobile || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">State</span>
          <span className="text-slate-700 font-medium">{item.state || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Amount</span>
          <span className="text-emerald-600 font-bold">₹{Number(item.amount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Status</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold inline-block ${getStatusColor(item.status)}`}>
            {item.status || 'Draft'}
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-2">
        <button onClick={() => handleView(item)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded transition shadow-sm" title="View/Edit">
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
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 text-xs md:text-sm h-[38px] transition-all outline-none"
              />
            </div>
            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden flex items-center justify-center rounded-xl shadow-sm h-[38px] w-[38px] flex-shrink-0 transition-all bg-white border border-slate-200">
              <Filter size={15} />
            </button>
            <button onClick={() => { clearConversionContext?.(); setShowFormModal(true); }} className="lg:hidden flex items-center justify-center bg-rose-600 text-white rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-md">
              <Plus size={18} />
            </button>
          </div>
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible justify-end`}>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 h-[38px] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 cursor-pointer shadow-sm"
            >
              <option value="All">All ({purchaseReturns.length})</option>
            </select>
            <button onClick={handleRefresh} className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold">
              <RefreshCw size={14} /> <span className="hidden md:inline">Refresh</span>
            </button>
            <button onClick={handleExport} className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold">
              <Download size={14} /> <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
        
        <button
          onClick={() => { clearConversionContext?.(); setShowFormModal(true); }}
          className="hidden lg:flex bg-rose-600 hover:bg-rose-700 text-white rounded-xl items-center justify-center gap-1.5 transition shadow-md h-[38px] px-4 flex-shrink-0 text-xs font-bold"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500">Loading returns...</span>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedReturns}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1000px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredReturns.length}
            itemsPerPageOptions={[20, 50, 100]}
          />
        )}
      </div>

      {showFormModal && (
        <PurchaseReturnFormModal
          isOpen={showFormModal}
          onClose={() => { 
            setShowFormModal(false); 
            setSelectedPurchaseReturn(null);
            clearConversionContext?.(); 
          }}
          initialData={selectedPurchaseReturn || conversionContext?.data || null}
          isConversion={!!conversionContext}
          onSave={(newReturn) => {
            if (selectedPurchaseReturn) {
              setPurchaseReturns(prev => prev.map(p => p.id === selectedPurchaseReturn.id ? { ...newReturn, id: selectedPurchaseReturn.id } : p));
              toast.success('Purchase Return updated');
            } else {
              setPurchaseReturns(prev => [...prev, newReturn]);
              toast.success('Purchase Return saved');
            }
            setShowFormModal(false);
            setSelectedPurchaseReturn(null);
            clearConversionContext?.();
          }}
        />
      )}
    </div>
  );
}
