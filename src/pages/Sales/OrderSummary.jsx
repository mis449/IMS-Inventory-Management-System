import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search, Printer, Filter, RefreshCw, Box, User, Calendar, ChevronDown, FileText, Download } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import { getQuotations } from '../../services/quotationService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function OrderSummary() {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [printLayout, setPrintLayout] = useState('landscape');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const { items: inventoryItems, fetchItems, customers, fetchCustomers } = useDataStore();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotations();
      // Exclude purely Rejected quotations
      setQuotations(data.filter(q => q.status !== 'Rejected') || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchItems(false);
    fetchCustomers();
  }, []);

  // Use global customers from local storage
  const customerOptions = useMemo(() => {
    const custSet = new Set();
    // Add existing ones from quotations just in case they were deleted from global list but exist in history
    quotations.forEach(q => {
      if (q.customerName) custSet.add(q.customerName);
    });
    // Add from global customers
    customers.forEach(c => {
      if (c.name) custSet.add(c.name);
    });
    return Array.from(custSet).sort();
  }, [quotations, customers]);

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearch) return customerOptions;
    const q = customerSearch.toLowerCase();
    return customerOptions.filter(c => c.toLowerCase().includes(q));
  }, [customerOptions, customerSearch]);

  // Default customer auto-select removed to allow empty state

  // Process data for the table
  const orderItems = useMemo(() => {
    if (!selectedCustomer) return [];

    const customerOrders = quotations.filter(q => q.customerName === selectedCustomer);
    
    const allItems = [];
    
    customerOrders.forEach(order => {
      const items = order.details?.items || [];
      const orderDate = order.date;
      const expectedDate = order.details?.otherInfo?.expectedDeliveryDate || orderDate;

      // Date filtering
      if (startDate && new Date(orderDate) < new Date(startDate)) return;
      if (endDate && new Date(orderDate) > new Date(endDate)) return;

      items.forEach(item => {
        if (item.type !== 'item' || !item.itemCode) return;
        
        const invItem = inventoryItems.find(i => (i.ItemCode || i.code) === item.itemCode);
        const stockQty = invItem ? Number(invItem.StockQty || 0) : 0;
        
        const orderedQty = Number(item.quantity || 0);
        const dispatchedQty = Number(item.dispatchedQty || 0);
        const pendingQty = Math.max(0, orderedQty - dispatchedQty);
        
        allItems.push({
          id: `${order.id}-${item.id}`,
          orderNo: order.quotationNo,
          orderDate: orderDate,
          itemCode: item.itemCode,
          description: item.description,
          orderedQty: orderedQty,
          availableStock: stockQty,
          pendingQty: pendingQty,
          orderedToCompanyQty: 0, // Placeholder
          deliveryDate: expectedDate,
          status: order.status
        });
      });
    });

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return allItems.filter(item => 
        item.orderNo.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    return allItems.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, [selectedCustomer, quotations, inventoryItems, searchQuery, startDate, endDate]);

  // Summary stats
  const stats = useMemo(() => {
    return {
      totalOrders: new Set(orderItems.map(i => i.orderNo)).size,
      totalItemsOrdered: orderItems.reduce((acc, i) => acc + i.orderedQty, 0),
      totalPendingItems: orderItems.reduce((acc, i) => acc + i.pendingQty, 0),
    };
  }, [orderItems]);

  const generatePdfDoc = () => {
    if (!selectedCustomer && orderItems.length === 0) {
      toast.error('Please select a customer or ensure there is data to print.');
      return null;
    }

    const orientation = printLayout === 'landscape' ? 'l' : 'p';
    const doc = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- Header Section ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93); // Rose-700 equivalent
    doc.text('PAREKH SANITARY STORES', 14, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(7, 89, 133); // Sky-800 equivalent
    doc.text('Shop No. C -1, 3 & 4, Ramsagar Para Main Rd, Moudhapara, 492001 RAIPUR 492001 CHHATTISGARH, India', 14, 25);

    // Separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);

    // Document Title & Customer Info
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Order Summary Report', 14, 38);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Customer: ${selectedCustomer || 'All Customers'}`, 14, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, pageWidth - 14, 38, { align: 'right' });

    // Summary Stats block
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, 50, pageWidth - 28, 12, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Total Orders: ${stats.totalOrders}     |     Total Items: ${stats.totalItemsOrdered}     |     Pending Items: ${stats.totalPendingItems}`, pageWidth / 2, 57, { align: 'center' });

    // --- Table Section ---
    const tableColumn = ["Delivery Date", "Item Code", "Description", "To Supply", "In Stock", "To Company"];
    const tableRows = [];

    orderItems.forEach(item => {
      tableRows.push([
        item.deliveryDate,
        item.itemCode,
        item.description,
        item.pendingQty.toFixed(2),
        item.availableStock.toFixed(2),
        item.orderedToCompanyQty.toFixed(2)
      ]);
    });

    // Auto switch to landscape if many columns or portrait requested but data is too wide (handled inherently by autotable wrapping, but we respect user choice)
    
    autoTable(doc, {
      startY: 68,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        font: 'helvetica',
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [14, 165, 233], // sky-500
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: orientation === 'l' ? 30 : 25 },
        1: { halign: 'left', cellWidth: orientation === 'l' ? 45 : 35, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 'auto' }, 
        3: { halign: 'center', cellWidth: orientation === 'l' ? 25 : 20, fontStyle: 'bold', textColor: [15, 23, 42] },
        4: { halign: 'center', cellWidth: orientation === 'l' ? 25 : 20, fontStyle: 'bold', textColor: [5, 150, 105] }, // emerald-600
        5: { halign: 'center', cellWidth: orientation === 'l' ? 30 : 25 },
      },
      didDrawPage: function (data) {
        // Footer Section
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        
        // Page number
        const pageNumberStr = `Page ${doc.internal.getNumberOfPages()}`;
        doc.text(pageNumberStr, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Timestamp
        const timestamp = `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`;
        doc.text(timestamp, 14, pageHeight - 10);
        
        // App name
        doc.text('Parekh Gallerium IMS', pageWidth - 14, pageHeight - 10, { align: 'right' });
      }
    });


    return doc;
  };

  const handlePrint = () => {
    const doc = generatePdfDoc();
    if (!doc) return;
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  const handlePdfDownload = () => {
    const doc = generatePdfDoc();
    if (!doc) return;
    doc.save(`Order_Summary_${selectedCustomer || 'All'}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  const handleExcelDownload = () => {
    if (!selectedCustomer && orderItems.length === 0) {
      toast.error('Please select a customer or ensure there is data to export.');
      return;
    }
    const exportData = orderItems.map(item => ({
      "Tentative Delivery Date": item.deliveryDate,
      "Item Code": item.itemCode,
      "Description": item.description,
      "Ordered Qty": item.orderedQty,
      "In Stock": item.availableStock,
      "Order placed to company": item.orderedToCompanyQty
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order Summary");
    XLSX.writeFile(wb, `Order_Summary_${selectedCustomer || 'All'}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-sky-100 text-sky-700',
      'Accepted': 'bg-emerald-100 text-emerald-700',
      'In Progress': 'bg-amber-100 text-amber-700',
      'Completed': 'bg-indigo-100 text-indigo-700',
      'Final': 'bg-indigo-100 text-indigo-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${printLayout};
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 no-print">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          <div className="flex items-center gap-2 w-full sm:w-64 relative" ref={dropdownRef}>
            <User className="absolute left-3 top-3 text-slate-400 z-10" size={16} />
            <div 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold text-slate-700 cursor-pointer h-[42px] flex items-center justify-between"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate">{selectedCustomer || 'Select a Customer...'}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-100 relative">
                  <Search className="absolute left-4 top-4 text-slate-400" size={14} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <ul className="max-h-60 overflow-y-auto p-1">
                  <li 
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${!selectedCustomer ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    onClick={() => {
                      setSelectedCustomer('');
                      setIsDropdownOpen(false);
                      setCustomerSearch('');
                    }}
                  >
                    Select a Customer...
                  </li>
                  {filteredCustomerOptions.length === 0 ? (
                    <li className="px-3 py-4 text-xs text-center text-slate-400">No customers found</li>
                  ) : (
                    filteredCustomerOptions.map(cust => (
                      <li
                        key={cust}
                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors truncate ${selectedCustomer === cust ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setIsDropdownOpen(false);
                          setCustomerSearch('');
                        }}
                      >
                        {cust}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              className="w-full sm:w-[135px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all h-[42px]"
            />
            <span className="text-slate-400 text-sm font-semibold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              className="w-full sm:w-[135px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all h-[42px]"
            />
          </div>
          
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search items or orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm transition-all h-[42px]"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto justify-end">
          <select 
            value={printLayout}
            onChange={(e) => setPrintLayout(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-[42px] text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer shadow-sm transition-colors hover:bg-slate-100"
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl w-[42px] h-[42px] transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handlePdfDownload}
            className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl px-5 h-[42px] transition-all font-bold text-sm"
            title="Download PDF"
          >
            <FileText size={18} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={handleExcelDownload}
            className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl px-5 h-[42px] transition-all font-bold text-sm"
            title="Download Excel"
          >
            <Download size={18} /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl px-5 h-[42px] transition-all font-bold text-sm"
            title="Print"
          >
            <Printer size={18} /> <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="bg-gradient-to-br from-white to-sky-50/30 p-5 rounded-2xl border border-sky-100 shadow-sm shadow-sky-100/50 flex items-center gap-4 transition-all hover:shadow-md hover:border-sky-200">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
            <Box size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-600/70 uppercase tracking-wider mb-0.5">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-indigo-50/30 p-5 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50 flex items-center gap-4 transition-all hover:shadow-md hover:border-indigo-200">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
            <Box size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider mb-0.5">Total Items Ordered</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalItemsOrdered}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-rose-50/30 p-5 rounded-2xl border border-rose-100 shadow-sm shadow-rose-100/50 flex items-center gap-4 transition-all hover:shadow-md hover:border-rose-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
            <Box size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-600/70 uppercase tracking-wider mb-0.5">Pending Items</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalPendingItems}</p>
          </div>
        </div>
      </div>

      {/* Main Table Area (Printable) */}
      <div id="print-area" className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Print Header (Visible only when printing) */}
        <div className="hidden print:block mb-4 p-4 border-b-2 border-sky-600">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black text-rose-700 tracking-wider uppercase">Parekh Sanitary Stores</h1>
              <p className="text-[10px] text-sky-800 font-bold">Shop No. C -1, 3 & 4, Ramsagar Para Main Rd, Moudhapara, 492001 RAIPUR 492001 CHHATTISGARH, India</p>
            </div>
          </div>
          <div className="mt-4 bg-emerald-50/50 p-2 border-b border-emerald-100">
            <h2 className="text-sm font-black text-slate-900">{selectedCustomer ? `${selectedCustomer}` : 'No Customer Selected'}</h2>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto p-4 print:p-0 print:overflow-visible">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px] print:min-w-0 print:text-[10px] print:w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200 print:border-black print:bg-cyan-400 print:text-black print:-webkit-print-color-adjust: exact text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-4 text-center border-x border-slate-100 print:border-black">Tentative Delivery Date</th>
                <th className="px-4 py-4 border-r border-slate-100 print:border-black">Item Code</th>
                <th className="px-4 py-4 border-r border-slate-100 print:border-black">Description</th>
                <th className="px-4 py-4 text-center border-r border-slate-100 print:border-black">Ordered Qty</th>
                <th className="px-4 py-4 text-center border-r border-slate-100 print:border-black">In Stock</th>
                <th className="px-4 py-4 text-center border-r border-slate-100 print:border-black">Order placed to company</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">Loading orders...</td>
                </tr>
              ) : !selectedCustomer ? (
                <tr>
                  <td colSpan="9" className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <User size={32} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-600 text-base">Please select a customer</p>
                      <p className="text-sm text-slate-400 mt-1">Choose a customer from the dropdown to view their order summary.</p>
                    </div>
                  </td>
                </tr>
              ) : orderItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Box size={32} className="text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No orders found for {selectedCustomer}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orderItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs print:border-black">
                    <td className="px-4 py-3.5 text-center font-bold text-slate-600 border-x border-slate-100 print:border-black">{item.deliveryDate}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-700 border-r border-slate-100 print:border-black">{item.itemCode}</td>
                    <td className="px-4 py-3.5 text-slate-600 border-r border-slate-100 print:border-black max-w-xs">{item.description}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800 border-r border-slate-100 print:border-black">{item.orderedQty.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600 border-r border-slate-100 print:border-black">{item.availableStock.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-600 border-r border-slate-100 print:border-black">{item.orderedToCompanyQty.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
