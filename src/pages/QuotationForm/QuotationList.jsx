import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Filter, RefreshCw, Download, Edit, Eye, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { TabSwitcher } from '../../components/StandardButtons';
import QuotationFormModal from './QuotationFormModal';
import { getQuotations, deleteQuotation, createQuotation, updateQuotation } from '../../services/quotationService';

export default function QuotationList({ onConvertToInvoice }) {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [activeTab, setActiveTab] = useState('Active');
  
  const [filters, setFilters] = useState({
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch quotations
  const fetchQuotationsData = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(data || []);
    } catch (error) {
      toast.error('Failed to fetch quotations');
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

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id);
        setQuotations(prev => prev.filter(q => String(q.id) !== String(id)));
        toast.success('Quotation deleted successfully');
      } catch (error) {
        toast.error('Failed to delete quotation');
      }
    }
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  const handleView = (item) => {
    setSelectedQuotation(item);
    setShowFormModal(true);
  };

  // Filter Logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Filter by active tab
      if (activeTab !== 'All') {
        if (activeTab === 'Completed' && (q.status === 'Final' || q.status === 'Completed')) {
          // Allow it
        } else if (q.status !== activeTab) {
          return false;
        }
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          (q.quotationNo || '').toLowerCase().includes(query) ||
          (q.customerName || '').toLowerCase().includes(query) ||
          (q.mobileNumber || '').toLowerCase().includes(query) ||
          (q.salesPerson || '').toLowerCase().includes(query)
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

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-sky-100 text-sky-700',
      'Accepted': 'bg-emerald-100 text-emerald-700',
      'Rejected': 'bg-rose-100 text-rose-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      'Completed': 'bg-indigo-100 text-indigo-700',
      'Final': 'bg-indigo-100 text-indigo-700' // Backward compatibility
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };


  const tableHeaders = [
    "Quot #", "Quot Date", "Customer", "State", 
    "Mobile", "Sales Person", "Amount", "Quot Status", "Action"
  ];

  const renderRow = (item, idx) => (
    <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
      <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.quotationNo || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.date || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-900 whitespace-nowrap truncate max-w-[150px]">{item.customerName || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.state || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.mobileNumber || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.salesPerson || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(item.status)}`}>
          {item.status === 'Final' ? 'Completed' : (item.status || 'Draft')}
        </span>
      </td>

      <td className="px-4 py-3 text-center text-xs whitespace-nowrap flex items-center justify-center gap-2">
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
          <span className="text-[10px] font-bold text-slate-400">#{item.quotationNo}</span>
          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${getStatusColor(item.status)}`}>
            {item.status === 'Final' ? 'Completed' : (item.status || 'Draft')}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleView(item)} className="p-1.5 bg-sky-50 text-sky-600 rounded hover:bg-sky-500 hover:text-white transition"><Eye size={12} /></button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-500 hover:text-white transition"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-xs">
        <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span> <span className="font-semibold text-slate-800">{item.customerName}</span></div>
        <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Person</span> <span className="text-slate-600">{item.salesPerson}</span></div>
        <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span> <span className="font-bold text-emerald-600">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</span></div>

      </div>
    </div>
  );

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
                placeholder="Search quotations..."
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
              onClick={() => {
                setSelectedQuotation(null);
                setShowFormModal(true);
              }}
              className="lg:hidden flex items-center justify-center bg-sky-600 text-white rounded-xl h-[38px] w-[38px] flex-shrink-0 shadow-md shadow-sky-100 active:scale-95"
              title="Add Quotation"
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

          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible justify-end`}>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold"
              title="Refresh"
            >
              <RefreshCw size={14} /> <span className="hidden md:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 h-[38px] transition-colors shadow-sm text-xs font-semibold"
              title="Export"
            >
              <Download size={14} /> <span className="hidden md:inline">Export</span>
            </button>
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
          onClick={() => {
            setSelectedQuotation(null);
            setShowFormModal(true);
          }}
          className="hidden lg:flex bg-sky-600 hover:bg-sky-700 text-white rounded-xl items-center justify-center gap-1.5 transition shadow-md shadow-sky-100 h-[38px] px-4 flex-shrink-0 text-xs font-bold"
          title="Add Quotation"
        >
          <Plus size={16} /> Quotation Form
        </button>
      </div>

      {/* Tabs Switcher for Quotation Status */}
      <div className="px-2 sm:px-0">
        <TabSwitcher
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'Active', label: 'Active', count: quotations.filter(q => q.status === 'Active').length },
            { id: 'Accepted', label: 'Accepted', count: quotations.filter(q => q.status === 'Accepted').length },
            { id: 'Rejected', label: 'Rejected', count: quotations.filter(q => q.status === 'Rejected').length },
            { id: 'In Progress', label: 'In Progress', count: quotations.filter(q => q.status === 'In Progress').length },
            { id: 'Completed', label: 'Completed', count: quotations.filter(q => q.status === 'Completed' || q.status === 'Final').length }
          ]}
        />
      </div>



      {/* Main DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500">Loading quotations...</span>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedQuotations}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1000px"
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

      {/* Pop-up Form Modal */}
      {showFormModal && (
        <QuotationFormModal
          isOpen={showFormModal}
          initialData={selectedQuotation}
          onClose={() => {
            setShowFormModal(false);
            setSelectedQuotation(null);
          }}
          onSave={(savedQuotation, closeModal = true) => {
            if (selectedQuotation) {
              setQuotations(prev => prev.map(q => q.id === savedQuotation.id ? savedQuotation : q));
              // Do not show double toast for Accept since QuotationFormModal handles it
              if (closeModal) toast.success('Quotation updated successfully');
            } else {
              setQuotations(prev => [...prev, savedQuotation]);
              if (closeModal) toast.success('Quotation saved successfully');
            }
            if (closeModal) {
              setShowFormModal(false);
              setSelectedQuotation(null);
            } else {
              // Keep modal open but update selectedQuotation so initialData has the saved id
              // This ensures Undo will update the existing record, not create a new one
              setSelectedQuotation(savedQuotation);
            }
          }}
          onConvertToInvoice={onConvertToInvoice}
          onDelete={async (id) => {
            await handleDelete(id);
            setShowFormModal(false);
            setSelectedQuotation(null);
          }}
          onCopy={async (copiedData) => {
            try {
              const created = await createQuotation(copiedData);
              setQuotations(prev => [...prev, created]);
              toast.success('Quotation copied successfully');
              setShowFormModal(false);
              setSelectedQuotation(null);
            } catch (err) {
              toast.error('Failed to copy quotation');
            }
          }}
        />
      )}

    </div>
  );
}
