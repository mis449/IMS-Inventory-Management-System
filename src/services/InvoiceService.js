const STORAGE_KEY = 'ims_invoices';

export const getInvoices = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createInvoice = async (data) => {
  const allData = await getInvoices();
  const serialNo = allData.length + 1;
  const docNo = `INV-${serialNo.toString().padStart(4, '0')}`;
  const newItem = { ...data, id: Date.now(), invoiceNo: docNo };
  allData.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return newItem;
};

export const updateInvoice = async (id, updates) => {
  const allData = await getInvoices();
  const index = allData.findIndex(item => String(item.id) === String(id));
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return allData[index];
  }
  return null;
};

export const deleteInvoice = async (id) => {
  const allData = await getInvoices();
  const newData = allData.filter(item => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return true;
};
