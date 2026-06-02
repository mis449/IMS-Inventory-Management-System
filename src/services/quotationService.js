const STORAGE_KEY = 'ims_quotations';

export const getQuotations = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createQuotation = async (data) => {
  const allData = await getQuotations();
  const serialNo = allData.length + 1;
  const docNo = `QUOT-${serialNo.toString().padStart(4, '0')}`;
  const newItem = { ...data, id: Date.now(), quotationNo: docNo };
  allData.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return newItem;
};

export const updateQuotation = async (id, updates) => {
  const allData = await getQuotations();
  const index = allData.findIndex(item => String(item.id) === String(id));
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return allData[index];
  }
  return null;
};

export const deleteQuotation = async (id) => {
  const allData = await getQuotations();
  const newData = allData.filter(item => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return true;
};
