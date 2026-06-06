import { supabase } from '../supabaseClient';

export const getSalesReturns = async () => {
  const { data, error } = await supabase.from('scales_return').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching sales returns:", error);
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
      SalesReturnNo: item.return_no,
      customerName: item.customer_name,
      date: item.date,
      status: item.status,
      details: details,
      state: state,
      mobileNumber: basic.mobile || other.mobile || '-',
      salesPerson: other.salesPerson || 'Admin',
      totalAmount: sum.totalAmount || 0
    };
  });
};

export const createSalesReturn = async (data) => {
  const { data: lastRecord } = await supabase.from('scales_return').select('return_no').order('created_at', { ascending: false }).limit(1);
  let nextNum = 1;
  if (lastRecord && lastRecord.length > 0 && lastRecord[0].return_no) {
    const match = lastRecord[0].return_no.match(/\d+$/);
    if (match) nextNum = parseInt(match[0], 10) + 1;
  }
  const docNo = `SR-${String(nextNum).padStart(4, '0')}`;
  
  const insertData = {
    id: String(Date.now()),
    return_no: docNo,
    customer_name: data.customerName || data.customer || data.details?.basicInfo?.customer || '',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Active',
    details: data.details || data
  };

  const { data: result, error } = await supabase.from('scales_return').insert([insertData]).select().single();
  if (error) throw error;
  
  return { ...data, id: result.id, SalesReturnNo: result.return_no };
};

export const updateSalesReturn = async (id, updates) => {
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.customerName || updates.customer) updateData.customer_name = updates.customerName || updates.customer;
  if (updates.details) updateData.details = updates.details;
  
  if (Object.keys(updateData).length === 0) updateData.details = updates;

  const { data: result, error } = await supabase
    .from('scales_return')
    .update(updateData)
    .eq('id', String(id))
    .select()
    .single();
    
  if (error) throw error;
  return { ...updates, id: result.id, SalesReturnNo: result.return_no };
};

export const deleteSalesReturn = async (id) => {
  const { error } = await supabase.from('scales_return').delete().eq('id', String(id));
  if (error) throw error;
  return true;
};
