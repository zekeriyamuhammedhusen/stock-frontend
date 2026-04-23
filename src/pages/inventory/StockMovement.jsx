import React, { useEffect, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { getWarehouses } from '../../api/masterApi';
import { getInventory, stockIn, stockOut } from '../../api/stockApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function StockMovement() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canStockIn = isAdmin || hasAnyPermission(['create_stock_in'], permissions);
  const canStockOut = isAdmin || hasAnyPermission(['create_stock_out'], permissions);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ productId: '', warehouseId: '', quantity: '' });
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit] = useState(10);

  const loadData = async () => {
    try {
      const [productsRes, warehousesRes, inventoryRes] = await Promise.all([
        getProducts({ status: 'active' }),
        getWarehouses({ status: 'active' }),
        getInventory(),
      ]);

      setProducts(productsRes.data.data || []);
      setWarehouses(Array.isArray(warehousesRes.data) ? warehousesRes.data : []);
      setInventory(inventoryRes.data.data || []);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load stock data');
      setError(err.response?.data?.error || 'Failed to load stock data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (type) => {
    if ((type === 'in' && !canStockIn) || (type === 'out' && !canStockOut)) {
      toast.error('You do not have permission to perform this stock action');
      return;
    }
    try {
      const response = type === 'in' ? await stockIn(formData) : await stockOut(formData);
      if (response?.status === 202 || response?.data?.status === 'pending_approval') {
        toast.info(response?.data?.message || `Stock ${type} request sent for admin approval`);
      } else {
        toast.success(`Stock ${type} completed successfully`);
        loadData();
      }
      setFormData({ productId: '', warehouseId: '', quantity: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || `Stock ${type} failed`);
      setError(err.response?.data?.error || `Stock ${type} failed`);
    }
  };

  const inventoryTotalPages = Math.max(1, Math.ceil(inventory.length / inventoryLimit));
  const paginatedInventory = inventory.slice((inventoryPage - 1) * inventoryLimit, inventoryPage * inventoryLimit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faWarehouse} size="sm" className="mr-3" />Stock In / Out</h2>

      <div className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-3">
        <select
          className="border rounded p-2"
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>{product.name}</option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={formData.warehouseId}
          onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
        >
          <option value="">Select Warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
          ))}
        </select>

        <input
          type="number"
          min="0.0001"
          step="0.0001"
          className="border rounded p-2"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
        />

        {canStockIn && (
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => handleSubmit('in')}>
          <FontAwesomeIcon icon={faArrowDown} size="sm" className="mr-3" />Stock In
        </button>
        )}
        {canStockOut && (
        <button className="bg-orange-600 text-white px-4 py-2 rounded" onClick={() => handleSubmit('out')}>
          <FontAwesomeIcon icon={faArrowUp} size="sm" className="mr-3" />Stock Out
        </button>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Product</th>
              <th className="border p-2 text-left">Warehouse</th>
              <th className="border p-2 text-left">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInventory.map((item) => (
              <tr key={item._id}>
                <td className="border p-2">{item.product?.name || '-'}</td>
                <td className="border p-2">{item.warehouse?.name || '-'}</td>
                <td className="border p-2">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={inventoryPage}
          totalPages={inventoryTotalPages}
          onPageChange={setInventoryPage}
        />
      </div>
    </div>
  );
}

export default StockMovement;
