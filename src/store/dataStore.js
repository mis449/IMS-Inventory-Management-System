import { create } from 'zustand';
import { fetchAndMergeInventory } from '../services/api';
import { supabase } from '../lib/supabaseClient';

const useDataStore = create((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  transactions: [],
  inventorySummary: [],

  // Fetch items from the merged API endpoint
  fetchItems: async (force = false) => {
    if (get().items.length > 0 && !force) return;
    
    set({ isLoading: true, error: null });
    try {
      const mergedData = await fetchAndMergeInventory(158000, 165000);
      set({ items: mergedData, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to load catalog data', isLoading: false });
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
