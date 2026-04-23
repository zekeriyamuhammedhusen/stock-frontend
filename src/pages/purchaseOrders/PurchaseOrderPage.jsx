import React, { useEffect, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { getWarehouses } from '../../api/masterApi';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
} from '../../api/purchaseOrderApi';
import { getBankAccounts } from '../../api/bankAccountApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faPlus } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { isAdminRole } from '../../utils/authAccess';

const statusOptionsMap = {
  draft: ['draft', 'ordered', 'received', 'cancelled'],
  ordered: ['ordered', 'received', 'cancelled'],
  received: ['received'],
  cancelled: ['cancelled'],
};

function PurchaseOrderPage() {
  const isAdmin = isAdminRole();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContact: '',
    product: '',
    warehouse: '',
    quantity: '',
    unitCost: '',
    bankAccount: '',
  });

  const loadData = async () => {
    try {
      const [ordersRes, productRes, warehouseRes, accountsRes] = await Promise.all([
        getPurchaseOrders(),
        getProducts({ status: 'active' }),
        getWarehouses({ status: 'active' }),
        getBankAccounts({ status: 'active' }),
      ]);

      setOrders(ordersRes.data?.data || []);
      setProducts(productRes.data?.data || []);
      setWarehouses(Array.isArray(warehouseRes.data) ? warehouseRes.data : []);
      setBankAccounts(accountsRes.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load purchase order data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPurchaseOrder({
        supplierName: formData.supplierName,
        supplierContact: formData.supplierContact,
        items_list: [
          {
            product: formData.product,
            warehouse: formData.warehouse,
            quantity: Number(formData.quantity),
            unitCost: Number(formData.unitCost),
          },
        ],
      });

      toast.success('Purchase order created successfully');
      setFormData({
        supplierName: '',
        supplierContact: '',
        product: '',
        warehouse: '',
        quantity: '',
        unitCost: '',
        bankAccount: '',
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create purchase order');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updatePurchaseOrderStatus(id, {
        status,
        bankAccount: status === 'received' ? formData.bankAccount || undefined : undefined,
      });
      toast.success('Purchase order status updated successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update purchase order status');
    }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / limit));
  const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faFileInvoice} className="mr-2" />Purchase Orders</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <input
          className="border rounded p-2"
          placeholder="Supplier Name"
          value={formData.supplierName}
          onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Supplier Contact"
          value={formData.supplierContact}
          onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
        />
        <select
          className="border rounded p-2"
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>{product.name}</option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={formData.warehouse}
          onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
          required
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
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="border rounded p-2"
          placeholder="Unit Cost"
          value={formData.unitCost}
          onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
          required
        />
        {isAdmin && (
          <select
            className="border rounded p-2"
            value={formData.bankAccount}
            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
          >
            <option value="">Bank Account (optional when marking received)</option>
            {bankAccounts.map((account) => (
              <option key={account._id} value={account._id}>{account.name}</option>
            ))}
          </select>
        )}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Create Purchase Order
        </button>
      </form>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Supplier</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Items</th>
              <th className="border p-2 text-left">Total</th>
              <th className="border p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => (
              <tr key={order._id}>
                <td className="border p-2">{order.supplierName}</td>
                <td className="border p-2">{new Date(order.date).toLocaleString()}</td>
                <td className="border p-2">{order.items_list?.length || 0}</td>
                <td className="border p-2">{order.total_amount}</td>
                <td className="border p-2">
                  {!isAdmin || order.status === 'received' || order.status === 'cancelled' ? (
                    <span>{order.status}</span>
                  ) : (
                    <select
                      className="border rounded p-1"
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    >
                      {(statusOptionsMap[order.status] || [order.status]).map((statusValue) => (
                        <option key={`${order._id}-${statusValue}`} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default PurchaseOrderPage;
