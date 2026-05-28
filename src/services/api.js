// Centralized API Service for IMS (Product Catalog-based)

const KEY_ITEMS = 'PAREKHITM';
const KEY_DETAILS = 'PAREKHITMDET';
const UID = import.meta.env.VITE_API_UID || 'quote';
const UPW = import.meta.env.VITE_API_UPW || '1234';

const getApiUrl = (apiKey) => {
  const base = (import.meta.env.DEV || import.meta.env.VITE_API_BASE_URL !== '/api')
    ? (import.meta.env.VITE_API_BASE_URL || '/api')
    : 'https://parekhgallerium.visualurl.in/URLApi/api';
  return `${base}/UDApi?APIKEY=${apiKey}&UID=${UID}&UPW=${UPW}`;
};

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

/**
 * Fetch master items catalogue (Items API).
 * Querying active range 158000 to 165000 containing exactly 5120 records.
 */
export const fetchItems = async (p1 = 158000, p2 = 165000) => {
  const url = getApiUrl(KEY_ITEMS);
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ P1: Number(p1), P2: Number(p2) })
  });
  return await response.json();
};

/**
 * Fetch item details (Item Details API).
 */
export const fetchItemDetails = async (p1 = 158000, p2 = 165000) => {
  const url = getApiUrl(KEY_DETAILS);
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ P1: Number(p1), P2: Number(p2) })
  });
  return await response.json();
};

/**
 * Fetch items and details concurrently and merge them on `ItmID`.
 * Standardizes key names and ensures default opening qty is 0.
 */
export const fetchAndMergeInventory = async (p1 = 158000, p2 = 165000) => {
  try {
    const [items, details] = await Promise.all([
      fetchItems(p1, p2),
      fetchItemDetails(p1, p2)
    ]);

    const detailsMap = new Map();
    if (Array.isArray(details)) {
      details.forEach(d => {
        if (d && d.ItmID !== undefined) {
          detailsMap.set(String(d.ItmID), d);
        }
      });
    }

    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => {
      const detail = detailsMap.get(String(item.ItmID)) || {};
      
      return {
        ...item,
        ...detail,
        ItmID: item.ItmID,
        ItemCode: item.ItmCd || item.ItemCode || '',
        ItemName: item.ItmNm || item.ItemName || '',
        BrandName: item.ItmBrdNm || item.BrandName || '',
        Category: item.ItmCatNm?.trim() || '',
        Size: item.ItmSize || '',
        Color: item.ItmColor || '',
        UOM: item.ItmQtyUOM || 'PCS',
        HSNCode: item.ItmHSNCd || '',
        Packing: item.ItmStdPking || 1,
        Weight: item.ItmWt || 0,
        Thumbnail: item.ItmThmbnl || '',
        Notes: item.ItmNotes || '',
        MRP: Number(detail.ItmMRP || 0),
        StockQty: Number(detail.ItmStdStkQty || 0),
        DisplayQty: Number(detail.ItmDispQty || 0),
        ReservedQty: Number(detail.ItmRsrvStkQty || 0),
        OpeningQty: 0 // Opening Qty must ALWAYS default to 0
      };
    });
  } catch (error) {
    console.error('Error fetching/merging inventory data:', error);
    throw error;
  }
};
