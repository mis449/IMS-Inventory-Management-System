import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Filter, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { TabSwitcher } from '../../components/StandardButtons';
import { getQuotations, updateQuotation } from '../../services/quotationService';
import DispatchFormModal from './DispatchFormModal';

export default function DispatchList({ onConvertToInvoice }) {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  
  // 'Pending' maps to 'Active', 'Approved' maps to 'Accepted', 'Rejected' maps to 'Rejected'
  const [activeTab, setActiveTab] = useState('Pending');
  
  const [filters, setFilters] = useState({
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const fetchQuotationsData = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotations();
      // Only include ones that are part of the dispatch workflow
      const validStatuses = ['Active', 'Accepted', 'Rejected', 'Invoiced', 'In Progress', 'Completed'];
      const dispatchItems = (data || []).filter(q => validStatuses.includes(q.status));
      setQuotations(dispatchItems);
    } catch (error) {
      toast.error('Failed to fetch dispatch list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationsData();
  }, []);

  const handleClearFilters = () => {
    setFilters({ searchQuery: '' });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleRefresh = () => {
    fetchQuotationsData();
    toast.success('Data refreshed');
  };

  const handleAction = async (item, action) => {
    try {
      const newStatus = action === 'Accept' ? 'Accepted' : 'Rejected';
      const updated = await updateQuotation(item.id, { ...item, status: newStatus });
      setQuotations(prev => prev.map(q => q.id === item.id ? updated : q));
      toast.success(`Dispatch ${action === 'Accept' ? 'Approved' : 'Rejected'}`);
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} dispatch`);
    }
  };

  const handleView = (item) => {
    setSelectedDispatch(item);
    setShowDispatchModal(true);
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Filter by active tab (mapping to quotation statuses)
      if (activeTab === 'Approved') {
        if (q.status !== 'Accepted' && q.status !== 'In Progress') return false;
      } else if (activeTab === 'Invoiced') {
        if (q.status !== 'Invoiced' && q.status !== 'Completed') return false;
      } else {
        const statusMap = {
          'Pending': 'Active',
          'Rejected': 'Rejected'
        };
        if (activeTab !== 'All' && q.status !== statusMap[activeTab]) return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          (q.quotationNo || '').toLowerCase().includes(query) ||
          (q.customerName || '').toLowerCase().includes(query)
        );
      }
      return true;
    }).reverse();
  }, [quotations, filters, activeTab]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    if (status === 'Active') return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-700">Pending Dispatch</span>;
    if (status === 'Accepted') return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700">Dispatch Approved</span>;
    if (status === 'Rejected') return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-100 text-rose-700">Dispatch Rejected</span>;
    if (status === 'In Progress') return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-700">In Progress</span>;
    if (status === 'Invoiced' || status === 'Completed' || status === 'Final') return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700">Invoiced</span>;
    return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">{status === 'Final' ? 'Completed' : status}</span>;
  };

  const tableHeaders = [
    "Ref #", "Date", "Customer", "State", 
    "Amount", "Dispatch Status", "Action"
  ];

  const renderRow = (item, idx) => (
    <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
      <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.quotationNo || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.date || '-'}</td>
      <td className="px-4 py-3 text-left text-xs font-semibold text-slate-900 whitespace-nowrap truncate max-w-[200px]">{item.customerName || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.state || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        {getStatusBadge(item.status)}
      </td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap flex items-center justify-center gap-2">
        {item.status === 'Active' ? (
          <>
            <button onClick={() => handleAction(item, 'Accept')} className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded transition shadow-sm" title="Accept">
              <CheckCircle size={14} />
            </button>
            <button onClick={() => handleAction(item, 'Reject')} className="p-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition shadow-sm" title="Reject">
              <XCircle size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => handleView(item)} className="p-1 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded transition shadow-sm" title="View Dispatch">
            <Eye size={14} />
          </button>
        )}
      </td>
    </tr>
  );

  const renderCard = (item, idx) => (
    <div key={item.id || idx} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-sky-100">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.customerName || '-'}</span>
        </div>
        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          {item.quotationNo || '-'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Status</span>
          {getStatusBadge(item.status)}
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Amount</span>
          <span className="text-emerald-600 font-bold">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
        {item.status === 'Active' ? (
          <>
            <button onClick={() => handleAction(item, 'Accept')} className="text-xs font-black text-emerald-600 hover:text-emerald-800">
              Accept
            </button>
            <button onClick={() => handleAction(item, 'Reject')} className="text-xs font-black text-red-600 hover:text-red-800">
              Reject
            </button>
          </>
        ) : (
          <button onClick={() => handleView(item)} className="text-xs font-black text-sky-600 hover:text-sky-800 flex items-center gap-1">
            <Eye size={12} /> View
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search dispatches..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] transition-all outline-none"
              />
            </div>
            <button
               onClick={() => setShowMobileFilters(!showMobileFilters)}
               className={`lg:hidden flex items-center justify-center rounded-xl shadow-sm h-[38px] w-[38px] flex-shrink-0 transition-all ${showMobileFilters ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'}`}
            >
              <Filter size={15} />
            </button>
          </div>

          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible justify-end`}>
            <button onClick={handleRefresh} className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold">
              <RefreshCw size={14} /> <span className="hidden md:inline">Refresh</span>
            </button>
            <button onClick={handleClearFilters} className="hidden lg:flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200 rounded-xl w-[38px] h-[38px] hover:bg-slate-150 transition-colors shadow-sm">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher for Dispatch Status */}
      <div className="px-2 sm:px-0">
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'All', label: 'All Dispatches', count: quotations.length },
            { id: 'Pending', label: 'Pending Dispatch', count: quotations.filter(q => q.status === 'Active').length },
            { id: 'Approved', label: 'Dispatch Approved', count: quotations.filter(q => q.status === 'Accepted' || q.status === 'In Progress').length },
            { id: 'Rejected', label: 'Dispatch Rejected', count: quotations.filter(q => q.status === 'Rejected').length },
            { id: 'Invoiced', label: 'Invoiced', count: quotations.filter(q => q.status === 'Invoiced' || q.status === 'Completed').length }
          ]}
        />
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500">Loading dispatches...</span>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedQuotations}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="800px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredQuotations.length}
            itemsPerPageOptions={[20, 50, 100]}
          />
        )}
      </div>

      {showDispatchModal && (
        <DispatchFormModal
          isOpen={showDispatchModal}
          initialData={selectedDispatch}
          onClose={() => {
            setShowDispatchModal(false);
            setSelectedDispatch(null);
          }}
          onSave={(updated) => {
            setQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
            setShowDispatchModal(false);
            setSelectedDispatch(null);
          }}
          onConvertToInvoice={(data) => {
            setShowDispatchModal(false);
            setSelectedDispatch(null);
            onConvertToInvoice(data);
          }}
        />
      )}
    </div>
  );
}
