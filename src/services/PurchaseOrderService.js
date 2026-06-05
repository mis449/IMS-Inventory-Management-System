import { supabase } from '../supabaseClient';

export const getPurchaseOrders = async () => {
  const { data, error } = await supabase
    .from('purchase_order')
    .select('*, purchase_order_items(*)')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
  
  return data.map(item => {
    // Reconstruct the frontend details structure from the relational columns
    const basicInfo = {
      vendor: item.vendor_name || '',
      address: item.vendor_address || '',
      areaPinCode: item.area_pin_code || '',
      cityState: item.city_state || '',
      email: item.email || '',
      mobile: item.mobile || '',
      validityDate: item.validity_date || '',
      priceList: item.price_list || '',
      paymentTerms: item.payment_terms || ''
    };
    
    const otherInfo = {
      buyer: item.buyer || '',
      referenceNumber: item.reference_number || '',
      expectedDeliveryDate: item.expected_delivery_date || '',
      internalNotes: item.internal_notes || ''
    };
    
    const notes = {
      remarks: item.remarks || '',
      termsAndConditions: item.terms_and_conditions || '',
      additionalNotes: item.additional_notes || ''
    };
    
    const summary = {
      grossAmount: Number(item.gross_amount) || 0,
      discountAmount: Number(item.discount_amount) || 0,
      taxAmount: Number(item.tax_amount) || 0,
      roundOffAmount: Number(item.round_off_amount) || 0,
      totalAmount: Number(item.total_amount) || 0
    };
    
    const items = (item.purchase_order_items || []).map(i => ({
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
      docNo: item.order_no,
      orderNo: item.order_no,
      vendorName: item.vendor_name,
      docDate: item.date,
      date: item.date,
      status: item.status,
      supplyStatus: item.supply_status,
      state: item.city_state ? (item.city_state.includes('/') ? item.city_state.split('/')[1]?.trim() : item.city_state) : '-',
      mobile: item.mobile || '-',
      amount: summary.totalAmount,
      totalAmount: summary.totalAmount,
      details: {
        basicInfo,
        otherInfo,
        notes,
        summary,
        items
      }
    };
  });
};

export const createPurchaseOrder = async (data) => {
  const { count } = await supabase.from('purchase_order').select('*', { count: 'exact', head: true });
  const docNo = data.orderNo || data.purchaseNo || `PO-${String((count || 0) + 1).padStart(4, '0')}`;
  
  const d = data.details || {};
  const basicInfo = d.basicInfo || {};
  const otherInfo = d.otherInfo || {};
  const notes = d.notes || {};
  const summary = d.summary || {};
  const items = d.items || [];
  
  const insertId = String(Date.now());
  
  const insertData = {
    id: insertId,
    order_no: docNo,
    vendor_name: data.vendorName || data.vendor || basicInfo.vendor || '',
    date: data.date || data.docDate || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    supply_status: data.supplyStatus || '-',
    vendor_address: basicInfo.address || '',
    area_pin_code: basicInfo.areaPinCode || '',
    city_state: basicInfo.cityState || '',
    email: basicInfo.email || '',
    mobile: basicInfo.mobile || '',
    validity_date: basicInfo.validityDate || '',
    price_list: basicInfo.priceList || '',
    payment_terms: basicInfo.paymentTerms || '',
    buyer: otherInfo.buyer || '',
    reference_number: otherInfo.referenceNumber || '',
    expected_delivery_date: otherInfo.expectedDeliveryDate || '',
    internal_notes: otherInfo.internalNotes || '',
    remarks: notes.remarks || '',
    terms_and_conditions: notes.termsAndConditions || '',
    additional_notes: notes.additionalNotes || '',
    gross_amount: summary.grossAmount || 0,
    discount_amount: summary.discountAmount || 0,
    tax_amount: summary.taxAmount || 0,
    round_off_amount: summary.roundOffAmount || 0,
    total_amount: summary.totalAmount || 0
  };

  const { data: result, error } = await supabase.from('purchase_order').insert([insertData]).select().single();
  if (error) throw error;
  
  // Insert items
  if (items.length > 0) {
    const itemsData = items.map(i => ({
      id: String(i.id || Date.now() + Math.random()),
      purchase_order_id: insertId,
      item_type: i.type || 'item',
      item_code: i.itemCode || '',
      description: i.description || '',
      quantity: i.quantity || 0,
      unit_price: i.unitPrice || 0,
      discount_percent: i.discountPercent || 0,
      tax_percent: i.taxPercent || 0,
      net_amount: i.netAmount || 0
    }));
    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsData);
    if (itemsError) console.error("Error saving items:", itemsError);
  }
  
  return { ...data, id: result.id, orderNo: result.order_no, docNo: result.order_no };
};

export const updatePurchaseOrder = async (id, data) => {
  const d = data.details || {};
  if (Object.keys(d).length === 0) {
    // Partial status update
    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.supplyStatus) updateData.supply_status = data.supplyStatus;
    if (data.vendorName || data.vendor) updateData.vendor_name = data.vendorName || data.vendor;
    
    if (Object.keys(updateData).length > 0) {
      const { data: result, error } = await supabase
        .from('purchase_order')
        .update(updateData)
        .eq('id', String(id))
        .select()
        .single();
      if (error) throw error;
      return { ...data, id: result.id, orderNo: result.order_no, docNo: result.order_no };
    }
    return data;
  }
  
  const basicInfo = d.basicInfo || {};
  const otherInfo = d.otherInfo || {};
  const notes = d.notes || {};
  const summary = d.summary || {};
  const items = d.items || [];
  
  const updateData = {
    vendor_name: data.vendorName || data.vendor || basicInfo.vendor || '',
    date: data.date || data.docDate,
    status: data.status,
    supply_status: data.supplyStatus,
    vendor_address: basicInfo.address || '',
    area_pin_code: basicInfo.areaPinCode || '',
    city_state: basicInfo.cityState || '',
    email: basicInfo.email || '',
    mobile: basicInfo.mobile || '',
    validity_date: basicInfo.validityDate || '',
    price_list: basicInfo.priceList || '',
    payment_terms: basicInfo.paymentTerms || '',
    buyer: otherInfo.buyer || '',
    reference_number: otherInfo.referenceNumber || '',
    expected_delivery_date: otherInfo.expectedDeliveryDate || '',
    internal_notes: otherInfo.internalNotes || '',
    remarks: notes.remarks || '',
    terms_and_conditions: notes.termsAndConditions || '',
    additional_notes: notes.additionalNotes || '',
    gross_amount: summary.grossAmount || 0,
    discount_amount: summary.discountAmount || 0,
    tax_amount: summary.taxAmount || 0,
    round_off_amount: summary.roundOffAmount || 0,
    total_amount: summary.totalAmount || 0
  };

  const { data: result, error } = await supabase
    .from('purchase_order')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  
  // Replace items completely: Delete old, insert new
  await supabase.from('purchase_order_items').delete().eq('purchase_order_id', String(id));
  
  if (items.length > 0) {
    const itemsData = items.map(i => ({
      id: String(i.id || Date.now() + Math.random()),
      purchase_order_id: String(id),
      item_type: i.type || 'item',
      item_code: i.itemCode || '',
      description: i.description || '',
      quantity: i.quantity || 0,
      unit_price: i.unitPrice || 0,
      discount_percent: i.discountPercent || 0,
      tax_percent: i.taxPercent || 0,
      net_amount: i.netAmount || 0
    }));
    await supabase.from('purchase_order_items').insert(itemsData);
  }
  
  return { ...data, id: result.id, orderNo: result.order_no, docNo: result.order_no };
};

export const deletePurchaseOrder = async (id) => {
  const { error } = await supabase.from('purchase_order').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
