import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Printer,
  PackageSearch,
  Box,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useDataStore from '../../store/dataStore';

// Local storage services
import { getQuotations } from '../../services/quotationService';
import { getInvoices } from '../../services/InvoiceService';
import { getSalesReturns } from '../../services/SalesReturnService';
import { getPurchases } from '../../services/PurchaseService';
import { getPurchaseOrders } from '../../services/PurchaseOrderService';
import { getPurchaseReturns } from '../../services/PurchaseReturnService';

export default function ItemTracker() {
  const { items, fetchItems, transactions, fetchTransactions, isLoading } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [localTransactions, setLocalTransactions] = useState([]);
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState('All');
  const [partyFilter, setPartyFilter] = useState('');
  
  useEffect(() => {
    fetchItems();
    fetchTransactions();

    // Fetch local transactions for testing period
    const fetchLocal = async () => {
      try {
        const [
          quotations, invoices, salesReturns, 
          purchases, purchaseOrders, purchaseReturns
        ] = await Promise.all([
          getQuotations(), getInvoices(), getSalesReturns(),
          getPurchases(), getPurchaseOrders(), getPurchaseReturns()
        ]);

        const mapped = [];
        const extract = (records, type) => {
          (records || []).forEach(record => {
            const items = record.details?.items || record.items || [];
            items.forEach(item => {
              if (item.type === 'heading' || (!item.itemCode && !item.code)) return;
              mapped.push({
                id: `${record.id}-${item.id || Math.random()}`,
                date: record.date || record.invoiceDate || record.orderDate,
                type: type,
                itemCode: item.itemCode || item.code,
                itemName: item.description || item.itemName,
                vendorName: record.vendorName || record.customerName || record.company || record.customer,
                qty: Number(item.quantity || item.qty || item.dispatchQty || 0),
                remarks: record.remarks || record.quotationNo || record.invoiceNo || record.purchaseNo || ''
              });
            });
          });
        };

        extract(quotations, 'Sales Order');
        extract(invoices, 'Sales Invoice');
        extract(salesReturns, 'Sales Return');
        extract(purchases, 'Purchase');
        extract(purchaseOrders, 'Purchase Order');
        extract(purchaseReturns, 'Purchase Return');

        setLocalTransactions(mapped);
      } catch (e) {
        console.error("Error loading local transactions", e);
      }
    };
    fetchLocal();
  }, [fetchItems, fetchTransactions]);

  // Combine remote and local transactions
  const allTransactions = useMemo(() => {
    return [...transactions, ...localTransactions];
  }, [transactions, localTransactions]);

  // Derive unique transaction types and parties for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(allTransactions.map(t => t.type));
    return ['All', ...Array.from(types).filter(Boolean)];
  }, [allTransactions]);

  const uniqueParties = useMemo(() => {
    const parties = new Set(allTransactions.map(t => t.vendorName || t.customerName || t.company || t.customer));
    return Array.from(parties).filter(Boolean);
  }, [allTransactions]);

  // Handle Item Selection from search
  const handleItemSelect = (inputStr) => {
    let code = inputStr;
    const found = items.find(i => 
      i.itemCode?.toLowerCase() === inputStr.toLowerCase() || 
      i.description?.toLowerCase() === inputStr.toLowerCase()
    );
    if (found) {
      code = found.itemCode;
    }
    setSelectedItemCode(code);
    setSearchTerm(code); // Update input to show selected code
  };

  // Filter and Calculate Stock
  const trackerData = useMemo(() => {
    if (!selectedItemCode) return { history: [], summary: {} };

    // 1. Get all transactions for this item
    const itemTx = allTransactions.filter(t => t.itemCode?.toLowerCase() === selectedItemCode.toLowerCase());
    
    // 2. Sort Oldest to Newest to calculate running balance
    const sortedTx = [...itemTx].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let balance = 0;
    let totalPurchased = 0;
    let totalSold = 0;
    
    const enriched = sortedTx.map(tx => {
      const qty = Number(tx.qty || 0);
      let change = 0;
      const type = (tx.type || '').toLowerCase();
      
      if (type.includes('purchase') && !type.includes('return')) {
        change = qty;
        totalPurchased += qty;
      } else if (type.includes('sale') && !type.includes('return')) {
        change = -qty;
        totalSold += qty;
      } else if (type.includes('purchase return')) {
        change = -qty;
      } else if (type.includes('sales return')) {
        change = qty;
      } else if (type.includes('dispatch')) {
        // Dispatches reduce stock if they are separate from sales
        change = -qty; 
        totalSold += qty;
      }
      
      balance += change;
      
      return {
        ...tx,
        change,
        currentStock: balance
      };
    });
    
    // 3. Reverse for display (Newest First)
    enriched.reverse();

    // 4. Apply Secondary Filters
    let filtered = enriched;
    
    if (dateRange.start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateRange.end));
    }
    if (typeFilter !== 'All') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    if (partyFilter) {
      filtered = filtered.filter(t => {
        const party = t.vendorName || t.customerName || t.company || t.customer || '';
        return party.toLowerCase().includes(partyFilter.toLowerCase());
      });
    }

    const lastTx = enriched.length > 0 ? enriched[0] : null;

    return {
      history: filtered,
      summary: {
        currentStock: balance,
        totalPurchased,
        totalSold,
        lastTransactionDate: lastTx ? lastTx.date : null
      }
    };
  }, [selectedItemCode, allTransactions, dateRange, typeFilter, partyFilter]);

  const { history, summary } = trackerData;
  const selectedItemDetails = items.find(i => i.itemCode === selectedItemCode);

  // --- PDF Export Logic ---
  const generatePdfDoc = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Company Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text('PAREKH GALLERIUM', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199); 
    doc.text('PREMIUM INVENTORY MANAGEMENT SYSTEM', 14, 26);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('VIP Road, Raipur, Chhattisgarh - 492001', 14, 32);
    doc.text('Phone: +91 98765 43210', 14, 37);
    doc.text('Email: contact@parekhgallerium.com', 14, 42);
    
    // Report Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(148, 163, 184); 
    doc.text('ITEM TRACKER', pageWidth - 14, 20, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Generated:`, pageWidth - 45, 28, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd-MMM-yyyy HH:mm'), pageWidth - 14, 28, { align: 'right' });

    // Item Details Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 48, pageWidth - 28, 25, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text('Selected Item Information', 18, 54);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Item Code: ${selectedItemCode || '-'}`, 18, 62);
    doc.text(`Description: ${selectedItemDetails?.description || '-'}`, 18, 68);
    
    doc.text(`Current Stock: ${summary.currentStock || 0}`, pageWidth / 2, 62);
    doc.text(`Total Purchased: ${summary.totalPurchased || 0}`, pageWidth / 2, 68);
    
    doc.text(`Total Sold: ${summary.totalSold || 0}`, pageWidth - 20, 62, { align: 'right' });
    doc.text(`Brand: ${selectedItemDetails?.brand || '-'}`, pageWidth - 20, 68, { align: 'right' });

    // Table
    autoTable(doc, {
      startY: 78,
      head: [['Date', 'Transaction Type', 'Party', 'Qty', 'Stock Balance', 'Remarks']],
      body: history.map(row => [
        format(new Date(row.date), 'dd-MMM-yyyy'),
        row.type || '-',
        row.vendorName || row.customerName || row.company || row.customer || '-',
        row.qty,
        row.currentStock,
        row.remarks || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'left' },
        3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 25, fontStyle: 'bold', textColor: [15, 23, 42] },
        5: { halign: 'left' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 20, left: 14, right: 14, bottom: 20 },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });

    return doc;
  };

  const handlePdfDownload = () => {
    if (!selectedItemCode) return;
    const doc = generatePdfDoc();
    doc.save(`ItemTracker_${selectedItemCode}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  const handlePrint = () => {
    if (!selectedItemCode) return;
    const doc = generatePdfDoc();
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PackageSearch className="text-sky-600" size={28} />
            Item Tracker
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Audit complete transaction history and stock movement</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handlePdfDownload}
            disabled={!selectedItemCode || history.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download size={18} /> <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button 
            onClick={handlePrint}
            disabled={!selectedItemCode || history.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold transition-colors disabled:opacity-50 shadow-sm shadow-sky-200"
          >
            <Printer size={18} /> <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Controls Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          
          {/* Item Search */}
          <div className="flex-[4] min-w-[280px] relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Search Item</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type Item Code or Name..."
                className="w-full min-w-0 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
                list="items-list"
              />
              <datalist id="items-list">
                {items.map(item => (
                  <option key={item.itemCode} value={item.itemCode}>
                    {item.description}
                  </option>
                ))}
              </datalist>
            </div>
            {searchTerm && !selectedItemCode && (
              <p className="absolute -bottom-5 left-0 text-xs text-amber-600 font-medium whitespace-nowrap">Please select an item from the list to view history.</p>
            )}
          </div>

          {/* Date Filters */}
          <div className="flex-[4] min-w-[280px]">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full min-w-0 px-2 sm:px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-medium outline-none"
                />
              </div>
              <span className="text-slate-400">to</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full min-w-0 px-2 sm:px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex-[2] min-w-[160px]">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-medium outline-none"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Load Button */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-transparent mb-2 hidden md:block">&nbsp;</label>
            <button 
              onClick={() => handleItemSelect(searchTerm)}
              className="w-full py-2.5 px-4 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold transition-colors shadow-sm shadow-sky-200 whitespace-nowrap"
            >
              Track Item
            </button>
          </div>
          
        </div>
      </div>

      {/* Item Information & Summary Cards */}
      {selectedItemCode && (
        <>
          {selectedItemDetails && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex items-center gap-4">
              <div className="p-3 bg-sky-50 rounded-lg">
                <Box size={24} className="text-sky-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{selectedItemDetails.description || 'Unknown Item'}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Hash size={14} /> {selectedItemCode}</span>
                  {selectedItemDetails.brand && <span className="flex items-center gap-1"><Filter size={14} /> {selectedItemDetails.brand}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Current Stock</span>
                <Box size={18} className="text-sky-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">{summary.currentStock || 0}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Purchased</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">{summary.totalPurchased || 0}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Sold</span>
                <TrendingDown size={18} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-slate-800">{summary.totalSold || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Last Transaction</span>
                <Clock size={18} className="text-amber-500" />
              </div>
              <p className="text-lg font-black text-slate-800 mt-1">
                {summary.lastTransactionDate ? format(new Date(summary.lastTransactionDate), 'dd MMM yyyy') : '-'}
              </p>
            </div>
          </div>

          {/* Timeline / Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                    <th className="px-6 py-4 text-center">Date</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-center">Party</th>
                    <th className="px-6 py-4 text-center">Qty Change</th>
                    <th className="px-6 py-4 text-center">Stock Balance</th>
                    <th className="px-6 py-4 text-center">Remarks/Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length > 0 ? (
                    history.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium text-center">
                          {tx.date ? format(new Date(tx.date), 'dd-MMM-yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider
                            ${(tx.type || '').toLowerCase().includes('purchase') ? 'bg-emerald-100 text-emerald-700' : 
                              (tx.type || '').toLowerCase().includes('sale') ? 'bg-rose-100 text-rose-700' : 
                              'bg-sky-100 text-sky-700'}`}
                          >
                            {tx.type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-medium capitalize text-center">
                          {tx.vendorName || tx.customerName || tx.company || tx.customer || '-'}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`font-black ${tx.change > 0 ? 'text-emerald-600' : tx.change < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {tx.change > 0 ? '+' : ''}{tx.change}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="font-black text-slate-800 px-3 py-1 bg-slate-100 rounded-lg">
                            {tx.currentStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs text-center">
                          {tx.remarks || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <PackageSearch size={32} className="text-slate-300" />
                          <p className="font-medium">No transactions found for this item with current filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State before selection */}
      {!selectedItemCode && (
        <div className="mt-12 flex flex-col items-center justify-center text-slate-400">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <PackageSearch size={40} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-600 mb-2">Track Item History</h2>
          <p className="text-sm font-medium text-center max-w-md">
            Search and select an item code above to view its complete chronological transaction history, stock movements, and export detailed audit reports.
          </p>
        </div>
      )}

    </div>
  );
}
