import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import { createPurchaseReturn, updatePurchaseReturn } from '../../services/PurchaseReturnService';
import VendorDetailsSection from '../../components/purchase/VendorDetailsSection';
import NewVendorModal from '../../components/purchase/NewVendorModal';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import OtherInformationTab from '../../components/OtherInformationTab';
import CatalogModal from '../QuotationForm/CatalogModal';
import { MessageSquare, StickyNote, Activity } from 'lucide-react';

export default function PurchaseReturnFormModal({ isOpen, onClose, onSave, initialData, isConversion = false }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  
  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) fetchItems(true);
  }, [isOpen, fetchItems]);

  const [headerInfo, setHeaderInfo] = useState({
    returnDate: ''
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
      } else if (initialData.vendorName || initialData.vendor) {
        setBasicInfo(prev => ({ ...prev, vendor: initialData.vendorName || initialData.vendor }));
      }
      if (initialData.details?.items) {
        setItems(initialData.details.items.map(item => ({...item, id: Date.now() + Math.random()})));
      }
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
        returnNo: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        vendor: basicInfo.vendor,
        vendorName: basicInfo.vendor,
        state: basicInfo.state || '',
        mobile: basicInfo.mobile || '',
        amount: summary.totalAmount,
        status: 'Active',
        refPurchase: initialData?.docNo || '-',
        details: { basicInfo, items, otherInfo, notes, summary }
      };
      let saved;
      if (initialData && initialData.id && !isConversion) {
        saved = await updatePurchaseReturn(initialData.id, data);
      } else {
        saved = await createPurchaseReturn(data);
      }
      onSave(saved);
    } catch (error) {
      toast.error('Failed to save purchase return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={initialData && initialData.id && !isConversion ? "Edit Purchase Return" : (isConversion ? "New Purchase Return (From Purchase)" : "New Purchase Return")}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData && initialData.id && !isConversion ? 'Update Purchase Return' : 'Save Purchase Return')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-slate-700">Return Date</span>
            <input type="date" value={headerInfo.returnDate} onChange={e => setHeaderInfo({...headerInfo, returnDate: e.target.value})} className="px-2 py-1 border border-slate-200 rounded text-xs outline-none" />
          </div>
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
            <OtherInformationTab otherInfo={otherInfo} setOtherInfo={setOtherInfo} />
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
