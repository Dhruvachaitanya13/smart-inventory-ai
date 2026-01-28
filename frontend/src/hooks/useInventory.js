import { useState, useEffect, useCallback } from 'react';
import { InventoryService } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Custom Hook: useInventory
 * Centralizes the logic for fetching, caching, and managing inventory state.
 * * @returns {Object} { products, loading, error, refresh, stats }
 */
export const useInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, totalValue: 0 });

  // UseCallback prevents this function from being recreated on every render
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    // Optional: Add a minimum loading time to prevent flickering on fast networks
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 500));

    try {
      const [response] = await Promise.all([InventoryService.getAll(), minLoadTime]);
      
      const data = response.data.data || [];
      setProducts(data);
      
      // Calculate Stats on the fly
      const lowStockCount = data.filter(p => p.quantity < 10).length;
      const totalVal = data.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      
      setStats({
        total: data.length,
        lowStock: lowStockCount,
        totalValue: totalVal
      });

      setError(null);
    } catch (err) {
      console.error("Inventory Fetch Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to load inventory.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    error, 
    stats,
    refresh: fetchProducts 
  };
};