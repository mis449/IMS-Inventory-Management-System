import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import { createPurchaseOrder, updatePurchaseOrder } from '../../services/PurchaseOrderService';
import VendorDetailsSection from '../../components/purchase/VendorDetailsSection';
import NewVendorModal from '../../components/purchase/NewVendorModal';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import OtherInformationTab from '../../components/OtherInformationTab';
import CatalogModal from '../QuotationForm/CatalogModal';

export default function PurchaseOrderFormModal({ isOpen, onClose, onSave, initialData }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState('Active');
  const [supplyStatus, setSupplyStatus] = useState('-');
  
  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) {
      fetchItems(true);
      if (initialData && initialData.details) {
        setBasicInfo(initialData.details.basicInfo || { vendor: '', address: '', areaPinCode: '', cityState: '', email: '', mobile: '', validityDate: '', priceList: 'Standard', paymentTerms: 'Net 30' });
        setItems(initialData.details.items || [getEmptyItem()]);
        setOtherInfo(initialData.details.otherInfo || { buyer: '', referenceNumber: '', expectedDeliveryDate: '', internalNotes: '' });
        setNotes(initialData.details.notes || { remarks: '', termsAndConditions: '', additionalNotes: '' });
        setSummary(initialData.details.summary || { grossAmount: 0, discountAmount: 0, taxAmount: 0, roundOffAmount: 0, totalAmount: 0 });
        setPurchaseStatus(initialData.status === 'Draft' ? 'Active' : initialData.status || 'Active');
        setSupplyStatus(initialData.supplyStatus || '-');
      } else {
        setBasicInfo({ vendor: '', address: '', areaPinCode: '', cityState: '', email: '', mobile: '', validityDate: '', priceList: 'Standard', paymentTerms: 'Net 30' });
        setItems([getEmptyItem()]);
        setOtherInfo({ buyer: '', referenceNumber: '', expectedDeliveryDate: '', internalNotes: '' });
        setNotes({ remarks: '', termsAndConditions: '', additionalNotes: '' });
        setSummary({ grossAmount: 0, discountAmount: 0, taxAmount: 0, roundOffAmount: 0, totalAmount: 0 });
        setPurchaseStatus('Active');
        setSupplyStatus('-');
      }
    }
  }, [isOpen, fetchItems, initialData]);

  const [basicInfo, setBasicInfo] = useState({
    vendor: '',
    address: '',
    areaPinCode: '',
    cityState: '',
    email: '',
    mobile: '',
    validityDate: '',
    priceList: 'Standard',
    paymentTerms: 'Net 30'
  });

  const getEmptyItem = (type = 'item') => ({ id: Date.now() + Math.random(), type, itemCode: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, netAmount: 0 });
  const [items, setItems] = useState([getEmptyItem()]);

  const [otherInfo, setOtherInfo] = useState({
    buyer: '',
    referenceNumber: '',
    expectedDeliveryDate: '',
    internalNotes: ''
  });

  const [notes, setNotes] = useState({
    remarks: '',
    termsAndConditions: '',
    additionalNotes: ''
  });

  const [summary, setSummary] = useState({
    grossAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    roundOffAmount: 0,
    totalAmount: 0
  });

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
      if (item.id === id) {
        return { ...item, [field]: value };
      }
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
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
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
        docNo: initialData ? initialData.docNo : `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        docDate: initialData ? initialData.docDate : new Date().toISOString().split('T')[0],
        vendor: basicInfo.vendor,
        vendorName: basicInfo.vendor,
        state: basicInfo.state || '',
        mobile: basicInfo.mobile || '',
        referenceNumber: otherInfo.referenceNumber || '',
        referenceDate: otherInfo.expectedDeliveryDate || '',
        amount: summary.totalAmount,
        status: purchaseStatus,
        supplyStatus: supplyStatus,
        details: { basicInfo, items, otherInfo, notes, summary }
      };

      let saved;
      if (initialData && initialData.id) {
        saved = await updatePurchaseOrder(initialData.id, data);
      } else {
        saved = await createPurchaseOrder(data);
      }
      onSave(saved);
    } catch (error) {
      toast.error('Failed to save purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Purchase Order" : "Purchase Order Form"}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData ? 'Update Purchase Order' : 'Save Purchase Order')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        <VendorDetailsSection 
          basicInfo={basicInfo} 
          setBasicInfo={setBasicInfo} 
          onOpenVendorModal={() => setIsVendorModalOpen(true)} 
          onVendorSelect={(vendor) => {
            setBasicInfo(prev => ({
              ...prev,
              vendor: vendor.name || vendor.vendorName,
              address: vendor.address || prev.address,
              areaPinCode: vendor.areaPinCode || prev.areaPinCode,
              cityState: vendor.cityState || prev.cityState,
              state: vendor.state || vendor.cityState || prev.state,
              email: vendor.email || prev.email,
              mobile: vendor.mobile || prev.mobile,
              priceList: vendor.priceList || prev.priceList
            }));
          }}
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
