import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const useDataStore = create((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  transactions: [],
  inventorySummary: [],
  customers: [],
  vendors: [],

  // Fetch customers from Supabase
  fetchCustomers: async () => {
    try {
      const { data, error } = await supabase.from('customer').select('*');
      if (error) throw error;
      
      if (data) {
        let customersData = data.map(c => ({
          id: c.id,
          name: c.name,
          title: c.title,
          firstName: c.first_name,
          lastName: c.last_name,
          mobile: c.mobile,
          company: c.company,
          salesPerson: c.sales_person,
          gstin: c.gstin,
          gstTreatment: c.gst_treatment,
          pan: c.pan,
          gstType: c.gst_type,
          address: c.address,
          priceList: c.price_list,
          areaPinCode: c.area_pin_code,
          cityState: c.city_state,
          email: c.email
        }));
        
        // Filter out dummy default customers if they have no other data attached
        const dummyNames = ['Individual', 'Corporate', 'Walk-in Customer'];
        customersData = customersData.filter(c => {
           if (dummyNames.includes(c.name)) {
              return Object.keys(c).length > 2; // Keep if user added address/mobile (ignoring id and name)
           }
           return true;
        });
        
        set({ customers: customersData });
      } else {
        set({ customers: [] });
      }
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  },

  // Fetch vendors from Supabase
  fetchVendors: async () => {
    try {
      const { data, error } = await supabase.from('vendor').select('*');
      if (error) throw error;
      
      if (data) {
        let vendorsData = data.map(v => ({
          id: v.id,
          name: v.name,
          title: v.title,
          firstName: v.first_name,
          lastName: v.last_name,
          mobile: v.mobile,
          company: v.company,
          salesPerson: v.sales_person,
          gstin: v.gstin,
          gstTreatment: v.gst_treatment,
          pan: v.pan,
          gstType: v.gst_type,
          address: v.address,
          priceList: v.price_list,
          areaPinCode: v.area_pin_code,
          cityState: v.city_state,
          email: v.email
        }));
        set({ vendors: vendorsData });
      } else {
        set({ vendors: [] });
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
    }
  },

  // Add a new customer to Supabase
  addCustomer: async (customerData) => {
    if (!customerData) return;
    const custName = customerData.company || customerData.customer || customerData.name || 'New Customer';
    
    const newCustomer = {
      name: custName,
      title: customerData.title || '',
      first_name: customerData.firstName || customerData.first_name || '',
      last_name: customerData.lastName || customerData.last_name || '',
      mobile: customerData.mobile || '',
      company: customerData.company || '',
      sales_person: customerData.salesPerson || customerData.sales_person || '',
      gstin: customerData.gstin || '',
      gst_treatment: customerData.gstTreatment || customerData.gst_treatment || '',
      pan: customerData.pan || '',
      gst_type: customerData.gstType || customerData.gst_type || '',
      address: customerData.address || '',
      price_list: customerData.priceList || customerData.price_list || '',
      area_pin_code: customerData.areaPinCode || customerData.area_pin_code || '',
      city_state: customerData.cityState || customerData.city_state || '',
      email: customerData.email || ''
    };

    try {
      // Check if exists
      const current = get().customers;
      const existing = current.find(c => c.name === custName);
      
      if (existing && existing.id) {
        await supabase.from('customer').update(newCustomer).eq('id', existing.id);
      } else {
        newCustomer.id = String(Date.now());
        await supabase.from('customer').insert([newCustomer]);
      }
      
      // Refresh list
      get().fetchCustomers();
    } catch (e) {
      console.error('Error saving customer:', e);
    }
  },

  // Add a new vendor to Supabase
  addVendor: async (vendorData) => {
    if (!vendorData) return;
    const vendorName = vendorData.company || vendorData.vendorName || vendorData.name || 'New Vendor';
    
    const newVendor = {
      name: vendorName,
      title: vendorData.title || '',
      first_name: vendorData.firstName || vendorData.first_name || '',
      last_name: vendorData.lastName || vendorData.last_name || '',
      mobile: vendorData.mobile || '',
      company: vendorData.company || '',
      sales_person: vendorData.salesPerson || vendorData.sales_person || '',
      gstin: vendorData.gstin || '',
      gst_treatment: vendorData.gstTreatment || vendorData.gst_treatment || '',
      pan: vendorData.pan || '',
      gst_type: vendorData.gstType || vendorData.gst_type || '',
      address: vendorData.address || '',
      price_list: vendorData.priceList || vendorData.price_list || '',
      area_pin_code: vendorData.areaPinCode || vendorData.area_pin_code || '',
      city_state: vendorData.cityState || vendorData.city_state || '',
      email: vendorData.email || ''
    };

    try {
      const current = get().vendors;
      const existing = current.find(v => v.name === vendorName);
      
      if (existing && existing.id) {
        await supabase.from('vendor').update(newVendor).eq('id', existing.id);
      } else {
        newVendor.id = String(Date.now());
        await supabase.from('vendor').insert([newVendor]);
      }
      
      // Refresh list
      get().fetchVendors();
    } catch (e) {
      console.error('Error saving vendor:', e);
    }
  },

  // Add a new item to Supabase item table
  addNewItem: async (itemData) => {
    try {
      const payload = {
        ItemCode: itemData.ItemCode,
        ItemName: itemData.ItemName,
        ITMBrandName: itemData.BrandName,
        ItmQtyRate: Number(itemData.MRP) || 0,
        product_image_url: itemData.ImageURL || null
      };
      
      // Attempt to save to Supabase
      const { data, error } = await supabase.from('item').insert([payload]).select();
      if (error) throw error;
      
      // Update local state directly to save time (avoid fetching 20,000 items again)
      const newItem = data[0];
      const formattedItem = {
        ...newItem,
        ItmID: newItem.id,
        ItemCode: newItem.ItemCode,
        ItemName: newItem.ItemName,
        BrandName: newItem.ITMBrandName || '',
        MRP: Number(newItem.ItmQtyRate) || 0,
        Thumbnail: newItem.product_image_url || null,
      };
      set({ items: [formattedItem, ...get().items] });

      return { success: true, data };
    } catch (e) {
      console.error('Error adding new item:', e);
      return { success: false, error: e.message || 'Failed to add item' };
    }
  },

  // Update an existing item in Supabase
  updateItem: async (id, itemData) => {
    try {
      const payload = {
        ItemCode: itemData.ItemCode,
        ItemName: itemData.ItemName,
        ITMBrandName: itemData.BrandName,
        ItmQtyRate: Number(itemData.MRP) || 0,
        product_image_url: itemData.ImageURL || null
      };
      
      const { data, error } = await supabase.from('item').update(payload).eq('id', id).select();
      if (error) throw error;
      
      // Update local state directly
      if (data && data.length > 0) {
        const updatedItem = data[0];
        const updatedItemsList = get().items.map(item => {
          if (item.ItmID === id || item.id === id) {
            return {
              ...item,
              ItemCode: updatedItem.ItemCode,
              ItemName: updatedItem.ItemName,
              BrandName: updatedItem.ITMBrandName || '',
              MRP: Number(updatedItem.ItmQtyRate) || 0,
              Thumbnail: updatedItem.product_image_url || null,
            };
          }
          return item;
        });
        set({ items: updatedItemsList });
      }

      return { success: true, data };
    } catch (e) {
      console.error('Error updating item:', e);
      return { success: false, error: e.message || 'Failed to update item' };
    }
  },

  // Fetch items from the Supabase item table
  fetchItems: async (force = false) => {
    if (get().items.length > 0 && !force) return;
    
    set({ isLoading: true, error: null });
    try {
      let allData = [];
      let fetchMore = true;
      let from = 0;
      const step = 1000;

      while (fetchMore) {
        const { data, error } = await supabase
          .from('item')
          .select('*')
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += step;
        }

        if (!data || data.length < step) {
          fetchMore = false;
        }
      }

      console.log(`Total records fetched from item table: ${allData.length}`);

      if (allData.length === 0) {
        set({ items: [], isLoading: false });
        return;
      }

      const itemsData = allData.map(item => ({
        ...item,
        ItmID: item.ItmID || item.id || '',
        ItemCode: item.ItmCd || item.ItemCode || item.item_code || '',
        ItemName: item.ItmNm || item.ItemName || item.item_name || '',
        BrandName: item.ItmBrdNm || item.ITMBrandName || item.BrandName || item.brand_name || item.brand || '',
        Category: item.ItmCatNm?.trim() || item.Category || item.category || '',
        Size: item.ItmSize || item.Size || item.size || '',
        Color: item.ItmColor || item.Color || item.color || '',
        UOM: item.ItmQtyUOM || item.UOM || item.uom || 'PCS',
        HSNCode: item.ItmHSNCd || item.HSNCode || item.hsn_code || '',
        Packing: item.ItmStdPking || item.Packing || item.packing || 1,
        Weight: item.ItmWt || item.Weight || item.weight || 0,
        Thumbnail: item.product_image_url || item.ItmThmbnl || item.Thumbnail || item.thumbnail || '',
        Notes: item.ItmNotes || item.Notes || item.notes || '',
        MRP: Number(item.ItmQtyRate || item.ItmMRP || item.MRP || item.mrp || item.price || 0),
        StockQty: Number(item.ItmStdStkQty || item.StockQty || item.stock_qty || 0),
        DisplayQty: Number(item.ItmDispQty || item.DisplayQty || item.display_qty || 0),
        ReservedQty: Number(item.ItmRsrvStkQty || item.ReservedQty || item.reserved_qty || 0),
        OpeningQty: Number(item.OpeningQty || item.opening_qty || 0)
      }));

      const totoCount = itemsData.filter(i => (i.BrandName || '').toUpperCase() === 'TOTO').length;
      console.log(`Total TOTO brand records fetched: ${totoCount}`);
      console.log(`Total records displayed after filtering (total items in state): ${itemsData.length}`);

      set({ items: itemsData, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to load catalog data from Supabase', isLoading: false });
    }
  },

  // Fetch inventory summary (for opening qty auto-population)
  fetchInventorySummary: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_summary')
        .select('*');
      if (error) throw error;
      set({ inventorySummary: data || [] });
    } catch (err) {
      console.error('Error fetching inventory summary:', err);
    }
  },

  // Fetch all transactions from Supabase
  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typeMap = {
        'purchase': 'Purchase',
        'sales': 'Sales',
        'purchase_return': 'Purchase Return',
        'sales_return': 'Sales Return'
      };

      const mapped = (data || []).map(row => ({
        id: row.id,
        serialNo: row.serial_no,
        date: row.actual_date || row.planned_date,
        type: typeMap[row.transaction_type] || row.transaction_type,
        itemCode: row.item_code,
        itemName: row.item_name,
        category: row.category,
        brand: row.brand,
        vendorName: row.vendor_name || '',
        price: Number(row.unit_price || 0),
        qty: row.qty,
        totalPrice: Number(row.total_price || 0),
        remarks: row.remarks,
        status: row.actual_date ? 'Completed' : 'Pending'
      }));

      set({ transactions: mapped, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Log one or multiple new transactions to Supabase
  addTransaction: async (txData) => {
    try {
      const typeMapRev = {
        'Purchase': 'purchase',
        'Sales': 'sales',
        'Purchase Return': 'purchase_return',
        'Sales Return': 'sales_return'
      };

      const isArray = Array.isArray(txData);
      const dataArray = isArray ? txData : [txData];

      const payload = dataArray.map(tx => {
        const planned_date = tx.date;
        const actual_date = tx.status === 'Completed' ? tx.date : null;
        return {
          transaction_type: typeMapRev[tx.type] || tx.type.toLowerCase(),
          item_code: tx.itemCode,
          item_name: tx.itemName,
          category: tx.category,
          brand: tx.brand,
          vendor_name: tx.vendorName,
          unit_price: tx.price,
          qty: tx.qty,
          remarks: tx.remarks,
          planned_date,
          actual_date
        };
      });

      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert(payload)
        .select();

      if (error) throw error;
      await get().fetchTransactions();
      return isArray ? data : data?.[0];
    } catch (err) {
      console.error('Error logging transaction:', err);
      throw err;
    }
  },

  // Remove a transaction from Supabase
  removeTransaction: async (txId) => {
    try {
      const { error } = await supabase
        .from('inventory_transactions')
        .delete()
        .eq('id', txId);

      if (error) throw error;
      await get().fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  },

  // Update a transaction (e.g. approve a pending transaction)
  updateTransaction: async (txId, updatedData) => {
    try {
      let updatePayload = {};
      if (updatedData.status === 'Completed') {
        const currentTx = get().transactions.find(t => t.id === txId);
        const dateToUse = currentTx?.date || new Date().toISOString().split('T')[0];
        updatePayload.actual_date = dateToUse;
      }

      const { error } = await supabase
        .from('inventory_transactions')
        .update(updatePayload)
        .eq('id', txId);

      if (error) throw error;
      await get().fetchTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
    }
  }
}));

export default useDataStore;
