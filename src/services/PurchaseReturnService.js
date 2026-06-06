import { supabase } from '../supabaseClient';

export const getPurchaseReturns = async () => {
  const { data, error } = await supabase.from('purchase_return').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching purchase returns:", error);
    return [];
  }
  return data.map(item => {
    // Fallback to details for backward compatibility with old records
    const details = item.details || {};
    const vendorBasic = details.vendorBasicInfo || details.basicInfo || {};
    const other = details.otherInfo || {};
    const sum = details.summary || {};
    
    let itemsList = item.items || details.items || [];
    
    // If no items in JSON but we have individual item columns, reconstruct the item line
    if (itemsList.length === 0 && item.item_code) {
      itemsList = [{
        id: Date.now(),
        type: 'item',
        itemCode: item.item_code || '',
        description: item.item_description || '',
        quantity: item.item_quantity || 0,
        unitPrice: item.item_unit_price || 0,
        discountPercent: item.item_discount_percent || 0,
        taxPercent: item.item_tax_percent || 0,
        netAmount: item.item_net_amount || 0
      }];
    }
    
    return {
      id: item.id,
      PurchaseReturnNo: item.return_no || details.returnNo || details.PurchaseReturnNo || '-',
      returnNo: item.return_no || details.returnNo || details.PurchaseReturnNo || '-',
      docNo: item.return_no || details.docNo || details.returnNo || '-',
      vendorName: item.vendor_name || details.vendorName || details.vendor || vendorBasic.vendor || '-',
      vendor: item.vendor_name || details.vendor || details.vendorName || vendorBasic.vendor || '-',
      docDate: item.date || details.date || details.docDate,
      date: item.date || details.date || details.docDate,
      status: item.status || details.status || 'Active',
      // Mapping new columns
      vendor_address: item.vendor_address || vendorBasic.address || '',
      vendor_area_pin_code: item.vendor_area_pin_code || vendorBasic.areaPinCode || '',
      vendor_city_state: item.vendor_city_state || vendorBasic.cityState || '',
      vendor_state: item.vendor_state || vendorBasic.state || other.state || '',
      vendor_email: item.vendor_email || vendorBasic.email || '',
      vendor_mobile: item.vendor_mobile || vendorBasic.mobile || other.mobile || '',
      validity_date: item.validity_date || vendorBasic.validityDate || '',
      price_list: item.price_list || vendorBasic.priceList || '',
      payment_terms: item.payment_terms || vendorBasic.paymentTerms || '',
      internal_notes: item.internal_notes || other.internalNotes || '',
      remarks: item.remarks || details.notes?.remarks || '',
      terms_conditions: item.terms_conditions || details.notes?.termsAndConditions || '',
      gross_amount: item.gross_amount || sum.grossAmount || 0,
      discount_amount: item.discount_amount || sum.discountAmount || 0,
      tax_amount: item.tax_amount || sum.taxAmount || 0,
      round_off_amount: item.round_off_amount || sum.roundOffAmount || 0,
      total_amount: item.total_amount || sum.totalAmount || details.amount || 0,
      ref_purchase: item.ref_purchase || details.refPurchase || '',
      
      // The reconstructed or existing items array
      items: itemsList,
      
      // Export individual item fields just in case UI wants to read them directly
      item_code: item.item_code || '',
      item_description: item.item_description || '',
      item_quantity: item.item_quantity || 0,
      item_unit_price: item.item_unit_price || 0,
      item_discount_percent: item.item_discount_percent || 0,
      item_tax_percent: item.item_tax_percent || 0,
      item_net_amount: item.item_net_amount || 0,
      
      // For compatibility with frontend components expecting specific fields
      state: item.vendor_state || vendorBasic.state || other.state || details.state || '-',
      mobile: item.vendor_mobile || vendorBasic.mobile || other.mobile || details.mobile || '-',
      amount: item.total_amount || sum.totalAmount || details.amount || 0,
      totalAmount: item.total_amount || sum.totalAmount || details.totalAmount || 0,
      details: details // keep raw details just in case
    };
  });
};

export const createPurchaseReturn = async (data) => {
  const { data: lastRecord } = await supabase.from('purchase_return').select('return_no').order('created_at', { ascending: false }).limit(1);
  let nextNum = 1;
  if (lastRecord && lastRecord.length > 0 && lastRecord[0].return_no) {
    const match = lastRecord[0].return_no.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }
  const docNo = `PR-${String(nextNum).padStart(4, '0')}`;
  
  const firstItem = data.items && data.items.length > 0 ? data.items[0] : {};
  
  const insertData = {
    id: String(Date.now()),
    return_no: docNo,
    vendor_name: data.vendor_name || data.vendorName || data.vendor || '',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    // New fields mapped from data
    vendor_address: data.vendor_address || '',
    vendor_area_pin_code: data.vendor_area_pin_code || '',
    vendor_city_state: data.vendor_city_state || '',
    vendor_state: data.vendor_state || '',
    vendor_email: data.vendor_email || '',
    vendor_mobile: data.vendor_mobile || '',
    validity_date: data.validity_date || '',
    price_list: data.price_list || '',
    payment_terms: data.payment_terms || '',
    internal_notes: data.internal_notes || '',
    remarks: data.remarks || '',
    terms_conditions: data.terms_conditions || '',
    gross_amount: data.gross_amount || 0,
    discount_amount: data.discount_amount || 0,
    tax_amount: data.tax_amount || 0,
    round_off_amount: data.round_off_amount || 0,
    total_amount: data.total_amount || 0,
    ref_purchase: data.ref_purchase || '',
    
    // Removing items array and saving only the first item into the flat columns
    items: null,
    item_code: firstItem.itemCode || '',
    item_description: firstItem.description || '',
    item_quantity: firstItem.quantity || 0,
    item_unit_price: firstItem.unitPrice || 0,
    item_discount_percent: firstItem.discountPercent || 0,
    item_tax_percent: firstItem.taxPercent || 0,
    item_net_amount: firstItem.netAmount || 0,
    
    details: {} // No longer putting all data in details
  };

  const { data: result, error } = await supabase.from('purchase_return').insert([insertData]).select().single();
  if (error) throw error;
  
  return { 
    ...data, 
    id: result.id, 
    PurchaseReturnNo: result.return_no,
    returnNo: result.return_no,
    vendor: result.vendor_name,
    amount: data.total_amount || 0,
    mobile: data.vendor_mobile || '',
    state: data.vendor_state || ''
  };
};

export const updatePurchaseReturn = async (id, updates) => {
  const updateData = { ...updates };
  
  // If items array is present, map it to individual columns and remove the array
  if (updateData.items) {
    const firstItem = updateData.items.length > 0 ? updateData.items[0] : {};
    
    updateData.item_code = firstItem.itemCode || '';
    updateData.item_description = firstItem.description || '';
    updateData.item_quantity = firstItem.quantity || 0;
    updateData.item_unit_price = firstItem.unitPrice || 0;
    updateData.item_discount_percent = firstItem.discountPercent || 0;
    updateData.item_tax_percent = firstItem.taxPercent || 0;
    updateData.item_net_amount = firstItem.netAmount || 0;
    
    updateData.items = null; // Clear the JSON blob
  }

  const { data: result, error } = await supabase
    .from('purchase_return')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  
  return { 
    ...updates, 
    id: result.id, 
    PurchaseReturnNo: result.return_no,
    returnNo: result.return_no,
    vendor: result.vendor_name,
    amount: updates.total_amount || result.total_amount || 0,
    mobile: updates.vendor_mobile || result.vendor_mobile || '',
    state: updates.vendor_state || result.vendor_state || ''
  };
};

export const deletePurchaseReturn = async (id) => {
  const { error } = await supabase.from('purchase_return').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
