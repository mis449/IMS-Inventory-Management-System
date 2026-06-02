import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCcw } from 'lucide-react';
import ModalForm from '../../components/ModalForm';

export default function CreateSalesReturnModal({ isOpen, onClose, initialData, onSave }) {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    if (initialData && initialData.details && initialData.details.items) {
      const mapped = initialData.details.items.map(item => ({
        ...item,
        returnQty: item.returnQty !== undefined ? item.returnQty : (item.quantity || 0),
      }));
      setItems(mapped);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleUpdateReturnQty = (index, delta) => {
    const newItems = [...items];
    const item = newItems[index];
    let newQty = Number(item.returnQty) + delta;
    if (newQty < 0) newQty = 0;
    if (newQty > (item.quantity || 0)) newQty = item.quantity || 0;
    item.returnQty = newQty;
    setItems(newItems);
  };

  const setExactReturnQty = (index, val) => {
    const newItems = [...items];
    const item = newItems[index];
    let newQty = Number(val);
    if (isNaN(newQty)) newQty = 0;
    if (newQty < 0) newQty = 0;
    if (newQty > (item.quantity || 0)) newQty = item.quantity || 0;
    item.returnQty = newQty;
    setItems(newItems);
  };

  const totalQty = items.reduce((sum, item) => sum + Number(item.returnQty || 0), 0);
  const totalItemAmt = items.reduce((sum, item) => sum + (Number(item.returnQty || 0) * Number(item.unitPrice || 0)), 0);
  const totalDisc = items.reduce((sum, item) => sum + (Number(item.returnQty || 0) * Number(item.unitPrice || 0) * (Number(item.discountPercent || 0) / 100)), 0);
  const totalTax = items.reduce((sum, item) => {
    const amtAfterDisc = (Number(item.returnQty || 0) * Number(item.unitPrice || 0)) * (1 - (Number(item.discountPercent || 0) / 100));
    return sum + (amtAfterDisc * (Number(item.taxPercent || 0) / 100));
  }, 0);
  
  const totalNetRaw = totalItemAmt - totalDisc + totalTax;
  const totalNet = Math.round(totalNetRaw);
  const roundoff = (totalNet - totalNetRaw).toFixed(2);

  const handleCreateSalesReturn = () => {
    const returnData = {
      ...initialData,
      SalesReturnNo: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      totalAmount: totalNet,
      status: 'Active',
      details: {
        ...initialData.details,
        items: items.filter(item => item.type === 'section' || item.type === 'subsection' || item.returnQty > 0).map(item => ({
          ...item,
          quantity: item.returnQty,
          returnQty: undefined // clean up for saved state
        }))
      }
    };
    onSave(returnData);
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Return"
      hideFooter={true}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col space-y-4 -mt-2">
        
        {/* Action & Summary Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-sm">
          <div className="flex flex-wrap text-[11px] font-bold text-slate-600 gap-x-4 gap-y-2 items-center">
            <span>Total Selected Line(s): <span className="text-slate-900">{items.filter(i => i.returnQty > 0).length}</span></span>
            <span>Total Return Qty: <span className="text-slate-900">{totalQty}</span></span>
            <span>Total Item Amt: <span className="text-slate-900">{totalItemAmt.toLocaleString()}</span></span>
            <span>Total Disc: <span className="text-slate-900">{Math.round(totalDisc).toLocaleString()}</span></span>
            <span>Total Tax: <span className="text-slate-900">{Math.round(totalTax).toLocaleString()}</span></span>
            <span>Roundoff: <span className="text-slate-900">{roundoff}</span></span>
            <span className="text-sky-700 flex items-center gap-1 md:border-l border-slate-300 md:pl-4">
              Total Net Return: <span className="text-lg tracking-tight font-black">{totalNet.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex shrink-0">
            <button
              type="button"
              onClick={handleCreateSalesReturn}
              disabled={totalQty === 0}
              className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-sm shadow-sm"
            >
              <RefreshCcw size={16} /> Convert to Sales Return
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3 border-b border-slate-200 w-12 text-center">#</th>
                <th className="p-3 border-b border-slate-200">Item Code</th>
                <th className="p-3 border-b border-slate-200 w-64">Item Name</th>
                <th className="p-3 border-b border-slate-200 text-center">Invoice Qty</th>
                <th className="p-3 border-b border-slate-200 text-center w-36">Return Qty</th>
                <th className="p-3 border-b border-slate-200 text-right">Rate</th>
                <th className="p-3 border-b border-slate-200 text-right">Amount</th>
                <th className="p-3 border-b border-slate-200 text-center">Disc %</th>
                <th className="p-3 border-b border-slate-200 text-right">Disc Amt</th>
                <th className="p-3 border-b border-slate-200 text-center">Tax %</th>
                <th className="p-3 border-b border-slate-200 text-right">Tax Amt</th>
                <th className="p-3 border-b border-slate-200 text-right">Net Amt</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-700">
              {items.map((item, idx) => {
                if (item.type === 'section' || item.type === 'subsection') {
                  return (
                    <tr key={item.id || idx} className={`${item.type === 'section' ? 'bg-sky-50/50' : 'bg-slate-50'} border-b border-slate-200`}>
                      <td colSpan="11" className={`p-2 px-4 font-bold uppercase tracking-wider text-[11px] ${item.type === 'section' ? 'text-sky-700' : 'text-slate-600 pl-8'}`}>
                        {item.type === 'section' ? `SECTION: ${item.description}` : `SUB-SECTION: ${item.description}`}
                      </td>
                    </tr>
                  );
                }

                const rate = Number(item.unitPrice || 0);
                const amount = Number(item.returnQty || 0) * rate;
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
                    <td className="p-3 text-center text-slate-400 font-normal">{item.quantity || 0}</td>
                    
                    {/* Return Qty Controls */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center bg-white border border-slate-200 rounded-lg overflow-hidden h-7 shadow-sm">
                        <button type="button" onClick={() => handleUpdateReturnQty(idx, -1)} className="w-7 h-full text-slate-500 hover:bg-slate-100 flex items-center justify-center border-r border-slate-200 font-black">-</button>
                        <input 
                          type="number"
                          value={item.returnQty}
                          onChange={(e) => setExactReturnQty(idx, e.target.value)}
                          className="w-10 h-full text-center text-xs font-bold text-sky-700 focus:outline-none focus:bg-sky-50"
                        />
                        <button type="button" onClick={() => handleUpdateReturnQty(idx, 1)} className="w-7 h-full text-slate-500 hover:bg-slate-100 flex items-center justify-center border-l border-slate-200 font-black">+</button>
                        <button type="button" onClick={() => setExactReturnQty(idx, 0)} className="w-7 h-full text-red-500 hover:bg-red-50 flex items-center justify-center border-l border-slate-200 font-black text-[10px]">X</button>
                      </div>
                    </td>

                    <td className="p-3 text-right">{rate.toLocaleString()}</td>
                    <td className="p-3 text-right">{Math.round(amount).toLocaleString()}</td>
                    <td className="p-3 text-center">{discPct}</td>
                    <td className="p-3 text-right">{Math.round(discAmt).toLocaleString()}</td>
                    <td className="p-3 text-center">{taxPct}</td>
                    <td className="p-3 text-right">{Math.round(taxAmt).toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-slate-900">{Math.round(netAmt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium">No items found for sales return.</div>
          )}
        </div>
      </div>
    </ModalForm>
  );
}
