import { create } from 'zustand';
import { fetchAndMergeInventory } from '../services/api';
import { supabase } from '../lib/supabaseClient';

const useDataStore = create((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  transactions: [],

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

  // Log a new transaction to Supabase (which can be 'Pending' or 'Completed')
  addTransaction: async (txData) => {
    try {
      const typeMapRev = {
        'Purchase': 'purchase',
        'Sales': 'sales',
        'Purchase Return': 'purchase_return',
        'Sales Return': 'sales_return'
      };

      const planned_date = txData.date;
      const actual_date = txData.status === 'Completed' ? txData.date : null;

      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert([{
          transaction_type: typeMapRev[txData.type] || txData.type.toLowerCase(),
          item_code: txData.itemCode,
          item_name: txData.itemName,
          category: txData.category,
          brand: txData.brand,
          unit_price: txData.price,
          qty: txData.qty,
          remarks: txData.remarks,
          planned_date,
          actual_date
        }])
        .select();

      if (error) throw error;
      await get().fetchTransactions();
      return data?.[0];
    } catch (err) {
      console.error('Error logging transaction:', err);
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
