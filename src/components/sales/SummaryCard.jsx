import React from 'react';

export default function SummaryCard({ summary, onFinalAmountChange }) {
  return (
    <div className="flex justify-end pt-4">
      <div className="w-full md:w-1/3 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Gross Amount:</span> <span>₹{summary.grossAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Discount Amount:</span> <span className="text-rose-500">-₹{summary.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Tax Amount:</span> <span className="text-amber-600">+₹{summary.taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Round Off:</span> <span>₹{summary.roundOffAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
          <span>Total Amount:</span> <span className="text-emerald-600">₹{summary.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
        {(summary.finalAmount !== undefined || onFinalAmountChange) && (
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
            <span>Final Amount:</span> 
            {onFinalAmountChange ? (
              <div className="flex items-center gap-1.5 bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-transparent hover:border-emerald-200 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-sm">
                <span className="font-bold text-emerald-600">₹</span>
                <input 
                  type="number" 
                  value={summary.finalAmount || ''} 
                  onChange={(e) => onFinalAmountChange(e.target.value)}
                  className="w-24 text-right bg-transparent border-none p-0 focus:ring-0 focus:outline-none font-bold text-emerald-700 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-emerald-300 placeholder:font-normal"
                  placeholder="0.00"
                />
              </div>
            ) : summary.finalAmount ? (
              <span className="text-emerald-600">₹{Number(summary.finalAmount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
