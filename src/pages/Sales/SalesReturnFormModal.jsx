import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import useDataStore from '../../store/dataStore';
import CustomerDetailsSection from '../../components/sales/CustomerDetailsSection';
import SalesTabs from '../../components/sales/SalesTabs';
import ItemLinesTable from '../../components/sales/ItemLinesTable';
import SummaryCard from '../../components/sales/SummaryCard';
import SalesHeader from '../../components/sales/SalesHeader';
import FooterActions from '../../components/sales/FooterActions';
import NewCustomerModal from '../QuotationForm/NewCustomerModal';
import CatalogModal from '../QuotationForm/CatalogModal';
import OtherInformationTab from '../../components/OtherInformationTab';
import { X } from 'lucide-react';

export default function SalesReturnFormModal({ isOpen, onClose, onSave, initialData }) {
  const [activeTab, setActiveTab] = useState('ItemLines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState('Horizontal');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  
  const { items: inventoryItems, fetchItems } = useDataStore();

  useEffect(() => {
    if (isOpen) fetchItems(true);
  }, [isOpen, fetchItems]);

  const [basicInfo, setBasicInfo] = useState({
    customer: '', address: '', validityDate: '', priceList: 'Standard', paymentTerms: 'Net 30', areaPinCode: '', cityState: '', email: '', mobile: ''
  });

  const getEmptyItem = (type = 'item') => ({ id: Date.now() + Math.random(), type, itemCode: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, netAmount: 0 });
  const [items, setItems] = useState([getEmptyItem()]);

  const [otherInfo, setOtherInfo] = useState({
    salesPerson: '', referenceNumber: '', customerReference: '', expectedDeliveryDate: '', internalNotes: '', mobile: '', state: ''
  });

  const [notes, setNotes] = useState({
    remarks: '', termsAndConditions: '', additionalNotes: ''
  });

  const [summary, setSummary] = useState({
    grossAmount: 0, discountAmount: 0, taxAmount: 0, roundOffAmount: 0, totalAmount: 0
  });

  // Pre-fill if converting from Quotation
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.details) {
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
        setOtherInfo({
          ...initialData.details.otherInfo,
          referenceNumber: initialData.SalesReturnNo || ''
        });
        setNotes(initialData.details.notes || notes);
      }
    }
  }, [isOpen, initialData]);

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
      grossAmount: gross, discountAmount: totalDiscount, taxAmount: totalTax, roundOffAmount: roundOff, totalAmount: roundedTotal
    });
  }, [items]);

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleItemCodeSelect = (code, rowId) => {
    const item = inventoryItems.find(i => (i.ItemCode || i.code) === code);
    if (item) {
      setItems(prev => {
        const newItems = prev.map(p => p.id === rowId ? {
          ...p, itemCode: code, description: item.ItemName || item.name || '', unitPrice: Number(item.MRP || item.price || 0)
        } : p);
        if (prev[prev.length - 1].id === rowId) newItems.push(getEmptyItem('item'));
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
          id: Date.now() + Math.random(), type: 'item', itemCode: cartItem.ItemCode || cartItem.code, description: cartItem.ItemName || cartItem.name || '', quantity: cartItem.selectedQty, unitPrice: Number(cartItem.MRP || cartItem.price || 0), discountPercent: 0, taxPercent: 0, netAmount: 0
        };
        if (insertIndex !== -1) { newItems[insertIndex] = newItem; insertIndex = -1; } 
        else { newItems.push(newItem); }
      });
      newItems.push(getEmptyItem('item'));
      return newItems;
    });
  };

  const addItemLine = () => setItems(prev => [...prev, getEmptyItem('item')]);
  const addSection = () => setItems(prev => [...prev, getEmptyItem('section')]);
  const addSubSection = () => setItems(prev => [...prev, getEmptyItem('subsection')]);
  const removeItemLine = (id) => { if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.customer) { toast.error('Customer name is required'); return; }

    setIsSubmitting(true);
    try {
      const salesReturnData = {
        SalesReturnNo: initialData ? initialData.SalesReturnNo : `SR-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        customerName: basicInfo.customer,
        mobileNumber: basicInfo.mobile || otherInfo.mobile || initialData?.mobileNumber || '-',
        state: basicInfo.cityState ? (basicInfo.cityState.includes('/') ? basicInfo.cityState.split('/')[1]?.trim() : basicInfo.cityState) : (otherInfo.state || initialData?.state || '-'),
        salesPerson: otherInfo.salesPerson || 'Admin',
        totalAmount: summary.totalAmount,
        status: 'Active',
        details: { basicInfo, items, otherInfo, notes, summary }
      };

      // Mock save
      onSave(salesReturnData);
    } catch (error) {
      toast.error('Failed to save Sales Return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title=""
      onSubmit={handleSubmit}
      hideHeader={true}
      hideFooter={true}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col h-full min-h-[70vh]">
        
        {/* Custom Header matching screenshot */}
        <SalesHeader 
          title="Edit Sales Return"
          docNumber={initialData?.SalesReturnNo || "New Sales Return"}
          docDate={initialData?.date || new Date().toLocaleString()}
          onDiscard={onClose}
          showCreateReturn={false}
          printOrientation={printOrientation}
          setPrintOrientation={setPrintOrientation}
          onPrintPreview={() => setIsPrintPreviewOpen(true)}
          onSendEmail={() => {
            setEmailForm({
              to: basicInfo.email || '',
              subject: `Sales Return details - ${initialData?.SalesReturnNo || 'Draft'}`,
              body: `Dear Customer,\n\nPlease find the summary of your sales return below:\n\nSales Return No: ${initialData?.SalesReturnNo || 'Draft'}\nTotal Amount: ₹${summary.totalAmount}\nPayment Terms: ${basicInfo.paymentTerms || '-'}\n\nBest regards,\nParekh Gallerium Team`
            });
            setIsEmailModalOpen(true);
          }}
        />

        <div className="flex-1 space-y-6">
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

          <div className="min-h-[250px] py-4">
            <ItemLinesTable 
              items={items} inventoryItems={inventoryItems} handleItemChange={handleItemChange} handleItemCodeSelect={handleItemCodeSelect} removeItemLine={removeItemLine} addItemLine={addItemLine} addSection={addSection} addSubSection={addSubSection} setIsCatalogOpen={setIsCatalogOpen}
            />
            <SummaryCard summary={summary} />
          </div>
        </div>

        {/* Custom Footer */}
        <div className="border-t border-slate-200 mt-auto flex justify-between items-center">
          <FooterActions />
          <div className="py-4">
             <button onClick={handleSubmit} disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition">
               {isSubmitting ? 'Saving...' : 'Save Sales Return'}
             </button>
          </div>
        </div>

      </div>
    </ModalForm>

    <NewCustomerModal 
      isOpen={isCustomerModalOpen} 
      onClose={() => setIsCustomerModalOpen(false)} 
      onSave={(c) => {
        setBasicInfo(prev => ({ 
          ...prev, 
          customer: c.company || 'New Customer', 
          address: c.address || prev.address,
          areaPinCode: c.areaPinCode || '',
          cityState: c.cityState || '',
          email: c.email || '',
          mobile: c.mobile || ''
        }));
        setOtherInfo(prev => ({ ...prev, mobile: c.mobile || prev.mobile, state: c.cityState ? c.cityState.split('/')[1]?.trim() : prev.state, salesPerson: c.salesPerson || prev.salesPerson }));
      }} 
    />
    <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} onSubmitCart={handleCatalogSubmit} />

    {/* Print Preview Modal */}
    {isPrintPreviewOpen && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex flex-col p-4 md:p-6 overflow-hidden">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #sales-return-print-area, #sales-return-print-area * {
                visibility: visible;
              }
              #sales-return-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              @page {
                size: ${printOrientation === 'Horizontal' ? 'landscape' : 'portrait'};
                margin: 15mm;
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
          <div className="flex-1 w-full overflow-y-auto min-h-0 rounded-b-2xl">
            <div 
              id="sales-return-print-area"
              className="bg-white p-8 border border-t-0 border-slate-150 text-slate-800 rounded-b-2xl w-full"
            >
              {/* Company Info / Doc Header */}
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
                  <h2 className="text-4xl font-light text-slate-400 tracking-widest uppercase mb-4">Sales Return</h2>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <p><span className="font-bold text-slate-900 w-32 inline-block">Sales Return No:</span> {initialData?.SalesReturnNo || 'Draft'}</p>
                    <p><span className="font-bold text-slate-900 w-32 inline-block">Date:</span> {initialData?.date || new Date().toISOString().split('T')[0]}</p>
                    <p><span className="font-bold text-slate-900 w-32 inline-block">Sales Person:</span> {otherInfo.salesPerson || 'Admin'}</p>
                    <p><span className="font-bold text-slate-900 w-32 inline-block">Status:</span> <span className="uppercase font-bold text-slate-800">ACTIVE</span></p>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="flex gap-12 mb-10 text-xs">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3 uppercase tracking-widest text-[10px]">Client Details</h3>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-sm mb-2">{basicInfo.customer || 'Walk-in Customer'}</p>
                    {basicInfo.address && <p className="text-slate-700">{basicInfo.address}</p>}
                    {basicInfo.areaPinCode && <p className="text-slate-700"><span className="font-semibold text-slate-500">Area/PIN:</span> {basicInfo.areaPinCode}</p>}
                    {basicInfo.cityState && <p className="text-slate-700"><span className="font-semibold text-slate-500">City/State:</span> {basicInfo.cityState}</p>}
                    {basicInfo.mobile && <p className="text-slate-700"><span className="font-semibold text-slate-500">Mobile:</span> {basicInfo.mobile}</p>}
                    {basicInfo.email && <p className="text-slate-700"><span className="font-semibold text-slate-500">Email:</span> {basicInfo.email}</p>}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-3 uppercase tracking-widest text-[10px]">Return Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Validity Date:</span> 
                      <span className="font-bold text-slate-800">{basicInfo.validityDate || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Payment Terms:</span> 
                      <span className="font-bold text-slate-800">{basicInfo.paymentTerms || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Price List:</span> 
                      <span className="font-bold text-slate-800">{basicInfo.priceList || 'Standard'}</span>
                    </div>
                    {otherInfo.customerReference && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Cust Reference:</span> 
                        <span className="font-bold text-slate-800">{otherInfo.customerReference}</span>
                      </div>
                    )}
                    {otherInfo.referenceNumber && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Ref Number:</span> 
                        <span className="font-bold text-slate-800">{otherInfo.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="mb-8">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold uppercase tracking-widest text-[9px]">
                      <th className="py-2 px-1 text-center w-8">SN</th>
                      <th className="py-2 px-1 text-left w-[45%]">Product Details</th>
                      <th className="py-2 px-1 text-center w-12">Qty</th>
                      <th className="py-2 px-1 text-right w-24">Unit Price</th>
                      <th className="py-2 px-1 text-center w-16">Disc %</th>
                      <th className="py-2 px-1 text-center w-16">Tax %</th>
                      <th className="py-2 px-1 text-right w-28">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(item => item.itemCode || item.description).map((item, idx) => {
                      const rowGross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                      const rowDiscount = rowGross * ((Number(item.discountPercent) || 0) / 100);
                      const afterDiscount = rowGross - rowDiscount;
                      const rowTax = afterDiscount * ((Number(item.taxPercent) || 0) / 100);
                      const netAmt = afterDiscount + rowTax;
                      return (
                        <tr key={item.id} className="border-b border-slate-200 bg-white">
                          <td className="py-2 px-1 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-1 text-left">
                            <div className="font-bold text-slate-800">{item.itemCode || '-'}</div>
                            <div className="text-slate-600 capitalize mt-0.5 leading-snug text-justify pr-2">{item.description || '-'}</div>
                          </td>
                          <td className="py-2 px-1 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2 px-1 text-right text-slate-700">₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-1 text-center text-slate-500">{item.discountPercent}%</td>
                          <td className="py-2 px-1 text-center text-slate-500">{item.taxPercent}%</td>
                          <td className="py-2 px-1 text-right font-black text-slate-900">₹{Number(netAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes & Summary */}
              <div className="flex gap-12 text-xs mb-16">
                <div className="flex-1 space-y-6">
                  {notes.remarks && (
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[9px] mb-2">Remarks</h4>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">{notes.remarks}</p>
                    </div>
                  )}
                  {(notes.termsAndConditions || notes.additionalNotes) && (
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[9px] mb-2">Terms & Conditions</h4>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">{notes.termsAndConditions || notes.additionalNotes}</p>
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

              {/* Signature Area */}
              <div className="flex justify-between items-end mt-16 pt-8 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400">Thank you for your business!</p>
                </div>
                <div className="text-right space-y-12">
                  <p className="font-semibold text-slate-800">For Parekh Gallerium</p>
                  <div className="border-t border-slate-300 w-44 pt-1 text-center text-slate-450 text-[10px]">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
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
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Send Sales Return by Email</h3>
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
