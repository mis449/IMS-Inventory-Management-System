import React from 'react';
import { Plus, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import SearchableDropdown from '../SearchableDropdown';

export default function ItemLinesTable({
  items,
  inventoryItems,
  handleItemChange,
  handleItemCodeSelect,
  removeItemLine,
  addItemLine,
  addSection,
  addSubSection,
  setIsCatalogOpen,
  showStatus = false,
  showUploadAndRemark = false
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
         <button type="button" onClick={addItemLine} className="text-xs font-bold bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sky-100"><Plus size={14}/> Add Item Line</button>
         <button type="button" onClick={addSection} className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-100 border border-slate-200"><Plus size={14}/> Add Section</button>
         <button type="button" onClick={addSubSection} className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-100 border border-slate-200"><Plus size={14}/> Add Sub-Section</button>
         <button type="button" onClick={() => setIsCatalogOpen(true)} className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-100 border border-slate-200 shadow-sm"><FileText size={14}/> Catalog</button>
      </div>

      {/* Header */}
      <div className={`hidden md:grid gap-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-50 py-2 rounded-lg ${showStatus ? 'grid-cols-[repeat(15,minmax(0,1fr))]' : showUploadAndRemark ? 'grid-cols-[repeat(15,minmax(0,1fr))]' : 'grid-cols-[repeat(13,minmax(0,1fr))]'}`}>
        <div className="col-span-2 text-left">Item Code</div>
        <div className="col-span-1 text-center">Image</div>
        {showStatus ? (
          <>
            <div className="col-span-2 text-left">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-1">Act Disp</div>
            <div className="col-span-1">Rem Qty</div>
            <div className="col-span-1">Unit Price</div>
            <div className="col-span-1">Disc %</div>
            <div className="col-span-1">Tax %</div>
            <div className="col-span-1 text-right">Net Amt</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1">Action</div>
          </>
        ) : showUploadAndRemark ? (
          <>
            <div className="col-span-2 text-left">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-1">Unit Price</div>
            <div className="col-span-1">Disc %</div>
            <div className="col-span-1">Tax %</div>
            <div className="col-span-1 text-right">Net Amt</div>
            <div className="col-span-2 text-center">Remark</div>
            <div className="col-span-2 text-center">Upload Image</div>
            <div className="col-span-1">Action</div>
          </>
        ) : (
          <>
            <div className="col-span-3 text-left">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-1">Disc %</div>
            <div className="col-span-1">Tax %</div>
            <div className="col-span-1 text-right">Net Amt</div>
            <div className="col-span-1">Action</div>
          </>
        )}
      </div>

      {items.map((item, index) => {
        if (item.type === 'section' || item.type === 'subsection') {
          const isSub = item.type === 'subsection';
          return (
            <div key={item.id} className={`flex items-center gap-2 p-2 md:px-2 md:py-3 rounded-xl md:rounded-none md:border-b shadow-sm md:shadow-none bg-white border border-slate-100 ${isSub ? 'ml-4 border-l-2 border-l-slate-300' : 'border-l-4 border-l-sky-500 bg-sky-50/40'}`}>
              <div className="flex-1 pl-2">
                <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className={`w-full bg-transparent outline-none font-bold placeholder-slate-400 ${isSub ? 'text-slate-600 text-xs' : 'text-sky-800 text-sm'}`} placeholder={isSub ? "Enter Sub-Section Title..." : "Enter Section Title..."} />
              </div>
              <button type="button" onClick={() => removeItemLine(item.id)} className="p-1.5 text-red-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          );
        }

        const rowGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        const rowDiscount = rowGross * ((Number(item.discountPercent) || 0) / 100);
        const afterDiscount = rowGross - rowDiscount;
        const rowTax = afterDiscount * ((Number(item.taxPercent) || 0) / 100);
        const net = afterDiscount + rowTax;

        const isCompleted = Number(item.dispatchedQty || 0) >= Number(item.quantity || 0) && Number(item.quantity || 0) > 0;
        const ordered = Number(item.quantity || 0);
        const dispatched = Number(item.dispatchedQty || 0);
        const remaining = Math.max(0, ordered - dispatched);

        const matchedInventoryItem = inventoryItems?.find(i => (i.ItemCode || i.code) === item.itemCode);
        const imageUrl = item.thumbnail || (matchedInventoryItem ? (matchedInventoryItem.Thumbnail || matchedInventoryItem.product_image_url) : '');

        return (
          <div key={item.id} className={`grid gap-3 md:gap-2 items-center bg-white border border-slate-100 md:border-b p-4 md:p-2 rounded-xl md:rounded-none shadow-sm md:shadow-none grid-cols-2 ${showStatus ? 'md:grid-cols-[repeat(15,minmax(0,1fr))]' : showUploadAndRemark ? 'md:grid-cols-[repeat(15,minmax(0,1fr))]' : 'md:grid-cols-[repeat(13,minmax(0,1fr))]'}`}>
            <div className="col-span-2 md:col-span-2 space-y-1">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Item Code</div>
              <SearchableDropdown
                options={inventoryItems.map(i => ({ value: i.ItemCode || i.code, label: `${i.ItemCode || i.code} - ${i.ItemName || i.name}` }))}
                value={item.itemCode}
                onChange={(val) => handleItemCodeSelect(val, item.id)}
                renderSelected={(opt) => opt.value}
                placeholder="Search Code"
                className="w-full"
                height="h-[30px]"
                rounded="rounded"
              />
            </div>

            <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center space-y-1">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase w-full text-center">Image</div>
              {imageUrl ? (
                <img src={imageUrl} alt="product" className="w-12 h-12 rounded object-cover border border-slate-200 bg-slate-50" />
              ) : (
                <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>

            <div className={`col-span-2 ${showStatus ? 'md:col-span-2' : showUploadAndRemark ? 'md:col-span-2' : 'md:col-span-3'} space-y-1`}>
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Description</div>
              <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full border border-slate-200 text-xs px-2 py-1.5 rounded outline-none" placeholder="Description" />
            </div>
            
            <div className="col-span-1 md:col-span-1 space-y-1 text-center md:text-center">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Qty</div>
              <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full border border-sky-200 text-sky-700 font-bold text-xs px-2 py-1.5 rounded outline-none text-center" />
            </div>

            {/* Act Disp and Rem Qty Columns */}
            {showStatus && (
              <>
                <div className="col-span-1 md:col-span-1 space-y-1 text-center md:text-center">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Act Disp</div>
                  <div className="w-full bg-slate-50 border border-slate-200 text-xs px-1 py-1 rounded text-center text-sky-700 font-bold select-none">{dispatched}</div>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-1 text-center md:text-center">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Rem Qty</div>
                  <div className="w-full bg-slate-50 border border-slate-200 text-xs px-1 py-1 rounded text-center text-amber-600 font-bold select-none">{remaining}</div>
                </div>
              </>
            )}

            <div className={`col-span-1 ${showStatus ? 'md:col-span-1' : showUploadAndRemark ? 'md:col-span-1' : 'md:col-span-2'} space-y-1 text-center md:text-center`}>
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Unit Price</div>
              <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} className="w-full border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-center" />
            </div>
            <div className="col-span-1 md:col-span-1 space-y-1 text-center md:text-center">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Disc %</div>
              <input type="number" value={item.discountPercent} onChange={(e) => handleItemChange(item.id, 'discountPercent', e.target.value)} className="w-full border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-center" />
            </div>
            <div className="col-span-1 md:col-span-1 space-y-1 text-center md:text-center">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Tax %</div>
              <input type="number" value={item.taxPercent} onChange={(e) => handleItemChange(item.id, 'taxPercent', e.target.value)} className="w-full border border-slate-200 text-xs px-2 py-1.5 rounded outline-none text-center" />
            </div>
            <div className="col-span-1 md:col-span-1 text-left md:text-right font-bold text-emerald-600 text-xs md:pr-2 pt-1 md:pt-0">
              <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Net Amount</div>
              ₹{net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            
            {showUploadAndRemark && (
              <>
                <div className="col-span-2 md:col-span-2 space-y-1 text-center md:text-center">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Remark</div>
                  <input type="text" value={item.remark || ''} onChange={(e) => handleItemChange(item.id, 'remark', e.target.value)} className="w-full border border-slate-200 text-xs px-2 py-1.5 rounded outline-none h-[30px]" placeholder="Remark" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1 text-center md:text-center">
                  <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Upload Image</div>
                  <label className="flex items-center justify-center cursor-pointer w-full border border-slate-200 text-[10px] px-2 rounded outline-none h-[30px] bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors">
                    <span className="truncate">{item.image ? item.image.name : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleItemChange(item.id, 'image', e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </>
            )}
            
            {/* Status Column */}
            {showStatus && (
              <div className="col-span-1 md:col-span-2 space-y-1 text-left md:text-center flex flex-col items-start md:items-center justify-center pt-1 md:pt-0">
                <div className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Status</div>
                {isCompleted ? (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-black bg-emerald-100 text-emerald-700 border border-emerald-250">
                    Completed
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-black bg-amber-100 text-amber-700 border border-amber-250">
                    Pending
                  </span>
                )}
              </div>
            )}

            <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-0 border-t border-slate-100 md:border-0 mt-2 md:mt-0">
              <button type="button" onClick={() => removeItemLine(item.id)} disabled={items.length === 1} className="p-1.5 text-red-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors disabled:opacity-30">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
