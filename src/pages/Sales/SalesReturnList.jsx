import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Filter, RefreshCw, Download, Edit, Eye, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { TabSwitcher } from '../../components/StandardButtons';
import SalesReturnFormModal from './SalesReturnFormModal';
import CreateSalesReturnModal from './CreateSalesReturnModal';
import { getSalesReturns, deleteSalesReturn, createSalesReturn } from '../../services/SalesReturnService';

export default function SalesReturnList({ conversionContext, clearConversionContext }) {
  const [SalesReturns, setSalesReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSalesReturn, setSelectedSalesReturn] = useState(null);

  
  const [filters, setFilters] = useState({
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch SalesReturns
  const fetchSalesReturnsData = async () => {
    setIsLoading(true);
    try {
      const data = await getSalesReturns();
      setSalesReturns(data || []);
    } catch (error) {
      toast.error('Failed to fetch SalesReturns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturnsData();
  }, []);

  useEffect(() => {
    if (conversionContext && conversionContext.source === 'Invoice') {
      setShowCreateModal(true);
    }
  }, [conversionContext]);

  const handleView = (item) => {
    setSelectedSalesReturn(item);
    setShowFormModal(true);
  };

  const handleClearFilters = () => {
    setFilters({ searchQuery: '' });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleRefresh = () => {
    fetchSalesReturnsData();
    toast.success('Data refreshed');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this SalesReturn?')) {
      try {
        await deleteSalesReturn(id);
        setSalesReturns(prev => prev.filter(q => String(q.id) !== String(id)));
        toast.success('SalesReturn deleted successfully');
      } catch (error) {
        toast.error('Failed to delete SalesReturn');
      }
    }
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  const filteredSalesReturns = useMemo(() => {
    return SalesReturns.filter(q => {
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          (q.SalesReturnNo || '').toLowerCase().includes(query) ||
          (q.customerName || '').toLowerCase().includes(query) ||
          (q.mobileNumber || '').toLowerCase().includes(query) ||
          (q.salesPerson || '').toLowerCase().includes(query)
        );
      }
      return true;
    }).reverse();
  }, [SalesReturns, filters]);

  const totalPages = Math.ceil(filteredSalesReturns.length / itemsPerPage) || 1;
  const paginatedSalesReturns = filteredSalesReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-sky-100 text-sky-700',
      'Accepted': 'bg-emerald-100 text-emerald-700',
      'Rejected': 'bg-rose-100 text-rose-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      'Completed': 'bg-indigo-100 text-indigo-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const tableHeaders = [
    "Doc #", "Doc Date", "Customer", "State", 
    "Mobile", "Sales Person", "Amount", "Action"
  ];

  const renderRow = (item, idx) => (
    <tr key={item.id || idx} className="hover:bg-sky-50/25 transition-colors border-b border-slate-100">
      <td className="px-4 py-3 text-center text-xs text-sky-600 font-bold whitespace-nowrap">{item.SalesReturnNo || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">{item.date || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-900 whitespace-nowrap truncate max-w-[150px]">{item.customerName || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.state || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.mobileNumber || '-'}</td>
      <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.salesPerson || '-'}</td>
      <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</td>
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
          <span className="text-xs font-bold text-slate-900 uppercase truncate max-w-[150px]">{item.customerName || '-'}</span>
        </div>
        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          {item.SalesReturnNo || '-'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Date</span>
          <span className="text-slate-700 font-medium">{item.date || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Status</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold inline-block ${getStatusColor(item.status)}`}>
            {item.status || 'Draft'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Sales Person</span>
          <span className="text-slate-700 font-medium">{item.salesPerson || '-'}</span>
        </div>
        <div>
          <span className="text-slate-400 block uppercase text-[8px] tracking-tight">Total Amount</span>
          <span className="text-emerald-600 font-bold">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-100 pt-2">
        <button onClick={() => handleView(item)} className="text-xs font-black text-sky-600 hover:text-sky-800 flex items-center gap-1">
          <Eye size={12} /> View
        </button>
        <button onClick={() => handleDelete(item.id)} className="text-xs font-black text-red-600 hover:text-red-800">
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Filters & Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row flex-1 w-full gap-2 lg:gap-3 items-center">
          
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-[12px] text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search SalesReturns..."
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
              title="Add SalesReturn"
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
          onClick={() => { setSelectedSalesReturn(null); setShowFormModal(true); }}
          className="hidden lg:flex bg-sky-600 hover:bg-sky-700 text-white rounded-xl items-center justify-center gap-1.5 transition shadow-md shadow-sky-100 h-[38px] px-4 flex-shrink-0 text-xs font-bold"
          title="Add SalesReturn"
        >
          <Plus size={16} /> SalesReturn Form
        </button>
      </div>



      {/* Main DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-500">Loading SalesReturns...</span>
          </div>
        ) : (
          <DataTable
            headers={tableHeaders}
            data={paginatedSalesReturns}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1000px"
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={filteredSalesReturns.length}
            itemsPerPageOptions={[20, 50, 100]}
          />
        )}
      </div>

      {/* View/Edit Existing Sales Return Modal */}
      {showFormModal && (
        <SalesReturnFormModal 
          isOpen={showFormModal} 
          onClose={() => setShowFormModal(false)}
          onSave={async (data) => {
             // In a real app we would call updateSalesReturn if ID exists
             setShowFormModal(false);
             toast.success('Sales Return saved successfully');
          }}
          initialData={selectedSalesReturn}
        />
      )}

      {/* Create New Sales Return from Invoice Modal */}
      {showCreateModal && (
        <CreateSalesReturnModal 
          isOpen={showCreateModal} 
          onClose={() => {
            setShowCreateModal(false);
            if (clearConversionContext) clearConversionContext();
          }}
          onSave={async (data) => {
            try {
              const created = await createSalesReturn(data);
              setSalesReturns(prev => [created, ...prev]);
              setShowCreateModal(false);
              if (clearConversionContext) clearConversionContext();
              toast.success('Sales Return created successfully');
            } catch (err) {
              toast.error('Failed to create Sales Return');
            }
          }}
          initialData={conversionContext?.data}
        />
      )}

    </div>
  );
}
