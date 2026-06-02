import React from 'react';

export default function SummaryCard({ summary }) {
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
        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
          <span>Total Amount:</span> <span className="text-emerald-600">₹{summary.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        </div>
      </div>
    </div>
  );
}
