const STORAGE_KEY = 'ims_purchase_returns';

export const getPurchaseReturns = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createPurchaseReturn = async (data) => {
  const allData = await getPurchaseReturns();
  const newItem = { ...data, id: Date.now() };
  allData.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return newItem;
};

export const updatePurchaseReturn = async (id, updates) => {
  const allData = await getPurchaseReturns();
  const index = allData.findIndex(item => String(item.id) === String(id));
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return allData[index];
  }
  return null;
};

export const deletePurchaseReturn = async (id) => {
  const allData = await getPurchaseReturns();
  const newData = allData.filter(item => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return true;
};
