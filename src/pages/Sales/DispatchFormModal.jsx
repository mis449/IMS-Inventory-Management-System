import React, { useState, useEffect } from 'react';
import { Calendar, Search, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';

export default function DispatchFormModal({ isOpen, onClose, initialData, onSave, onConvertToInvoice }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDispatchItem, setActiveDispatchItem] = useState(null);
  const [tempQty, setTempQty] = useState(0);

  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) {
      fetchItems(true);
    }
  }, [isOpen, fetchItems]);

  useEffect(() => {
    if (initialData && initialData.details && initialData.details.items) {
      setItems(prevItems => {
        return initialData.details.items.map(item => {
          if (item.type !== 'item') return item;
          const ordered = Number(item.quantity || 0);
          const dispatched = Number(item.dispatchedQty || 0);
          const pending = Math.max(0, ordered - dispatched);

          // Find corresponding inventory item to get live stock
          const invItem = inventoryItems.find(i => (i.ItemCode || i.code) === item.itemCode);
          const hasRealStock = invItem && Number(invItem.StockQty || 0) > 0;
          const stock = hasRealStock ? Number(invItem.StockQty) : 99;
          const isDemoStock = !hasRealStock;

          // Preserve user-modified dispatchQty if the item already exists in state
          const existingItem = prevItems.find(i => i.id === item.id);
          const currentDispatchQty = existingItem && existingItem.dispatchQty !== undefined 
                                       ? existingItem.dispatchQty 
                                       : pending;

          return {
            ...item,
            orderedQty: ordered,
            dispatchedQty: dispatched,
            dispatchQty: currentDispatchQty,
            stock: stock,
            isDemoStock: isDemoStock
          };
        });
      });
    }
  }, [initialData, inventoryItems]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setActiveDispatchItem(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateDispatchQty = (itemId, delta) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    let newQty = Number(item.dispatchQty) + delta;
    const pending = Math.max(0, Number(item.orderedQty || 0) - Number(item.dispatchedQty || 0));
    const maxVal = item.stock || 0;
    
    if (newQty < 0) newQty = 0;
    if (newQty > maxVal) {
      toast.error(`Quantity cannot exceed available stock (${item.stock || 0})`);
      newQty = maxVal;
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, dispatchQty: newQty } : i));
  };

  const setExactDispatchQty = (itemId, val) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (val === '') {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, dispatchQty: '' } : i));
      return;
    }

    let newQty = Number(val);
    const pending = Math.max(0, Number(item.orderedQty || 0) - Number(item.dispatchedQty || 0));
    const maxVal = item.stock || 0;
    
    if (isNaN(newQty)) newQty = 0;
    if (newQty < 0) newQty = 0;
    if (newQty > maxVal) {
      toast.error(`Quantity cannot exceed available stock (${item.stock || 0})`);
      newQty = maxVal;
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, dispatchQty: newQty } : i));
  };

  const handleConvertToInvoice = () => {
    const dispatchedData = {
      ...initialData,
      details: {
        ...initialData.details,
        items: items.filter(item => item.type === 'section' || item.type === 'subsection' || item.dispatchQty > 0).map(item => ({
          ...item,
          quantity: item.dispatchQty
        }))
      },
      originalQuotationItems: items.map(item => {
        if (item.type === 'item') {
          return {
            ...item,
            quantity: item.orderedQty,
            dispatchedQty: Number(item.dispatchedQty || 0) + Number(item.dispatchQty || 0)
          };
        }
        return item;
      })
    };
    onConvertToInvoice(dispatchedData);
  };

  const totalQty = items.reduce((sum, item) => sum + Number(item.dispatchQty || 0), 0);
  const totalItemAmt = items.reduce((sum, item) => sum + (Number(item.dispatchQty || 0) * Number(item.unitPrice || 0)), 0);
  const totalDisc = items.reduce((sum, item) => sum + (Number(item.dispatchQty || 0) * Number(item.unitPrice || 0) * (Number(item.discountPercent || 0) / 100)), 0);
  const totalTax = items.reduce((sum, item) => {
    const amtAfterDisc = (Number(item.dispatchQty || 0) * Number(item.unitPrice || 0)) * (1 - (Number(item.discountPercent || 0) / 100));
    return sum + (amtAfterDisc * (Number(item.taxPercent || 0) / 100));
  }, 0);
  
  const totalNetRaw = totalItemAmt - totalDisc + totalTax;
  const totalNet = Math.round(totalNetRaw);
  const roundoff = (totalNet - totalNetRaw).toFixed(2);

  // Search filter logic
  const filteredItems = items.filter((item, index) => {
    if (!searchTerm.trim()) return true;
    
    const query = searchTerm.toLowerCase().trim();
    
    // For items, check code and description
    if (item.type !== 'section' && item.type !== 'subsection') {
      return (
        (item.itemCode && item.itemCode.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    // For sections/subsections, check if any item belongs to it that matches the query
    let hasMatchingItem = false;
    for (let i = index + 1; i < items.length; i++) {
      const nextItem = items[i];
      if (nextItem.type === 'section' || nextItem.type === 'subsection') {
        break; // reached next section/subsection
      }
      const matches = (
        (nextItem.itemCode && nextItem.itemCode.toLowerCase().includes(query)) ||
        (nextItem.description && nextItem.description.toLowerCase().includes(query))
      );
      if (matches) {
        hasMatchingItem = true;
        break;
      }
    }
    
    return hasMatchingItem || (item.description && item.description.toLowerCase().includes(query));
  });

  const showStatusColumn = initialData && initialData.status === 'In Progress';

  return (
    <>
      <ModalForm
        isOpen={isOpen}
        onClose={onClose}
        title="Dispatch Material"
        hideFooter={true}
        maxWidth="max-w-6xl"
      >
      <div className="flex flex-col space-y-4 -mt-2">
        
        {/* Action & Summary Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm">
          <div className="flex flex-wrap text-[11px] font-bold text-slate-600 gap-x-4 gap-y-2 items-center">
            <span>Total Selected Line(s): <span className="text-slate-900">{items.filter(i => i.dispatchQty > 0).length}</span></span>
            <span>Total Quantity: <span className="text-slate-900">{totalQty}</span></span>
            <span>Total Item Amt: <span className="text-slate-900">{totalItemAmt.toLocaleString()}</span></span>
            <span>Total Disc: <span className="text-slate-900">{Math.round(totalDisc).toLocaleString()}</span></span>
            <span>Total Tax: <span className="text-slate-900">{Math.round(totalTax).toLocaleString()}</span></span>
            <span>Roundoff: <span className="text-slate-900">{roundoff}</span></span>
            <span className="text-sky-700 flex items-center gap-1 md:border-l border-slate-300 md:pl-4">
              Total Net: <span className="text-lg tracking-tight font-black">{totalNet.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={totalQty === 0}
              className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-sm shadow-sm"
            >
              <Calendar size={16} /> Convert to Invoice
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-[12px] text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search items by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[40px] outline-none shadow-sm"
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-[12px] text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3 border-b border-slate-200 w-12 text-center">#</th>
                <th className="p-3 border-b border-slate-200">Item Code</th>
                <th className="p-3 border-b border-slate-200 w-64">Item Name</th>
                {showStatusColumn && <th className="p-3 border-b border-slate-200 text-center">Status</th>}
                <th className="p-3 border-b border-slate-200 text-center">Qty</th>
                <th className="p-3 border-b border-slate-200 text-center">Stock</th>
                <th className="p-3 border-b border-slate-200 text-center w-36">Dispatch Qty</th>
                <th className="p-3 border-b border-slate-200 text-right">Rate</th>
                <th className="p-3 border-b border-slate-200 text-right">Amount</th>
                <th className="p-3 border-b border-slate-200 text-center">Disc %</th>
                <th className="p-3 border-b border-slate-200 text-right">Disc Amt</th>
                <th className="p-3 border-b border-slate-200 text-center">Tax %</th>
                <th className="p-3 border-b border-slate-200 text-right">Tax Amt</th>
                <th className="p-3 border-b border-slate-200 text-right">Net Amt</th>
                <th className="p-3 border-b border-slate-200 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-700">
              {filteredItems.map((item, idx) => {
                if (item.type === 'section' || item.type === 'subsection') {
                  return (
                    <tr key={item.id || idx} className={`${item.type === 'section' ? 'bg-sky-50/50' : 'bg-slate-50'} border-b border-slate-200`}>
                      <td colSpan={showStatusColumn ? "15" : "14"} className={`p-2 px-4 font-bold uppercase tracking-wider text-[11px] ${item.type === 'section' ? 'text-sky-700' : 'text-slate-600 pl-8'}`}>
                        {item.type === 'section' ? `SECTION: ${item.description}` : `SUB-SECTION: ${item.description}`}
                      </td>
                    </tr>
                  );
                }

                const rate = Number(item.unitPrice || 0);
                const amount = Number(item.dispatchQty || 0) * rate;
                const discPct = Number(item.discountPercent || 0);
                const discAmt = amount * (discPct / 100);
                const taxPct = Number(item.taxPercent || 0);
                const taxAmt = (amount - discAmt) * (taxPct / 100);
                const netAmt = amount - discAmt + taxAmt;

                return (
                  <tr key={item.id || idx} className="border-b border-slate-100 hover:bg-sky-50/30 transition-colors">
                    <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-sky-700">{item.itemCode}</td>
                    <td className="p-3 truncate max-w-[200px]" title={item.description}>{item.description}</td>
                    {showStatusColumn && (
                      <td className="p-3 text-center">
                        {Number(item.dispatchedQty || 0) >= Number(item.orderedQty || 0) ? (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-100 text-emerald-700 border border-emerald-250">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-100 text-amber-700 border border-amber-250">
                            Pending
                          </span>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-center">{item.orderedQty || item.quantity || 0}</td>
                    <td className="p-3 text-center text-slate-400 font-normal">
                      {item.stock}{item.isDemoStock ? ' (Demo)' : ''}
                    </td>
                    
                    {/* Dispatch Qty Controls */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center bg-white border border-slate-200 rounded-lg overflow-hidden h-7 shadow-sm">
                        <button type="button" onClick={() => handleUpdateDispatchQty(item.id, -1)} className="w-7 h-full text-slate-500 hover:bg-slate-100 flex items-center justify-center border-r border-slate-200 font-black">-</button>
                        <input 
                          type="number"
                          value={item.dispatchQty}
                          onChange={(e) => setExactDispatchQty(item.id, e.target.value)}
                          className="w-10 h-full text-center text-xs font-bold text-sky-700 focus:outline-none focus:bg-sky-50"
                        />
                        <button type="button" onClick={() => handleUpdateDispatchQty(item.id, 1)} className="w-7 h-full text-slate-500 hover:bg-slate-100 flex items-center justify-center border-l border-slate-200 font-black">+</button>
                        <button type="button" onClick={() => setExactDispatchQty(item.id, '')} className="w-7 h-full text-red-500 hover:bg-red-50 flex items-center justify-center border-l border-slate-200 font-black text-[10px]">X</button>
                      </div>
                    </td>

                    <td className="p-3 text-right">{rate.toLocaleString()}</td>
                    <td className="p-3 text-right">{Math.round(amount).toLocaleString()}</td>
                    <td className="p-3 text-center">{discPct}</td>
                    <td className="p-3 text-right">{Math.round(discAmt).toLocaleString()}</td>
                    <td className="p-3 text-center">{taxPct}</td>
                    <td className="p-3 text-right">{Math.round(taxAmt).toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-slate-900">{Math.round(netAmt).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDispatchItem(item);
                          setTempQty(item.dispatchQty);
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 inline-flex items-center justify-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        Partial Dispatch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium">No items found for dispatch.</div>
          )}
        </div>
      </div>
      </ModalForm>

      {/* Centered Sub-modal for Partial Dispatch to avoid table overflow clipping and z-index issues */}
      {activeDispatchItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Partial Dispatch</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{activeDispatchItem.itemCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDispatchItem(null)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-1 hover:bg-slate-50 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            {/* Item Details Info Card */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2.5 shadow-sm">
              <div className="font-semibold text-slate-800 leading-snug">{activeDispatchItem.description}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2.5 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Ordered Qty</span>
                  <span className="text-slate-800 font-bold text-xs">
                    {activeDispatchItem.orderedQty || activeDispatchItem.quantity || 0} pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Already Dispatched</span>
                  <span className="text-emerald-600 font-bold text-xs">
                    {activeDispatchItem.dispatchedQty || 0} pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Pending Qty</span>
                  <span className="text-amber-600 font-bold text-xs">
                    {Math.max(0, (activeDispatchItem.orderedQty || activeDispatchItem.quantity || 0) - (activeDispatchItem.dispatchedQty || 0))} pcs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Available Stock</span>
                  <span className="text-slate-800 font-bold text-xs">
                    {activeDispatchItem.stock}{activeDispatchItem.isDemoStock ? ' (Demo)' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Input fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wide">Actual Dispatch Quantity</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    value={tempQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTempQty(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-3.5 pr-10 text-sm text-sky-700 font-black focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none"
                    placeholder="Enter dispatch qty..."
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-[11px] text-xs font-bold text-slate-400">pcs</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wide">Remaining Quantity</label>
                <div className="w-full bg-amber-50/50 border border-amber-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-700 flex justify-between items-center">
                  <span>Pending Order Qty:</span>
                  <span className="text-sm font-black">
                    {Math.max(0, (activeDispatchItem.orderedQty || activeDispatchItem.quantity || 0) - Number(tempQty || 0) - (activeDispatchItem.dispatchedQty || 0))} pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveDispatchItem(null)}
                className="flex-1 py-2 md:py-2.5 border border-slate-250 text-slate-650 hover:text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setExactDispatchQty(activeDispatchItem.id, tempQty);
                  setActiveDispatchItem(null);
                }}
                className="flex-1 py-2 md:py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-sky-100 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
