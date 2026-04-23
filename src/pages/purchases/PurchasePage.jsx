import React, { useEffect, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { getWarehouses } from '../../api/masterApi';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
} from '../../api/purchaseOrderApi';
import { getBankAccounts } from '../../api/bankAccountApi';
import { getMe } from '../../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faFileInvoice, faPlus } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

const statusOptionsMap = {
  draft: ['draft', 'ordered', 'received', 'cancelled'],
  ordered: ['ordered', 'received', 'cancelled'],
  received: ['received'],
  cancelled: ['cancelled'],
};

function PurchasePage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canViewPurchaseOrders = isAdmin || hasAnyPermission(['view_purchase_order'], permissions);
  const canCreatePurchaseOrders = isAdmin || hasAnyPermission(['create_purchase_order'], permissions);
  const canUpdatePurchaseOrderStatus = isAdmin || hasAnyPermission(['update_purchase_order_status'], permissions);
  const canViewBankAccounts = isAdmin || hasAnyPermission(['view_bank_account'], permissions);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit] = useState(10);

  const [orderForm, setOrderForm] = useState({
    purchaserName: '',
    supplierName: '',
    supplierContact: '',
    product: '',
    warehouse: '',
    quantity: '',
    unitCost: '',
    bankAccount: '',
  });

  const [receiveBankAccounts, setReceiveBankAccounts] = useState({});

  const findBankAccountById = (accountId) =>
    bankAccounts.find((account) => String(account._id) === String(accountId));

  const getOrderAmount = (order) => Number(order?.total_amount || 0);

  const loadData = async () => {
    const shouldLoadCatalog = canCreatePurchaseOrders;

    try {
      if (shouldLoadCatalog) {
        const [productRes, warehouseRes] = await Promise.all([
          getProducts({ status: 'active' }),
          getWarehouses({ status: 'active' }),
        ]);

        const productsData = productRes.data.data || [];
        const warehousesData = Array.isArray(warehouseRes.data) ? warehouseRes.data : [];
        setProducts(productsData);
        setWarehouses(warehousesData);
      }

      if (canViewPurchaseOrders) {
        const ordersRes = await getPurchaseOrders();
        const ordersData = ordersRes.data.data || [];
        setOrders(ordersData);
        setReceiveBankAccounts(
          ordersData.reduce((acc, order) => {
            if (order?.bankAccount?._id) {
              acc[order._id] = order.bankAccount._id;
            }
            return acc;
          }, {})
        );
      }

      if (canViewBankAccounts && (canCreatePurchaseOrders || canUpdatePurchaseOrderStatus)) {
        const accountsRes = await getBankAccounts({ status: 'active' });
        setBankAccounts(accountsRes.data?.data || []);
      }

      setError('');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load purchases data';
      toast.error(message);
      setError(message);
    }
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const meRes = await getMe();
        const me = meRes.data || {};
        const fullName = `${me.firstName || ''} ${me.lastName || ''}`.trim();
        const fallbackName = fullName || me.email || '';
        setOrderForm((prev) => ({ ...prev, purchaserName: fallbackName }));
      } catch {
        setOrderForm((prev) => ({ ...prev, purchaserName: '' }));
      }
    };

    loadCurrentUser();
    loadData();
  }, []);

  const handleOrderProductChange = (productId) => {
    const selectedProduct = products.find((product) => product._id === productId);
    setOrderForm((prev) => ({
      ...prev,
      product: productId,
      unitCost: selectedProduct ? String(selectedProduct.costPrice ?? 0) : '',
    }));
  };

  const handleCreatePurchaseOrder = async (e) => {
    e.preventDefault();
    try {
      await createPurchaseOrder({
        supplierName: orderForm.supplierName,
        supplierContact: orderForm.supplierContact,
        bankAccount: orderForm.bankAccount || undefined,
        items_list: [
          {
            product: orderForm.product,
            warehouse: orderForm.warehouse,
            quantity: Number(orderForm.quantity),
            unitCost: Number(orderForm.unitCost),
          },
        ],
      });

      toast.success('Purchase order created successfully');
      setOrderForm((prev) => ({
        ...prev,
        supplierContact: '',
        product: '',
        warehouse: '',
        quantity: '',
        unitCost: '',
        bankAccount: '',
        supplierName: '',
      }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create purchase order');
      setError(err.response?.data?.error || 'Failed to create purchase order');
    }
  };

  const handleStatusUpdate = async (id, status, currentStatus) => {
    const bankAccountForOrder = receiveBankAccounts[id] || '';

    if (status === 'received' && currentStatus !== 'received' && canViewBankAccounts && !bankAccountForOrder) {
      toast.error('Please select a bank account before marking this order as received');
      return;
    }

    if (status === 'received' && currentStatus !== 'received' && bankAccountForOrder) {
      const selectedAccount = findBankAccountById(bankAccountForOrder);
      const order = orders.find((entry) => entry._id === id);
      const requiredAmount = getOrderAmount(order);

      if (!selectedAccount) {
        toast.error('Selected bank account not found');
        return;
      }

      if (selectedAccount.status !== 'active') {
        toast.error('Selected bank account is inactive');
        return;
      }

      if (Number(selectedAccount.balance || 0) < requiredAmount) {
        toast.error(
          `Insufficient balance. Required: ${requiredAmount.toFixed(2)}, Available: ${Number(selectedAccount.balance || 0).toFixed(2)}`
        );
        return;
      }
    }

    try {
      await updatePurchaseOrderStatus(id, {
        status,
        bankAccount: status === 'received' ? bankAccountForOrder : undefined,
      });

      if (status === 'received') {
        toast.success('Purchase order received, stock updated, and bank transaction posted');
      } else {
        toast.success('Purchase order status updated successfully');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update purchase order status');
      setError(err.response?.data?.error || 'Failed to update purchase order status');
    }
  };

  const orderTotalPages = Math.max(1, Math.ceil(orders.length / orderLimit));
  const paginatedOrders = orders.slice((orderPage - 1) * orderLimit, orderPage * orderLimit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">
        <FontAwesomeIcon icon={faCartShopping} size="sm" className="mr-3" />
        Purchase Orders
      </h2>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canCreatePurchaseOrders && (
        <section className="bg-white rounded shadow p-4 space-y-3">
          <h3 className="text-lg font-semibold">
            <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />Create Purchase Order
          </h3>
          <form onSubmit={handleCreatePurchaseOrder} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchaser Name</label>
              <input
                className="border rounded p-2 w-full bg-gray-50"
                placeholder="Logged in purchaser"
                value={orderForm.purchaserName}
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                className="border rounded p-2 w-full"
                placeholder="Enter supplier name"
                value={orderForm.supplierName}
                onChange={(e) => setOrderForm({ ...orderForm, supplierName: e.target.value })}
                required
              />
            </div>
            <input
              className="border rounded p-2"
              placeholder="Supplier Contact"
              value={orderForm.supplierContact}
              onChange={(e) => setOrderForm({ ...orderForm, supplierContact: e.target.value })}
            />

            <select
              className="border rounded p-2"
              value={orderForm.product}
              onChange={(e) => handleOrderProductChange(e.target.value)}
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>

            <select
              className="border rounded p-2"
              value={orderForm.warehouse}
              onChange={(e) => setOrderForm({ ...orderForm, warehouse: e.target.value })}
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
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              className="border rounded p-2"
              placeholder="Unit Cost"
              value={orderForm.unitCost}
              onChange={(e) => setOrderForm({ ...orderForm, unitCost: e.target.value })}
              required
            />

            {canViewBankAccounts && (
              <select
                className="border rounded p-2"
                value={orderForm.bankAccount}
                onChange={(e) => setOrderForm({ ...orderForm, bankAccount: e.target.value })}
              >
                <option value="">Select Bank Account (used when receiving)</option>
                {bankAccounts.map((account) => (
                  <option key={account._id} value={account._id}>{account.name}</option>
                ))}
              </select>
            )}

            <button className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2" type="submit">
              <FontAwesomeIcon icon={faPlus} size="sm" className="mr-3" />Create Purchase Order
            </button>
          </form>
        </section>
      )}

      {canViewPurchaseOrders && (
        <section className="bg-white rounded shadow overflow-auto">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Purchase Order History</h3>
          </div>
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
                    {!canUpdatePurchaseOrderStatus || order.status === 'received' || order.status === 'cancelled' ? (
                      <span>{order.status}</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {canViewBankAccounts && (
                          <div>
                            <select
                              className="border rounded p-1"
                              value={receiveBankAccounts[order._id] || ''}
                              onChange={(e) =>
                                setReceiveBankAccounts((prev) => ({
                                  ...prev,
                                  [order._id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Bank Account for Receive</option>
                              {bankAccounts.map((account) => (
                                <option key={account._id} value={account._id}>{account.name}</option>
                              ))}
                            </select>
                            {receiveBankAccounts[order._id] && (() => {
                              const selected = findBankAccountById(receiveBankAccounts[order._id]);
                              if (!selected) return null;

                              const requiredAmount = getOrderAmount(order);
                              const hasEnough = Number(selected.balance || 0) >= requiredAmount;

                              return (
                                <p className={`mt-1 text-xs ${hasEnough ? 'text-green-700' : 'text-red-600'}`}>
                                  Required: {requiredAmount.toFixed(2)} | Available: {Number(selected.balance || 0).toFixed(2)}
                                </p>
                              );
                            })()}
                          </div>
                        )}
                        <select
                          className="border rounded p-1"
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value, order.status)}
                        >
                          {(statusOptionsMap[order.status] || [order.status]).map((statusValue) => (
                            <option key={`${order._id}-${statusValue}`} value={statusValue}>
                              {statusValue}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={setOrderPage} />
        </section>
      )}
    </div>
  );
}

export default PurchasePage;
