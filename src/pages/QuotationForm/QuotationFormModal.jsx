import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PackageSearch, Users, Copy, Trash2, X, Undo2, Image as ImageIcon } from 'lucide-react';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import { createQuotation, updateQuotation } from '../../services/quotationService';
import NewCustomerModal from './NewCustomerModal';
import CatalogModal from './CatalogModal';
import OtherInformationTab from '../../components/OtherInformationTab';
import CustomerDetailsSection from '../../components/sales/CustomerDetailsSection';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import DispatchFormModal from '../Sales/DispatchFormModal';
import { ShoppingCart } from 'lucide-react';
import PremiumQuotationPrint from '../../components/sales/PremiumQuotationPrint';

export default function QuotationFormModal({ isOpen, onClose, onSave, initialData, onConvertToInvoice, onDelete, onCopy }) {
  const [activeTab, setActiveTab] = useState('ItemLines'); // 'ItemLines', 'OtherInfo', 'Notes'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [quotationStatus, setQuotationStatus] = useState('Active');
  const [supplyStatus, setSupplyStatus] = useState('-');
  
  const [printOrientation, setPrintOrientation] = useState('Horizontal');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  
  const { items: inventoryItems, fetchItems, addCustomer } = useDataStore();

  useEffect(() => {
    if (isOpen) {
      fetchItems(true);
      if (initialData && initialData.details) {
        setBasicInfo({
          customer: '',
          address: '',
          validityDate: '',
          priceList: 'Standard',
          paymentTerms: 'Net 30',
          areaPinCode: '',
          cityState: '',
          email: '',
          mobile: '',
          ...(initialData.details.basicInfo || {})
        });
        setItems(initialData.details.items || [getEmptyItem()]);
        setOtherInfo(initialData.details.otherInfo || {
          salesPerson: '',
          referenceNumber: '',
          customerReference: '',
          expectedDeliveryDate: '',
          internalNotes: ''
        });
        setNotes(initialData.details.notes || {
          remarks: '',
          termsAndConditions: '',
          additionalNotes: ''
        });
        setSummary(initialData.details.summary || {
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          roundOffAmount: 0,
          totalAmount: 0
        });
        setQuotationStatus(initialData.status === 'Draft' ? 'Active' : initialData.status || 'Active');
        setSupplyStatus(initialData.supplyStatus || '-');
      } else {
        setBasicInfo({
          customer: '',
          address: '',
          validityDate: '',
          priceList: 'Standard',
          paymentTerms: 'Net 30',
          areaPinCode: '',
          cityState: '',
          email: '',
          mobile: ''
        });
        setItems([getEmptyItem()]);
        setOtherInfo({
          salesPerson: '',
          referenceNumber: '',
          customerReference: '',
          expectedDeliveryDate: '',
          internalNotes: ''
        });
        setNotes({
          remarks: '',
          termsAndConditions: '',
          additionalNotes: ''
        });
        setSummary({
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          roundOffAmount: 0,
          totalAmount: 0
        });
        setQuotationStatus('Active');
        setSupplyStatus('-');
      }
    }
  }, [isOpen, fetchItems, initialData]);

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    customer: '',
    address: '',
    validityDate: '',
    priceList: 'Standard',
    paymentTerms: 'Net 30',
    areaPinCode: '',
    cityState: '',
    email: '',
    mobile: ''
  });

  // Item Lines State
  const getEmptyItem = (type = 'item') => ({ id: Date.now() + Math.random(), type, itemCode: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, netAmount: 0 });
  const [items, setItems] = useState([getEmptyItem()]);

  // Other Info State
  const [otherInfo, setOtherInfo] = useState({
    salesPerson: '',
    referenceNumber: '',
    customerReference: '',
    expectedDeliveryDate: '',
    internalNotes: '',
    mobile: '',
    state: ''
  });

  // Notes State
  const [notes, setNotes] = useState({
    remarks: '',
    termsAndConditions: '',
    additionalNotes: ''
  });

  // Summary State
  const [summary, setSummary] = useState({
    grossAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    roundOffAmount: 0,
    totalAmount: 0
  });

  // Calculate Net Amount for each row and Overall Summary
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
        
        // Auto-add new row if the modified row is the last one
        if (prev[prev.length - 1].id === rowId) {
          newItems.push(getEmptyItem('item'));
        }
        return newItems;
      });
    }
  };

  const handleCatalogSubmit = (cartItems) => {
    if (cartItems.length === 0) return;
    
    setItems(prev => {
      let newItems = [...prev];
      let insertIndex = newItems.findIndex(i => i.type === 'item' && !i.itemCode);
      
      cartItems.forEach(cartItem => {
        const newItem = {
          id: Date.now() + Math.random(),
          type: 'item',
          itemCode: cartItem.ItemCode || cartItem.code,
          description: cartItem.ItemName || cartItem.name || '',
          quantity: cartItem.selectedQty,
          unitPrice: Number(cartItem.MRP || cartItem.price || 0),
          discountPercent: 0,
          taxPercent: 0,
          netAmount: 0
        };

        if (insertIndex !== -1) {
          newItems[insertIndex] = newItem;
          insertIndex = -1;
        } else {
          newItems.push(newItem);
        }
      });
      
      newItems.push(getEmptyItem('item'));
      return newItems;
    });
  };

  const addItemLine = () => setItems(prev => [...prev, getEmptyItem('item')]);
  const addSection = () => setItems(prev => [...prev, getEmptyItem('section')]);
  const addSubSection = () => setItems(prev => [...prev, getEmptyItem('subsection')]);
  const removeItemLine = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.customer) {
      toast.error('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const quotationData = {
        quotationNo: initialData ? initialData.quotationNo : `QT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: initialData ? initialData.date : new Date().toISOString().split('T')[0],
        customerName: basicInfo.customer,
        mobileNumber: basicInfo.mobile || otherInfo.mobile || '-',
        state: basicInfo.cityState ? (basicInfo.cityState.includes('/') ? basicInfo.cityState.split('/')[1]?.trim() : basicInfo.cityState) : (otherInfo.state || '-'),
        salesPerson: otherInfo.salesPerson || 'Admin',
        totalAmount: summary.totalAmount,
        status: quotationStatus,
        supplyStatus: supplyStatus,
        details: { basicInfo, items, otherInfo, notes, summary }
      };

      let saved;
      if (initialData && initialData.id) {
        saved = await updateQuotation(initialData.id, quotationData);
      } else {
        saved = await createQuotation(quotationData);
      }
      onSave(saved);
    } catch (error) {
      toast.error('Failed to save quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusUpdate = async (newStatus) => {
    if (!basicInfo.customer) {
      toast.error('Customer name is required before accepting/rejecting.');
      return;
    }

    setQuotationStatus(newStatus);
    setIsSubmitting(true);
    try {
      const quotationData = {
        quotationNo: initialData ? initialData.quotationNo : `QT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: initialData ? initialData.date : new Date().toISOString().split('T')[0],
        customerName: basicInfo.customer,
        mobileNumber: basicInfo.mobile || otherInfo.mobile || '-',
        state: basicInfo.cityState ? (basicInfo.cityState.includes('/') ? basicInfo.cityState.split('/')[1]?.trim() : basicInfo.cityState) : (otherInfo.state || '-'),
        salesPerson: otherInfo.salesPerson || 'Admin',
        totalAmount: summary.totalAmount,
        status: newStatus,
        supplyStatus: supplyStatus,
        details: { basicInfo, items, otherInfo, notes, summary }
      };

      let saved;
      if (initialData && initialData.id) {
        saved = await updateQuotation(initialData.id, quotationData);
      } else {
        saved = await createQuotation(quotationData);
      }
      
      toast.success(`Quotation marked as ${newStatus}`);
      
      if (newStatus === 'Accepted') {
        onSave(saved, false); // Pass false to prevent closing
      } else {
        onSave(saved, true);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!basicInfo.customer) {
      toast.error("Nothing to copy yet.");
      return;
    }
    const copyData = {
      quotationNo: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerName: basicInfo.customer,
      mobileNumber: basicInfo.mobile || otherInfo.mobile || '-',
      state: basicInfo.cityState ? (basicInfo.cityState.includes('/') ? basicInfo.cityState.split('/')[1]?.trim() : basicInfo.cityState) : (otherInfo.state || '-'),
      salesPerson: otherInfo.salesPerson || 'Admin',
      totalAmount: summary.totalAmount,
      status: 'Draft',
      supplyStatus: '-',
      details: { basicInfo, items, otherInfo, notes, summary }
    };
    if (onCopy) onCopy(copyData);
  };

  const handleDelete = () => {
    if (!initialData || !initialData.id) {
      toast.error("Cannot delete an unsaved quotation.");
      return;
    }
    if (onDelete) onDelete(initialData.id);
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Quotation" : "Quotation Form"}
      onSubmit={handleSubmit}
      submitText={isSubmitting ? 'Saving...' : (initialData ? 'Update Quotation' : 'Save Quotation')}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 gap-2">
          <div className="flex gap-4 items-center flex-wrap">
            <button 
              type="button" 
              onClick={() => {
                setEmailForm({
                  to: basicInfo.email || '',
                  subject: `Quotation details - ${initialData?.quotationNo || 'Draft'}`,
                  body: `Dear Customer,\n\nPlease find the summary of your quotation below:\n\nQuotation No: ${initialData?.quotationNo || 'Draft'}\nTotal Amount: ₹${summary.totalAmount}\nValidity Date: ${basicInfo.validityDate || '-'}\nPayment Terms: ${basicInfo.paymentTerms || '-'}\n\nBest regards,\nParekh Gallerium Team`
                });
                setIsEmailModalOpen(true);
              }}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Send by Email
            </button>
            <button 
              type="button" 
              onClick={() => setIsPrintPreviewOpen(true)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Print Preview
            </button>
            <select 
              value={printOrientation}
              onChange={(e) => setPrintOrientation(e.target.value)}
              className="text-[11px] font-bold text-slate-600 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="Horizontal">Horizontal</option>
              <option value="Vertical">Vertical</option>
            </select>
            <button type="button" className="text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-slate-50 shadow-sm">
              Check Stock
            </button>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {(quotationStatus === 'Active') && (
              <>
                <button type="button" className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                   Accept Payment ₹
                </button>
                <div className="flex gap-1 flex-wrap">
                  <button 
                    type="button" 
                    onClick={() => handleQuickStatusUpdate('Accepted')}
                    className="text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-emerald-50 shadow-sm"
                  >
                    Accept ✓
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickStatusUpdate('Rejected')}
                    className="text-[11px] font-bold bg-white text-rose-700 border border-rose-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-rose-50 shadow-sm"
                  >
                    Reject ✗
                  </button>
                </div>
              </>
            )}
            
            {(quotationStatus === 'Accepted' || quotationStatus === 'In Progress') && (
              <div className="flex gap-1 items-center">
                <button 
                  type="button" 
                  onClick={() => setIsDispatchModalOpen(true)}
                  className="text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded flex items-center gap-1 hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Dispatch Material <ShoppingCart size={13} />
                </button>
                <button 
                  type="button" 
                  onClick={() => handleQuickStatusUpdate('Active')}
                  className="text-[11px] font-bold bg-white text-amber-700 border border-amber-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-50 shadow-sm transition-colors"
                  title="Undo Accept - Revert to Active"
                >
                  <Undo2 size={13} /> Undo
                </button>
              </div>
            )}

            <button type="button" onClick={handleCopy} className="text-slate-400 hover:text-slate-600" title="Copy"><Copy size={13} /></button>
            <button type="button" onClick={handleDelete} className="text-red-400 hover:text-red-600" title="Delete"><Trash2 size={13} /></button>
          </div>
        </div>

        {/* Customer Details */}
        <CustomerDetailsSection 
          basicInfo={basicInfo} 
          setBasicInfo={setBasicInfo} 
          onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
          onCustomerSelect={(custObj) => {
            if (!custObj) return;
            setBasicInfo(prev => ({
              ...prev,
              customer: custObj.name,
              address: custObj.address || prev.address,
              priceList: custObj.priceList || prev.priceList,
              areaPinCode: custObj.areaPinCode || '',
              cityState: custObj.cityState || '',
              email: custObj.email || '',
              mobile: custObj.mobile || ''
            }));
            setOtherInfo(prev => ({
              ...prev,
              salesPerson: custObj.salesPerson || prev.salesPerson,
              mobile: custObj.mobile || prev.mobile,
              state: custObj.cityState ? custObj.cityState.split('/')[1]?.trim() : prev.state
            }));
          }}
        />

        {/* Custom Tab Navigation */}
        {/* Tab Contents */}
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
            showStatus={initialData && initialData.status === 'In Progress'}
          />
          <SummaryCard summary={summary} />
        </div>
      </div>
    </ModalForm>

    {/* Nested Modals */}
    <NewCustomerModal 
      isOpen={isCustomerModalOpen} 
      onClose={() => setIsCustomerModalOpen(false)} 
      onSave={(customerData) => {
        const custName = customerData.company || customerData.customer || 'New Customer';
        setBasicInfo(prev => ({ 
          ...prev, 
          customer: custName,
          address: customerData.address || prev.address,
          priceList: customerData.priceList || prev.priceList,
          areaPinCode: customerData.areaPinCode || '',
          cityState: customerData.cityState || '',
          email: customerData.email || '',
          mobile: customerData.mobile || ''
        }));
        setOtherInfo(prev => ({
          ...prev,
          salesPerson: customerData.salesPerson || prev.salesPerson,
          mobile: customerData.mobile || prev.mobile,
          state: customerData.cityState ? customerData.cityState.split('/')[1]?.trim() : prev.state
        }));
        addCustomer(customerData);
      }} 
    />
    <CatalogModal
      isOpen={isCatalogOpen}
      onClose={() => setIsCatalogOpen(false)}
      onSubmitCart={handleCatalogSubmit}
    />
    <DispatchFormModal
      isOpen={isDispatchModalOpen}
      initialData={{ ...initialData, details: { basicInfo, items, otherInfo, notes, summary } }}
      onClose={() => setIsDispatchModalOpen(false)}
      onSave={(updated) => {
        // Here we could handle partial saves if needed
        setIsDispatchModalOpen(false);
      }}
      onConvertToInvoice={(dispatchedData) => {
        setIsDispatchModalOpen(false);
        onClose(); // Close quotation modal
        if (onConvertToInvoice) {
          onConvertToInvoice(dispatchedData);
        } else {
          toast.success("Ready for Invoice conversion (No handler provided)");
        }
      }}
    />

    {/* Print Preview Modal */}
    {isPrintPreviewOpen && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex flex-col p-4 md:p-6 overflow-hidden">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              
              #quotation-print-area, #quotation-print-area * {
                visibility: visible;
              }
              
              /* Make the modal overlay absolute at top left, and let it grow to full height */
              .fixed.inset-0 {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                height: auto !important;
                min-height: 100% !important;
                overflow: visible !important;
                background: none !important;
                padding: 0 !important;
              }
              
              /* Let the container grow */
              .fixed.inset-0 > div {
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                box-shadow: none !important;
                margin: 0 !important;
                border: none !important;
              }
              
              /* Let the print area grow */
              #quotation-print-area {
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                position: static !important;
              }
              
              /* Hide the control bar */
              .fixed.inset-0 > div > div:first-child {
                display: none !important;
              }
              
              .break-after-page {
                page-break-after: always;
                break-after: page;
              }
              
              @page {
                size: ${printOrientation === 'Horizontal' ? 'landscape' : 'portrait'};
                margin: 10mm;
              }
            }
          `}
        </style>
        
        {/* Unified Print Preview Container */}
        <div className={`w-full mx-auto flex flex-col flex-1 min-h-0 mt-10 shadow-2xl rounded-2xl ${
          printOrientation === 'Horizontal' ? 'max-w-4xl' : 'max-w-3xl'
        }`}>
          
          {/* Top Control Bar */}
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
          
          {/* Document Sheet Scrollable Area */}
          <div className="flex-1 w-full overflow-y-auto min-h-0 rounded-b-2xl" id="quotation-print-area">
            <PremiumQuotationPrint 
              initialData={initialData}
              basicInfo={basicInfo}
              otherInfo={otherInfo}
              items={items}
              summary={summary}
              notes={notes}
              inventoryItems={inventoryItems}
            />
          </div>
        </div>
      </div>
    )}

    {/* Send Email Modal */}
    {isEmailModalOpen && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Send Quotation by Email</h3>
            <button 
              type="button" 
              onClick={() => setIsEmailModalOpen(false)}
              className="p-1.5 hover:bg-slate-55 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!emailForm.to) {
                toast.error("Recipient email address is required");
                return;
              }
              
              setIsSubmitting(true);
              const toastId = toast.loading("Sending email to " + emailForm.to + "...");
              
              try {
                // Simulate email send
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success("Email sent successfully!", { id: toastId });
                setIsEmailModalOpen(false);
              } catch (err) {
                toast.error("Failed to send email.", { id: toastId });
              } finally {
                setIsSubmitting(false);
              }
            }} 
            className="p-6 space-y-4 text-left"
          >
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Recipient Email (To) *</label>
              <input 
                type="email" 
                required 
                placeholder="customer@example.com" 
                value={emailForm.to} 
                onChange={(e) => setEmailForm({...emailForm, to: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Subject</label>
              <input 
                type="text" 
                placeholder="Subject" 
                value={emailForm.subject} 
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm h-[38px] bg-white outline-none" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-700 font-bold uppercase tracking-wider">Message Body</label>
              <textarea 
                rows="6" 
                placeholder="Message details..." 
                value={emailForm.body} 
                onChange={(e) => setEmailForm({...emailForm, body: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 text-xs md:text-sm bg-white outline-none font-mono" 
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
              <button 
                type="button" 
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100"
              >
                {isSubmitting ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
