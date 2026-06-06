import { supabase } from '../supabaseClient';

export const getQuotations = async () => {
  const { data, error } = await supabase.from('quotation').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching quotations:", error);
    return [];
  }
  return data.map(item => {
    const details = item.details || {};
    const basic = details.basicInfo || {};
    const other = details.otherInfo || {};
    const sum = details.summary || {};
    
    let state = '-';
    if (basic.cityState) {
       state = basic.cityState.includes('/') ? basic.cityState.split('/')[1]?.trim() : basic.cityState;
    } else if (other.state) {
       state = other.state;
    }

    return {
      ...details,
      id: item.id,
      quotationNo: item.quotation_no,
      customerName: item.customer_name,
      date: item.date,
      status: item.status,
      supplyStatus: item.supply_status,
      details: details,
      state: state,
      mobileNumber: basic.mobile || other.mobile || '-',
      salesPerson: other.salesPerson || 'Admin',
      totalAmount: sum.totalAmount || 0
    };
  });
};

export const createQuotation = async (data) => {
  const { data: lastRecord } = await supabase.from('quotation').select('quotation_no').order('created_at', { ascending: false }).limit(1);
  let nextNum = 1;
  if (lastRecord && lastRecord.length > 0 && lastRecord[0].quotation_no) {
    const match = lastRecord[0].quotation_no.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }
  const docNo = `QUOT-${String(nextNum).padStart(4, '0')}`;
  
  const insertData = {
    id: String(Date.now()),
    quotation_no: docNo,
    customer_name: data.customerName || data.customer || data.details?.basicInfo?.customer || '',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    supply_status: data.supplyStatus || '-',
    details: data.details || data
  };

  const { data: result, error } = await supabase.from('quotation').insert([insertData]).select().single();
  if (error) throw error;
  
  return { ...data, id: result.id, quotationNo: result.quotation_no };
};

export const updateQuotation = async (id, updates) => {
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.supplyStatus) updateData.supply_status = updates.supplyStatus;
  if (updates.customerName || updates.customer) updateData.customer_name = updates.customerName || updates.customer;
  if (updates.details) updateData.details = updates.details;
  
  if (Object.keys(updateData).length === 0) updateData.details = updates;

  const { data: result, error } = await supabase
    .from('quotation')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  return { ...updates, id: result.id, quotationNo: result.quotation_no };
};

export const deleteQuotation = async (id) => {
  const { error } = await supabase.from('quotation').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
