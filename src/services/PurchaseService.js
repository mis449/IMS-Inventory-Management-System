import { supabase } from '../supabaseClient';

export const getPurchases = async () => {
  const { data, error } = await supabase
    .from('purchase')
    .select('*, purchase_items(*)')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching purchases:", error);
    return [];
  }
  
  return data.map(item => {
    // Reconstruct the frontend details structure from the relational columns
    const headerInfo = {
      materialRcvdDate: item.material_rcvd_date || '',
      billNo: item.bill_no || '',
      vendorBillNo: item.vendor_bill_no || '',
      billDate: item.bill_date || ''
    };

    const basicInfo = {
      vendor: item.vendor_name || '',
      address: item.vendor_address || '',
      areaPinCode: item.area_pin_code || '',
      cityState: item.city_state || '',
      state: item.state || '',
      email: item.email || '',
      mobile: item.mobile || '',
      validityDate: item.validity_date || '',
      priceList: item.price_list || 'Standard',
      paymentTerms: item.payment_terms || 'Net 30'
    };
    
    const otherInfo = {
      internalNotes: item.internal_notes || ''
    };
    
    const notes = {
      remarks: item.remarks || '',
      termsAndConditions: item.terms_and_conditions || ''
    };
    
    const summary = {
      grossAmount: Number(item.gross_amount) || 0,
      discountAmount: Number(item.discount_amount) || 0,
      taxAmount: Number(item.tax_amount) || 0,
      roundOffAmount: Number(item.round_off_amount) || 0,
      totalAmount: Number(item.total_amount) || 0
    };
    
    const items = (item.purchase_items || []).map(i => ({
      id: i.id,
      type: i.item_type || 'item',
      itemCode: i.item_code || '',
      description: i.description || '',
      quantity: Number(i.quantity) || 0,
      unitPrice: Number(i.unit_price) || 0,
      discountPercent: Number(i.discount_percent) || 0,
      taxPercent: Number(i.tax_percent) || 0,
      netAmount: Number(i.net_amount) || 0
    }));

    return {
      id: item.id,
      docNo: item.purchase_no,
      purchaseNo: item.purchase_no,
      vendorName: item.vendor_name,
      vendor: item.vendor_name,
      docDate: item.date,
      date: item.date,
      status: item.status,
      paymentStatus: item.payment_status,
      state: basicInfo.state || (basicInfo.cityState ? (basicInfo.cityState.includes('/') ? basicInfo.cityState.split('/')[1]?.trim() : basicInfo.cityState) : '-'),
      mobile: basicInfo.mobile || '-',
      billNo: headerInfo.billNo || '-',
      billDate: headerInfo.billDate || '-',
      amount: summary.totalAmount,
      totalAmount: summary.totalAmount,
      acPostStatus: '0.00',
      details: {
        headerInfo,
        basicInfo,
        otherInfo,
        notes,
        summary,
        items
      }
    };
  });
};

export const createPurchase = async (data) => {
  const { data: lastRecord } = await supabase.from('purchase').select('purchase_no').order('created_at', { ascending: false }).limit(1);
  let nextNum = 1;
  if (lastRecord && lastRecord.length > 0 && lastRecord[0].purchase_no) {
    const match = lastRecord[0].purchase_no.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }
  const docNo = data.purchaseNo || data.docNo || `PUR-${String(nextNum).padStart(4, '0')}`;
  
  const d = data.details || {};
  const headerInfo = d.headerInfo || {};
  const basicInfo = d.basicInfo || {};
  const otherInfo = d.otherInfo || {};
  const notes = d.notes || {};
  const summary = d.summary || {};
  const items = d.items || [];
  
  const insertId = String(Date.now());
  
  const insertData = {
    id: insertId,
    purchase_no: docNo,
    vendor_name: data.vendorName || data.vendor || basicInfo.vendor || '',
    date: data.date || data.docDate || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    payment_status: data.paymentStatus || '-',
    
    material_rcvd_date: headerInfo.materialRcvdDate || '',
    bill_no: headerInfo.billNo || '',
    vendor_bill_no: headerInfo.vendorBillNo || '',
    bill_date: headerInfo.billDate || '',
    
    vendor_address: basicInfo.address || '',
    area_pin_code: basicInfo.areaPinCode || '',
    city_state: basicInfo.cityState || '',
    state: basicInfo.state || '',
    email: basicInfo.email || '',
    mobile: basicInfo.mobile || '',
    validity_date: basicInfo.validityDate || '',
    price_list: basicInfo.priceList || '',
    payment_terms: basicInfo.paymentTerms || '',
    
    internal_notes: otherInfo.internalNotes || '',
    
    remarks: notes.remarks || '',
    terms_and_conditions: notes.termsAndConditions || '',
    
    gross_amount: summary.grossAmount || 0,
    discount_amount: summary.discountAmount || 0,
    tax_amount: summary.taxAmount || 0,
    round_off_amount: summary.roundOffAmount || 0,
    total_amount: summary.totalAmount || 0
  };

  const { data: result, error } = await supabase.from('purchase').insert([insertData]).select().single();
  if (error) throw error;
  
  // Insert items
  if (items.length > 0) {
    const itemsData = items.map(i => ({
      id: String(i.id || Date.now() + Math.random()),
      purchase_id: insertId,
      item_type: i.type || 'item',
      item_code: i.itemCode || '',
      description: i.description || '',
      quantity: i.quantity || 0,
      unit_price: i.unitPrice || 0,
      discount_percent: i.discountPercent || 0,
      tax_percent: i.taxPercent || 0,
      net_amount: i.netAmount || 0
    }));
    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsData);
    if (itemsError) console.error("Error saving items:", itemsError);
  }
  
  return { ...data, id: result.id, purchaseNo: result.purchase_no, docNo: result.purchase_no };
};

export const updatePurchase = async (id, data) => {
  const d = data.details || {};
  if (Object.keys(d).length === 0) {
    // Partial status update
    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
    if (data.vendorName || data.vendor) updateData.vendor_name = data.vendorName || data.vendor;
    
    if (Object.keys(updateData).length > 0) {
      const { data: result, error } = await supabase
        .from('purchase')
        .update(updateData)
        .eq('id', String(id))
        .select()
        .single();
      if (error) throw error;
      return { ...data, id: result.id, purchaseNo: result.purchase_no, docNo: result.purchase_no };
    }
    return data;
  }
  
  const headerInfo = d.headerInfo || {};
  const basicInfo = d.basicInfo || {};
  const otherInfo = d.otherInfo || {};
  const notes = d.notes || {};
  const summary = d.summary || {};
  const items = d.items || [];
  
  const updateData = {
    vendor_name: data.vendorName || data.vendor || basicInfo.vendor || '',
    date: data.date || data.docDate,
    status: data.status,
    payment_status: data.paymentStatus,
    
    material_rcvd_date: headerInfo.materialRcvdDate || '',
    bill_no: headerInfo.billNo || '',
    vendor_bill_no: headerInfo.vendorBillNo || '',
    bill_date: headerInfo.billDate || '',
    
    vendor_address: basicInfo.address || '',
    area_pin_code: basicInfo.areaPinCode || '',
    city_state: basicInfo.cityState || '',
    state: basicInfo.state || '',
    email: basicInfo.email || '',
    mobile: basicInfo.mobile || '',
    validity_date: basicInfo.validityDate || '',
    price_list: basicInfo.priceList || '',
    payment_terms: basicInfo.paymentTerms || '',
    
    internal_notes: otherInfo.internalNotes || '',
    
    remarks: notes.remarks || '',
    terms_and_conditions: notes.termsAndConditions || '',
    
    gross_amount: summary.grossAmount || 0,
    discount_amount: summary.discountAmount || 0,
    tax_amount: summary.taxAmount || 0,
    round_off_amount: summary.roundOffAmount || 0,
    total_amount: summary.totalAmount || 0
  };

  const { data: result, error } = await supabase
    .from('purchase')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  
  // Replace items completely: Delete old, insert new
  await supabase.from('purchase_items').delete().eq('purchase_id', String(id));
  
  if (items.length > 0) {
    const itemsData = items.map(i => ({
      id: String(i.id || Date.now() + Math.random()),
      purchase_id: String(id),
      item_type: i.type || 'item',
      item_code: i.itemCode || '',
      description: i.description || '',
      quantity: i.quantity || 0,
      unit_price: i.unitPrice || 0,
      discount_percent: i.discountPercent || 0,
      tax_percent: i.taxPercent || 0,
      net_amount: i.netAmount || 0
    }));
    await supabase.from('purchase_items').insert(itemsData);
  }
  
  return { ...data, id: result.id, purchaseNo: result.purchase_no, docNo: result.purchase_no };
};

export const deletePurchase = async (id) => {
  const { error } = await supabase.from('purchase').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
