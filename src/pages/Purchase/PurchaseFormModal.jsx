import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import { createPurchase, updatePurchase } from '../../services/PurchaseService';
import VendorDetailsSection from '../../components/purchase/VendorDetailsSection';
import NewVendorModal from '../../components/purchase/NewVendorModal';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import OtherInformationTab from '../../components/OtherInformationTab';
import CatalogModal from '../QuotationForm/CatalogModal';
import { Printer, UploadCloud, MessageSquare, StickyNote, Activity, Image as ImageIcon } from 'lucide-react';

export default function PurchaseFormModal({ isOpen, onClose, onSave, initialData, isConversion = false }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState('Portrait');
  const [purchaseStatus, setPurchaseStatus] = useState('Active');
  const [supplyStatus, setSupplyStatus] = useState('-');
  
  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) fetchItems(true);
  }, [isOpen, fetchItems]);

  const [headerInfo, setHeaderInfo] = useState({
    materialRcvdDate: '',
    billNo: '',
    vendorBillNo: '',
    billDate: ''
  });

  const [basicInfo, setBasicInfo] = useState({
    vendor: '',
    address: '',
    areaPinCode: '',
    cityState: '',
    state: '',
    email: '',
    mobile: '',
    validityDate: '',
    priceList: 'Standard',
    paymentTerms: 'Net 30'
  });

  const getEmptyItem = (type = 'item') => ({ id: Date.now() + Math.random(), type, itemCode: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, netAmount: 0 });
  const [items, setItems] = useState([getEmptyItem()]);

  const [otherInfo, setOtherInfo] = useState({
    internalNotes: ''
  });

  const [notes, setNotes] = useState({
    remarks: '',
    termsAndConditions: ''
  });

  const [summary, setSummary] = useState({
    grossAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    roundOffAmount: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.details && initialData.details.basicInfo) {
        setBasicInfo(initialData.details.basicInfo);
      } else if (initialData.vendorName) {
        setBasicInfo(prev => ({ ...prev, vendor: initialData.vendorName }));
      }
      if (initialData.details?.items) {
        setItems(initialData.details.items.map(item => ({...item, id: Date.now() + Math.random()})));
      }
      if (initialData.details?.otherInfo) {
        setOtherInfo(initialData.details.otherInfo);
      }
      if (initialData.details?.notes) {
        setNotes(initialData.details.notes);
      }
      if (initialData.details?.summary) {
        setSummary(initialData.details.summary);
      }
      if (initialData.billNo) setHeaderInfo(prev => ({...prev, billNo: initialData.billNo}));
      if (initialData.billDate) setHeaderInfo(prev => ({...prev, billDate: initialData.billDate}));

      setPurchaseStatus(initialData.status === 'Draft' ? 'Active' : initialData.status || 'Active');
      setSupplyStatus(initialData.supplyStatus || '-');
    } else {
        setBasicInfo({ vendor: '', address: '', areaPinCode: '', cityState: '', state: '', email: '', mobile: '', validityDate: '', priceList: 'Standard', paymentTerms: 'Net 30' });
        setItems([getEmptyItem()]);
        setOtherInfo({ internalNotes: '' });
        setNotes({ remarks: '', termsAndConditions: '' });
        setSummary({ grossAmount: 0, discountAmount: 0, taxAmount: 0, roundOffAmount: 0, totalAmount: 0 });
        setPurchaseStatus('Active');
        setSupplyStatus('-');
        setHeaderInfo({ materialRcvdDate: '', billNo: '', vendorBillNo: '', billDate: '' });
    }
  }, [initialData]);

  useEffect(() => {
    let gross = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const newItems = items.map(item => {
      if (item.type && item.type !== 'item') return { ...item, netAmount: 0 };
      const rowGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const rowDiscount = rowGross * ((Number(item.discountPercent) || 0) / 100);
      const afterDiscount = rowGross - rowDiscount;
      const rowTax = afterDiscount * ((Number(item.taxPercent) || 0) / 100);
      const net = afterDiscount + rowTax;
      
      gross += rowGross;
      totalDiscount += rowDiscount;
      totalTax += rowTax;

      return { ...item, netAmount: net };
    });

    const total = gross - totalDiscount + totalTax;
    const roundedTotal = Math.round(total);
    const roundOff = roundedTotal - total;

    setSummary(prev => ({
      ...prev,
      grossAmount: gross,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      roundOffAmount: roundOff,
      totalAmount: roundedTotal
    }));
  }, [items]);

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) return { ...item, [field]: value };
      return item;
    }));
  };

  const handleItemCodeSelect = (code, rowId) => {
    const item = inventoryItems.find(i => (i.ItemCode || i.code) === code);
    if (item) {
      setItems(prev => {
        const newItems = prev.map(p => p.id === rowId ? {
          ...p,
          itemCode: code,
          description: item.ItemName || item.name || '',
          unitPrice: Number(item.MRP || item.price || 0)
        } : p);
        if (prev[prev.length - 1].id === rowId) {
          newItems.push(getEmptyItem('item'));
        }
        return newItems;
      });
    }
  };

  const addItemLine = () => setItems(prev => [...prev, getEmptyItem('item')]);
  const addSection = () => setItems(prev => [...prev, getEmptyItem('section')]);
  const addSubSection = () => setItems(prev => [...prev, getEmptyItem('subsection')]);
  const removeItemLine = (id) => {
    if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCatalogSubmit = (cartItems) => {
    const newLines = cartItems.map(ci => ({
      ...getEmptyItem('item'),
      itemCode: ci.ItemCode || ci.code,
      description: ci.ItemName || ci.name || '',
      quantity: ci.selectedQty || 1,
      unitPrice: Number(ci.MRP || ci.price || 0)
    }));
    setItems(prev => {
      const filtered = prev.filter(i => i.itemCode !== '');
      return [...filtered, ...newLines, getEmptyItem('item')];
    });
    toast.success(`${cartItems.length} item(s) added from Catalog!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.vendor) {
      toast.error('Vendor name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        docNo: initialData && initialData.docNo ? initialData.docNo : `PR-${Math.floor(1000 + Math.random() * 9000)}`,
        docDate: initialData && initialData.docDate ? initialData.docDate : new Date().toISOString().split('T')[0],
        vendor: basicInfo.vendor,
        vendorName: basicInfo.vendor,
        state: basicInfo.state || '',
        mobile: basicInfo.mobile || '',
        referenceNumber: otherInfo.referenceNumber || '',
        referenceDate: otherInfo.expectedDeliveryDate || '',
        amount: summary.totalAmount,
        status: purchaseStatus,
        supplyStatus: supplyStatus,
        billNo: headerInfo.billNo,
        billDate: headerInfo.billDate,
        details: { headerInfo, basicInfo, items, otherInfo, notes, summary }
      };
      let saved;
      if (initialData && initialData.id && !isConversion) {
        saved = await updatePurchase(initialData.id, data);
      } else {
        saved = await createPurchase(data);
      }
      onSave(saved);
    } catch (error) {
      toast.error('Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={initialData && initialData.id && !isConversion ? "Edit Purchase" : (isConversion ? "New Purchase (From PO)" : "New Purchase")}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData && initialData.id && !isConversion ? 'Update Purchase' : 'Save Purchase')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        {/* Header Actions (Print Preview, Post) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-3 md:p-2 rounded-lg border border-slate-100 gap-3 md:gap-0">
          <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-4 items-center w-full md:w-auto">
            <button type="button" onClick={() => setIsPrintPreviewOpen(true)} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 w-full md:w-auto mb-2 md:mb-0"><Printer size={14} /> Print Preview</button>
            <div className="hidden md:block text-slate-300">|</div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 w-[45%] md:w-auto">
              <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase md:normal-case">Mat.Rcvd.Dt</span>
              <input type="date" value={headerInfo.materialRcvdDate} onChange={e => setHeaderInfo({...headerInfo, materialRcvdDate: e.target.value})} className="px-2 py-1.5 md:py-1 border border-slate-200 rounded text-xs outline-none w-full md:w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 w-[45%] md:w-auto">
              <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase md:normal-case">Bill #</span>
              <input type="text" value={headerInfo.billNo} onChange={e => setHeaderInfo({...headerInfo, billNo: e.target.value})} className="px-2 py-1.5 md:py-1 border border-slate-200 rounded text-xs outline-none w-full md:w-24" placeholder="Bill No" />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 w-[45%] md:w-auto">
              <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase md:normal-case">Vendor Bill #</span>
              <input type="text" value={headerInfo.vendorBillNo} onChange={e => setHeaderInfo({...headerInfo, vendorBillNo: e.target.value})} className="px-2 py-1.5 md:py-1 border border-slate-200 rounded text-xs outline-none w-full md:w-24" placeholder="Vendor Bill" />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 w-[45%] md:w-auto">
              <span className="text-[10px] md:text-xs font-bold text-slate-700 uppercase md:normal-case">Bill Date</span>
              <input type="date" value={headerInfo.billDate} onChange={e => setHeaderInfo({...headerInfo, billDate: e.target.value})} className="px-2 py-1.5 md:py-1 border border-slate-200 rounded text-xs outline-none w-full md:w-auto" />
            </div>
          </div>

        </div>

        <VendorDetailsSection 
          basicInfo={basicInfo} 
          setBasicInfo={setBasicInfo} 
          onOpenVendorModal={() => setIsVendorModalOpen(true)} 
        />

        <div className="min-h-[250px] py-4">
          <ItemLinesTable 
            items={items}
            inventoryItems={inventoryItems}
            handleItemChange={handleItemChange}
            handleItemCodeSelect={handleItemCodeSelect}
            removeItemLine={removeItemLine}
            addItemLine={addItemLine}
            addSection={addSection}
            addSubSection={addSubSection}
            setIsCatalogOpen={setIsCatalogOpen}
          />
          <SummaryCard 
            summary={summary} 
            onFinalAmountChange={(val) => setSummary(prev => ({ ...prev, finalAmount: val }))} 
          />
        </div>

        {/* Footer Actions */}
        <div className="flex gap-6 border-t border-slate-100 pt-4 mt-4">
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <MessageSquare size={16} /> Send Message
          </button>
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <StickyNote size={16} /> Log Note
          </button>
          <button type="button" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition">
            <Activity size={16} /> Activities
          </button>
        </div>
      </div>
    </ModalForm>
    <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} onSubmitCart={handleCatalogSubmit} />
    <NewVendorModal
      isOpen={isVendorModalOpen}
      onClose={() => setIsVendorModalOpen(false)}
      onSave={(vendor) => {
        setBasicInfo(prev => ({ ...prev, vendor: vendor.vendorName }));
        toast.success(`Vendor "${vendor.vendorName}" added!`);
      }}
    />

    {/* Print Preview Modal */}
    {isPrintPreviewOpen && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex flex-col p-4 md:p-6 overflow-hidden">
        <style>
          {`
            @media print {
              html, body {
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              
              /* Hide all elements that are NOT in the path to the print area and NOT inside it */
              body *:not(:has(#purchase-print-area)):not(#purchase-print-area):not(#purchase-print-area *) {
                display: none !important;
              }
              
              /* Reset the path from body to the print area so it flows naturally for pagination */
              body *:has(#purchase-print-area) {
                position: static !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                transform: none !important;
                background: none !important;
              }
              
              #purchase-print-area {
                position: static !important;
                height: auto !important;
                overflow: visible !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .fixed.inset-0 > div > div:first-child {
                display: none !important;
              }
              
              .break-after-page {
                page-break-after: always !important;
                break-after: page !important;
              }
              
              @page {
                size: ${printOrientation === 'Horizontal' ? 'landscape' : 'portrait'};
                margin: 15mm;
              }
            }
          `}
        </style>
        
        <div className={`w-full mx-auto flex flex-col flex-1 min-h-0 mt-10 shadow-2xl rounded-2xl ${
          printOrientation === 'Horizontal' ? 'max-w-4xl' : 'max-w-3xl'
        }`}>
          <div className="w-full bg-white rounded-t-2xl border border-slate-150 p-4 flex justify-between items-center z-50 flex-shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Print Preview</span>
              <select 
                value={printOrientation} 
                onChange={e => setPrintOrientation(e.target.value)}
                className="ml-4 text-xs border border-slate-200 rounded px-2 py-1 outline-none"
              >
                <option value="Portrait">Portrait</option>
                <option value="Horizontal">Landscape</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-4 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full overflow-y-auto min-h-0 rounded-b-2xl">
            <div id="purchase-print-area" className="bg-white p-8 border border-t-0 border-slate-150 text-slate-800 rounded-b-2xl w-full">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">PAREKH GALLERIUM</h1>
                  <p className="text-[10px] text-sky-700 font-bold tracking-widest uppercase mt-1">Premium Inventory Management System</p>
                  <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                    <p>VIP Road, Raipur, Chhattisgarh - 492001</p>
                    <p>Phone: +91 98765 43210</p>
                    <p>Email: contact@parekhgallerium.com</p>
                    <p className="font-bold text-slate-800 mt-1.5">GSTIN: 22AAAAA0000A1Z2</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-light text-slate-400 tracking-widest uppercase mb-4">Purchase</h2>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <p><span className="font-bold text-slate-900 w-28 inline-block">Bill No:</span> {headerInfo.billNo || '-'}</p>
                    <p><span className="font-bold text-slate-900 w-28 inline-block">Bill Date:</span> {headerInfo.billDate || '-'}</p>
                    <p><span className="font-bold text-slate-900 w-28 inline-block">Mat.Rcvd Date:</span> {headerInfo.materialRcvdDate || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-12 mb-10 text-xs">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3 uppercase tracking-widest text-[10px]">Vendor Details</h3>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-sm mb-2">{basicInfo.vendor || 'N/A'}</p>
                    {basicInfo.address && <p className="text-slate-700">{basicInfo.address}</p>}
                    {basicInfo.mobile && <p className="text-slate-700"><span className="font-semibold text-slate-500">Ph:</span> {basicInfo.mobile}</p>}
                    {basicInfo.email && <p className="text-slate-700"><span className="font-semibold text-slate-500">Email:</span> {basicInfo.email}</p>}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3 uppercase tracking-widest text-[10px]">Purchase Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Payment Terms:</span> 
                      <span className="font-bold text-slate-800">{basicInfo.paymentTerms || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-widest text-[9px]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <th className="py-2 px-1 text-center w-8">SN</th>
                      <th className="py-2 px-1 text-center w-12">Image</th>
                      <th className="py-2 px-1 text-left w-[40%]">Product Details</th>
                      <th className="py-2 px-1 text-center w-12">Qty</th>
                      <th className="py-2 px-1 text-right w-24">Unit Price</th>
                      <th className="py-2 px-1 text-center w-16">Disc %</th>
                      <th className="py-2 px-1 text-center w-16">Tax %</th>
                      <th className="py-2 px-1 text-right w-28">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.itemCode || i.description).map((item, idx) => {
                      const rowGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                      const rowDiscount = rowGross * ((Number(item.discountPercent) || 0) / 100);
                      const afterDiscount = rowGross - rowDiscount;
                      const rowTax = afterDiscount * ((Number(item.taxPercent) || 0) / 100);
                      const netAmt = item.netAmount || (afterDiscount + rowTax);
                      
                      const matchedInventoryItem = inventoryItems?.find(inv => (inv.ItemCode || inv.code) === item.itemCode);
                      const imageUrl = item.thumbnail || item.image || (matchedInventoryItem ? (matchedInventoryItem.Thumbnail || matchedInventoryItem.product_image_url) : '');

                      return (
                        <tr key={idx} className="border-b border-slate-200 bg-white">
                          <td className="py-2 px-1 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-1 text-center">
                            {imageUrl ? (
                              <img src={imageUrl} alt="product" className="w-10 h-10 object-cover mx-auto rounded border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto rounded">
                                 <ImageIcon size={14} />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-1 text-left">
                            <div className="font-bold text-slate-800">{item.itemCode || '-'}</div>
                            <div className="text-slate-600 capitalize mt-0.5 leading-snug text-justify pr-2">{item.description || '-'}</div>
                          </td>
                          <td className="py-2 px-1 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2 px-1 text-right text-slate-700">₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-center text-slate-500">{item.discountPercent || 0}%</td>
                          <td className="py-2 px-1 text-center text-slate-500">{item.taxPercent || 0}%</td>
                          <td className="py-2 px-1 text-right font-black text-slate-900">₹{Number(netAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-12 text-xs mb-16">
                <div className="flex-1 space-y-6">
                  {notes.termsAndConditions && (
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[9px] mb-2">Terms & Conditions</h4>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">{notes.termsAndConditions}</p>
                    </div>
                  )}
                </div>

                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Amount:</span>
                    <span className="font-medium">₹{Number(summary.grossAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Amount:</span>
                    <span className="font-medium">- ₹{Number(summary.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax Amount:</span>
                    <span className="font-medium">+ ₹{Number(summary.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-3">
                    <span>Round Off:</span>
                    <span className="font-medium">{summary.roundOffAmount >= 0 ? '+' : '-'} ₹{Math.abs(summary.roundOffAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-base pt-1">
                    <span>Grand Total:</span>
                    <span>₹{Number(summary.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
