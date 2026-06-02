import React from 'react';
import { X, Mail, Printer, Trash2, CornerUpLeft } from 'lucide-react';

export default function SalesHeader({
  title,
  docNumber,
  docDate,
  onDiscard,
  onDelete,
  onCreateReturn,
  showCreateReturn = false,
  printOrientation = 'Horizontal',
  setPrintOrientation,
  onPrintPreview,
  onSendEmail
}) {
  return (
    <div className="bg-white border-b border-slate-200 p-2 sm:p-4 mb-4">
      {/* Top Line */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <button 
          type="button" 
          onClick={onDiscard} 
          className="text-rose-500 hover:bg-rose-50 border border-rose-200 px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1"
        >
          <X size={14} /> Discard
        </button>
      </div>

      {/* Action Line */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center text-xs font-semibold text-slate-600">
          <button type="button" onClick={onSendEmail} className="hover:text-sky-600 transition flex items-center gap-1">
            <Mail size={14} /> Send by Email
          </button>
          <button type="button" onClick={onPrintPreview} className="hover:text-sky-600 transition flex items-center gap-1">
            <Printer size={14} /> Print Preview
          </button>
          <select 
            value={printOrientation} 
            onChange={(e) => setPrintOrientation && setPrintOrientation(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="Horizontal">Horizontal</option>
            <option value="Vertical">Vertical</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {showCreateReturn && (
            <button 
              type="button" 
              onClick={onCreateReturn}
              className="text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-slate-100 transition"
            >
              <CornerUpLeft size={14} /> Create Sales Return
            </button>
          )}
          {onDelete && (
            <button 
              type="button" 
              onClick={onDelete}
              className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Number and Date Line */}
      <div className="flex justify-between items-center">
        <div className="text-3xl font-black text-slate-900">
          {docNumber}
        </div>
        <div className="text-lg font-bold text-slate-800">
          {docDate}
        </div>
      </div>
    </div>
  );
}
