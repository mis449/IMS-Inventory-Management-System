import React from 'react';
import { Mail, Instagram, MapPin } from 'lucide-react';
import logoImg from '../../Assets/images.png';
import firstImg from '../../Assets/first.png';
import secondImg from '../../Assets/second.png';
import thirdImg from '../../Assets/third.png';

export default function PremiumQuotationPrint({ 
  initialData, 
  basicInfo, 
  otherInfo, 
  items, 
  summary, 
  notes, 
  inventoryItems,
  documentTitle = "Quotation"
}) {
  const coverImage = firstImg;
  const verticalImage = secondImg;
  const qrCode = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=parekh@upi&pn=Parekh%20Gallerium";

  const quotationNo = initialData?.quotationNo || initialData?.docNo || 'Draft';
  const createdOn = initialData?.date || initialData?.docDate || new Date().toISOString().split('T')[0];
  const salesperson = otherInfo?.salesPerson || initialData?.salesPerson || 'Admin';

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formattedDate = formatDate(createdOn);

  // Reusable Logo Component
  const Logo = () => (
    <div className="mb-4">
      <img src={logoImg} alt="Parekh Sanitary Stores Logo" className="h-20 object-contain scale-[1.5] origin-left" />
    </div>
  );

  const PageWrapper = ({ children, isLast = false }) => (
    <div className={`w-full bg-white relative flex flex-col ${isLast ? '' : 'break-after-page mb-8'}`} style={{ minHeight: '297mm', padding: '10mm', boxSizing: 'border-box' }}>
      {children}
    </div>
  );

  return (
    <div className="w-full text-slate-800 font-sans" id="premium-quotation-print" style={{ backgroundColor: '#f8fafc', padding: '20px' }}>
      
      {/* Page 1: Merged Cover & Client Info Page */}
      <PageWrapper>
        {/* Header Section (Logo Top Left, Details Top Right) */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <div className="mb-2">
               <img src={logoImg} alt="Parekh Sanitary Stores Logo" className="h-20 object-contain scale-[1.3] origin-left" />
            </div>
          </div>
          <div className="text-sm space-y-1.5 text-slate-600 text-right mt-2">
            <div><span className="font-medium mr-2">Document # :</span> {quotationNo}</div>
            <div><span className="font-medium mr-2">Created On :</span> {formattedDate}</div>
          </div>
        </div>

        {/* Top Cover Image */}
        <div className="mb-8 rounded-lg overflow-hidden relative">
          <img src={coverImage} alt="Luxury Bathroom Cover" className="w-full max-h-[350px] object-cover object-center" />
        </div>
        
        {/* Document Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-light tracking-wider text-slate-800">{documentTitle}</h1>
        </div>

        {/* Client Info Split Section */}
        <div className="flex gap-12 flex-1">
          <div className="w-[45%] rounded-lg overflow-hidden flex items-center justify-center">
            <img src={verticalImage} alt="Bathroom details" className="w-full max-h-[500px] object-contain" />
          </div>
          <div className="w-[55%] flex flex-col py-2">
            <div className="space-y-4 text-sm text-slate-800 mb-8">
              <div className="flex"><span className="w-36 font-semibold">Client Name</span> <span className="uppercase">: {basicInfo?.customer || 'Walk-in Customer'}</span></div>
              {basicInfo?.areaPinCode && <div className="flex"><span className="w-36"></span> <span>  {basicInfo.areaPinCode}</span></div>}
              {basicInfo?.address && <div className="flex"><span className="w-36"></span> <span className="uppercase">  {basicInfo.address}</span></div>}
              {basicInfo?.cityState && <div className="flex"><span className="w-36"></span> <span className="uppercase">  {basicInfo.cityState}, India</span></div>}
              <div className="flex mt-4"><span className="w-36 font-semibold">Client Number</span> <span>: {basicInfo?.mobile || '-'}</span></div>
              <div className="flex"><span className="w-36 font-semibold">Client Location</span> <span className="uppercase">: {basicInfo?.cityState?.split('/')[0] || '-'}</span></div>
              <div className="flex"><span className="w-36 font-semibold">Architect Name</span> <span className="uppercase">: {otherInfo?.architectName || '-'}</span></div>
              <div className="flex"><span className="w-36 font-semibold">Salesperson</span> <span className="uppercase">: {salesperson}</span></div>
              <div className="flex"><span className="w-36 font-semibold">Sales Number</span> <span>: {otherInfo?.salesNumber || '-'}</span></div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-500 rounded"><Mail size={14} /></div>
                <span>info@parekhgallerium.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-6 h-6 flex items-center justify-center bg-pink-100 text-pink-500 rounded"><Instagram size={14} /></div>
                <span>parekh_gallerium</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-500 rounded shrink-0"><MapPin size={14} /></div>
                <span className="leading-snug">6M84+9HF, New Dhamtari Rd, RishabhNagar<br/>and Pawan Vihar Colony, Pachpedi Naka,<br/>Raipur, Tikrapara, Chhattisgarh 492001</span>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Page 3: Product Pages */}
      <PageWrapper>
        <Logo />
        <h2 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wider">Product Details</h2>
        
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-2 text-center w-32">Image</th>
              <th className="py-3 px-2 text-left w-[35%]">Product Details</th>
              <th className="py-3 px-2 text-center w-12">Qty</th>
              <th className="py-3 px-2 text-right w-20">MRP</th>
              <th className="py-3 px-2 text-right w-16">Dis %</th>
              <th className="py-3 px-2 text-right w-20">Net rate</th>
              <th className="py-3 px-2 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items?.filter(item => item.itemCode || item.description).map((item, idx) => {
              const matchedInventoryItem = inventoryItems?.find(i => (i.ItemCode || i.code) === item.itemCode);
              const imageUrl = item.thumbnail || item.image || (matchedInventoryItem ? (matchedInventoryItem.Thumbnail || matchedInventoryItem.product_image_url) : '');
              const unitPrice = Number(item.unitPrice || 0);
              const discountPercent = Number(item.discountPercent || 0);
              const netRate = unitPrice - (unitPrice * (discountPercent / 100));
              const amount = netRate * (Number(item.quantity) || 0);

              return (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-4 px-2 text-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="product" className="w-28 h-28 object-contain mx-auto rounded border border-slate-200 shadow-sm bg-white" />
                    ) : (
                      <div className="w-28 h-28 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto rounded">
                         <span className="text-[10px]">No Img</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-2 text-left">
                    <div className="font-bold text-slate-800 text-sm mb-1">{item.itemCode || '-'}</div>
                    <div className="text-slate-600 leading-snug">{item.description || '-'}</div>
                  </td>
                  <td className="py-4 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-slate-700">₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-2 text-right text-slate-700">{discountPercent > 0 ? `${discountPercent}%` : '-'}</td>
                  <td className="py-4 px-2 text-right text-slate-700">₹{netRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-2 text-right font-bold text-slate-900">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mt-8">
          <div className="w-80 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Gross Amount:</span>
              <span>₹{Number(summary?.grossAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount:</span>
              <span>- ₹{Number(summary?.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Amount:</span>
              <span>+ ₹{Number(summary?.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-lg border-t border-slate-300 pt-3 mt-2">
              <span>Grand Total:</span>
              <span>₹{Number(summary?.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            {summary?.finalAmount && (
              <div className="flex justify-between text-emerald-700 font-black text-xl border-t border-slate-300 pt-3 mt-2">
                <span>Final Amount:</span>
                <span>₹{Number(summary?.finalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>

      {/* Page 4: Terms and Conditions */}
      <PageWrapper>
        <Logo />
        <h2 className="text-3xl font-light text-slate-800 mb-8 uppercase tracking-widest">Terms & Conditions</h2>
        
        <div className="space-y-8 text-sm">
          <div>
            <h3 className="font-bold text-slate-800 mb-4 uppercase">General</h3>
            <ul className="space-y-2 text-slate-700 uppercase leading-relaxed list-none">
              <li>1) Special order products will not be taken back or exchanged.</li>
              <li>2) Interest of 24% P.A will be charged if payment of bill is not made within given timeline.</li>
              <li>3) Disputes if any are subject to Raipur jurisdiction only.</li>
              <li>4) If any warranty passed to customer is purely from the manufacture only.</li>
              <li>5) Please check the goods before accepting.</li>
              <li>6) Refund will be made by cheque for returned goods.</li>
              <li>7) Goods will not be returned and exchanged on Sunday and Saturday.</li>
              <li>8) Payment 100% Advance.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-2 uppercase">Price Validity</h3>
            <p className="text-slate-700">{basicInfo?.validityDate ? formatDate(basicInfo.validityDate) : '30 Days from Quotation Date'}</p>
          </div>

          <div className="flex justify-between items-start mt-12">
            <div>
              <h3 className="font-bold text-slate-800 mb-4 uppercase">RTGS Information</h3>
              <div className="space-y-2 text-slate-700">
                <div className="flex"><span className="w-32">Name</span> <span>: PAREKH SANITARY STORES</span></div>
                <div className="flex"><span className="w-32">Bank Name</span> <span>: INDUSIND BANK LTD.</span></div>
                <div className="flex"><span className="w-32">Bank Address</span> <span>: MG ROAD, RAIPUR</span></div>
                <div className="flex"><span className="w-32">Account No</span> <span>: 6500141113803</span></div>
                <div className="flex"><span className="w-32">IFSC Code</span> <span>: INDB0000841</span></div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="font-bold text-slate-800 mb-3 uppercase">Scan for UPI</h3>
              <div className="p-2 border-2 border-red-700 rounded inline-block bg-white shadow-sm">
                <img src={qrCode} alt="UPI QR Code" className="w-32 h-32" />
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-10">Authorized Signatory</div>
              <div className="text-sm font-semibold text-slate-800 border-t border-slate-300 pt-2 inline-block min-w-[200px]">For Parekh Sanitary Stores</div>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-slate-400">
            This is a computer-generated {documentTitle.toLowerCase()}. No signature is required.
          </div>
        </div>
      </PageWrapper>

      {/* Page 5: Brand Showcase & Final Footer */}
      <PageWrapper isLast={true}>
        <Logo />
        
        <div className="border border-slate-200 rounded-xl p-8 mb-8 flex-1 flex flex-col justify-center shadow-sm items-center">
          <img src={thirdImg} alt="Brand Showcase" className="w-full max-h-[500px] object-contain" />
        </div>

        <div className="bg-black text-white p-12 rounded-xl mt-auto">
          <h2 className="text-center text-xl font-medium tracking-widest mb-12 uppercase">
            Central India's Largest Bathroom Solution Showroom
          </h2>
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-white/10 border-2 border-white flex items-center justify-center text-2xl font-black mb-2">PS</div>
            <span className="text-xs tracking-widest text-slate-400">SINCE 1964</span>
            <h3 className="text-3xl font-bold tracking-widest mt-4 mb-2">PAREKH GALLERIUM</h3>
            <p className="text-xs text-center text-slate-300 tracking-wider leading-relaxed">
              SANITARY WARE | BATHROOM FIXTURES | SWIMMING POOL | SPA & JACUZZI<br/>
              TILES & WOODEN FLOORING | PLUMBING & PIPING | FALSE CEILING |<br/>
              WINDOWS AND DOORS
            </p>
          </div>

          <div className="flex justify-center gap-16 text-xs text-slate-300">
            <div className="text-right space-y-1">
              <h4 className="font-bold text-white uppercase tracking-wider mb-2">Corporate Office</h4>
              <p>C - 1,3 & 4, Rishab Complex,</p>
              <p>M.G. Road, Raipur (C.G.)</p>
              <p>Ph.: 0771 - 4700501, 4031480</p>
              <p>Fax: 0771 - 4700501</p>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div className="text-left space-y-1">
              <h4 className="font-bold text-white uppercase tracking-wider mb-2">Display Center</h4>
              <p>Old Dhamtari Road, Pachpedi Naka</p>
              <p>Opposite Colours Mall,</p>
              <p>Raipur (C.G.)</p>
              <p>Ph.: 0771 - 4900603, 4900601</p>
              <p>Mo.: +91 78800 11158</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 px-2">
          <span>Page 5</span>
          <span>Document made through Botivate, an IMS Software</span>
        </div>
      </PageWrapper>

    </div>
  );
}
