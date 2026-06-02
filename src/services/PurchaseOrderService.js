const STORAGE_KEY = 'ims_purchase_orders';

export const getPurchaseOrders = async () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createPurchaseOrder = async (data) => {
  const allData = await getPurchaseOrders();
  const newItem = { ...data, id: Date.now() };
  allData.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return newItem;
};

export const updatePurchaseOrder = async (id, updates) => {
  const allData = await getPurchaseOrders();
  const index = allData.findIndex(item => String(item.id) === String(id));
  if (index !== -1) {
    allData[index] = { ...allData[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    return allData[index];
  }
  return null;
};

export const deletePurchaseOrder = async (id) => {
  const allData = await getPurchaseOrders();
  const newData = allData.filter(item => String(item.id) !== String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return true;
};
