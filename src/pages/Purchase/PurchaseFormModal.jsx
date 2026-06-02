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
import { Printer, UploadCloud, MessageSquare, StickyNote, Activity } from 'lucide-react';

export default function PurchaseFormModal({ isOpen, onClose, onSave, initialData }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
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
      if (initialData.vendorName || (initialData.details && initialData.details.basicInfo)) {
        setBasicInfo(prev => ({ ...prev, vendor: initialData.vendorName || initialData.details.basicInfo.vendor }));
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
        setBasicInfo({ vendor: '', address: '', validityDate: '', priceList: 'Standard', paymentTerms: 'Net 30' });
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

    setSummary({
      grossAmount: gross,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      roundOffAmount: roundOff,
      totalAmount: roundedTotal
    });
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
        amount: summary.totalAmount,
        status: purchaseStatus,
        supplyStatus: supplyStatus,
        billNo: headerInfo.billNo,
        billDate: headerInfo.billDate,
        details: { basicInfo, items, otherInfo, notes, summary }
      };
      let saved;
      if (initialData && initialData.id) {
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
      title={initialData && initialData.id ? "Edit Purchase" : (initialData ? "New Purchase (From PO)" : "New Purchase")}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData && initialData.id ? 'Update Purchase' : 'Save Purchase')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        {/* Header Actions (Print Preview, Post) */}
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex gap-4 items-center">
            <button type="button" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"><Printer size={14} /> Print Preview</button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">Mat.Rcvd.Dt</span>
            <input type="date" value={headerInfo.materialRcvdDate} onChange={e => setHeaderInfo({...headerInfo, materialRcvdDate: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none" />
            <span className="text-xs font-bold text-slate-700">Bill #</span>
            <input type="text" value={headerInfo.billNo} onChange={e => setHeaderInfo({...headerInfo, billNo: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none w-24" placeholder="Bill No" />
            <span className="text-xs font-bold text-slate-700">Vendor Bill #</span>
            <input type="text" value={headerInfo.vendorBillNo} onChange={e => setHeaderInfo({...headerInfo, vendorBillNo: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none w-24" placeholder="Vendor Bill" />
            <span className="text-xs font-bold text-slate-700">Bill Date</span>
            <input type="date" value={headerInfo.billDate} onChange={e => setHeaderInfo({...headerInfo, billDate: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none" />
          </div>
          <button type="button" className="text-xs font-bold bg-white text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-teal-50 transition shadow-sm">
            <UploadCloud size={14} /> Post In Account
          </button>
        </div>

        <VendorDetailsSection 
          basicInfo={basicInfo} 
          setBasicInfo={setBasicInfo} 
          onOpenVendorModal={() => setIsVendorModalOpen(true)} 
        />

        <SalesTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="min-h-[250px] py-4">
          {activeTab === 'ItemLines' && (
            <>
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
              <SummaryCard summary={summary} />
            </>
          )}

          {activeTab === 'OtherInfo' && (
            <OtherInformationTab 
              otherInfo={otherInfo} setOtherInfo={setOtherInfo} 
              quotationStatus={purchaseStatus} setQuotationStatus={setPurchaseStatus}
              supplyStatus={supplyStatus} setSupplyStatus={setSupplyStatus}
            />
          )}

          {activeTab === 'Notes' && (
            <div className="space-y-5 px-2">
               <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Remarks</label>
                  <textarea rows="2" value={notes.remarks} onChange={(e) => setNotes({...notes, remarks: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm bg-white outline-none"></textarea>
               </div>
               <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Terms & Conditions</label>
                  <textarea rows="3" value={notes.termsAndConditions} onChange={(e) => setNotes({...notes, termsAndConditions: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-xs md:text-sm bg-white outline-none"></textarea>
               </div>
            </div>
          )}
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
    </>
  );
}
