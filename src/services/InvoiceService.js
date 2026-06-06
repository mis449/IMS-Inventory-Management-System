import { supabase } from '../supabaseClient';

export const getInvoices = async () => {
  const { data, error } = await supabase.from('invoice').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching invoices:", error);
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
      invoiceNo: item.invoice_no,
      customerName: item.customer_name,
      date: item.date,
      status: item.status,
      paymentStatus: item.payment_status,
      details: details,
      state: state,
      mobileNumber: basic.mobile || other.mobile || '-',
      salesPerson: other.salesPerson || 'Admin',
      totalAmount: sum.totalAmount || 0
    };
  });
};

export const createInvoice = async (data) => {
  const { data: lastRecord } = await supabase.from('invoice').select('invoice_no').order('created_at', { ascending: false }).limit(1);
  let nextNum = 1;
  if (lastRecord && lastRecord.length > 0 && lastRecord[0].invoice_no) {
    const match = lastRecord[0].invoice_no.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }
  const docNo = `INV-${String(nextNum).padStart(4, '0')}`;
  
  const insertData = {
    id: String(Date.now()),
    invoice_no: docNo,
    customer_name: data.customerName || data.customer || data.details?.basicInfo?.customer || '',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    payment_status: data.paymentStatus || '-',
    details: data.details || data
  };

  const { data: result, error } = await supabase.from('invoice').insert([insertData]).select().single();
  if (error) throw error;
  
  return { ...data, id: result.id, invoiceNo: result.invoice_no };
};

export const updateInvoice = async (id, updates) => {
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.paymentStatus) updateData.payment_status = updates.paymentStatus;
  if (updates.customerName || updates.customer) updateData.customer_name = updates.customerName || updates.customer;
  if (updates.details) updateData.details = updates.details;
  
  if (Object.keys(updateData).length === 0) updateData.details = updates;

  const { data: result, error } = await supabase
    .from('invoice')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  return { ...updates, id: result.id, invoiceNo: result.invoice_no };
};

export const deleteInvoice = async (id) => {
  const { error } = await supabase.from('invoice').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
