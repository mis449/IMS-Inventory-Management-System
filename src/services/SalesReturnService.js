const STORAGE_KEY = 'ims_sales_returns';

export const getSalesReturns = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createSalesReturn = async (data) => {
  const allData = await getSalesReturns();
  const serialNo = allData.length + 1;
  const docNo = `SR-${serialNo.toString().padStart(4, '0')}`;
  const newItem = { ...data, id: Date.now(), SalesReturnNo: docNo };
  allData.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return newItem;
};

export const updateSalesReturn = async (id, updates) => {
  const allData = await getSalesReturns();
  const index = allData.findIndex(item => String(item.id) === String(id));
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return allData[index];
  }
  return null;
};

export const deleteSalesReturn = async (id) => {
  const allData = await getSalesReturns();
  const newData = allData.filter(item => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return true;
};
