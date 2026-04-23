import React, { useEffect, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { getWarehouses } from '../../api/masterApi';
import {
  createTransfer,
  getTransfers,
  updateTransferStatus,
  getTransferSourceWarehouses,
} from '../../api/transferApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightLeft, faPlus } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

const statusOptionsMap = {
  pending: ['pending', 'in_transit', 'completed', 'cancelled'],
  in_transit: ['in_transit', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};

function TransferList() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreateTransfer = isAdmin || hasAnyPermission(['create_transfer'], permissions);
  const canUpdateTransferStatus = isAdmin || hasAnyPermission(['update_transfer_status'], permissions);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sourceWarehouses, setSourceWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    quantity: '',
  });
  const [transferPage, setTransferPage] = useState(1);
  const [transferLimit] = useState(10);

  const loadData = async () => {
    try {
      const [productsRes, warehousesRes, transfersRes] = await Promise.all([
        getProducts({ status: 'active' }),
        getWarehouses({ status: 'active' }),
        getTransfers(),
      ]);

      setProducts(productsRes.data.data || []);
      setWarehouses(Array.isArray(warehousesRes.data) ? warehousesRes.data : []);
      setTransfers(transfersRes.data.data || []);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load transfer data');
      setError(err.response?.data?.error || 'Failed to load transfer data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadSourceWarehouses = async () => {
      if (!formData.productId) {
        setSourceWarehouses([]);
        return;
      }

      try {
        const res = await getTransferSourceWarehouses(formData.productId);
        setSourceWarehouses(Array.isArray(res.data?.data) ? res.data.data : []);

        setFormData((prev) => {
          const stillValid = (res.data?.data || []).some((item) => item.warehouseId === prev.sourceWarehouseId);
          return stillValid ? prev : { ...prev, sourceWarehouseId: '' };
        });
      } catch (err) {
        setSourceWarehouses([]);
        toast.error(err.response?.data?.error || 'Failed to load source warehouses for selected product');
      }
    };

    loadSourceWarehouses();
  }, [formData.productId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreateTransfer) {
      toast.error('You do not have permission to create transfers');
      return;
    }
    try {
      const availableSource = sourceWarehouses.find((warehouse) => warehouse.warehouseId === formData.sourceWarehouseId);
      if (!availableSource) {
        toast.error('Choose a source warehouse that already has this product in stock');
        return;
      }

      if (Number(formData.quantity) > Number(availableSource.quantity || 0)) {
        toast.error('Quantity exceeds stock available in the selected source warehouse');
        return;
      }

      await createTransfer(formData);
      toast.success('Transfer created successfully');
      setFormData({ productId: '', sourceWarehouseId: '', destinationWarehouseId: '', quantity: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create transfer');
      setError(err.response?.data?.error || 'Failed to create transfer');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (!canUpdateTransferStatus) {
      toast.error('You do not have permission to update transfer status');
      return;
    }
    try {
      await updateTransferStatus(id, status);
      toast.success('Transfer status updated successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update transfer status');
      setError(err.response?.data?.error || 'Failed to update transfer status');
    }
  };

  const transferTotalPages = Math.max(1, Math.ceil(transfers.length / transferLimit));
  const paginatedTransfers = transfers.slice((transferPage - 1) * transferLimit, transferPage * transferLimit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faRightLeft} size="sm" className="mr-3" />Transfers</h2>

      {canCreateTransfer && (
      <form onSubmit={handleCreate} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <select
          className="border rounded p-2"
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          required
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>{product.name}</option>
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

        <select
          className="border rounded p-2"
          value={formData.sourceWarehouseId}
          onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
          required
          disabled={!formData.productId}
        >
          <option value="">{formData.productId ? 'Source Warehouse' : 'Select product first'}</option>
          {sourceWarehouses.map((warehouse) => (
            <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
              {warehouse.warehouseName} ({warehouse.quantity})
            </option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={formData.destinationWarehouseId}
          onChange={(e) => setFormData({ ...formData, destinationWarehouseId: e.target.value })}
          required
        >
          <option value="">Destination Warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
          ))}
        </select>

        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded md:col-span-2">
          <FontAwesomeIcon icon={faPlus} size="sm" className="mr-3" />Create Transfer
        </button>
      </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Product</th>
              <th className="border p-2 text-left">Source</th>
              <th className="border p-2 text-left">Destination</th>
              <th className="border p-2 text-left">Qty</th>
              <th className="border p-2 text-left">Requested By</th>
              <th className="border p-2 text-left">Processed By</th>
              <th className="border p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransfers.map((transfer) => (
              <tr key={transfer._id}>
                <td className="border p-2">{transfer.product?.name || '-'}</td>
                <td className="border p-2">{transfer.sourceWarehouse?.name || '-'}</td>
                <td className="border p-2">{transfer.destinationWarehouse?.name || '-'}</td>
                <td className="border p-2">{transfer.quantity}</td>
                <td className="border p-2">
                  {transfer.createdBy
                    ? `${transfer.createdBy.firstName || ''} ${transfer.createdBy.lastName || ''}`.trim() || transfer.createdBy.email
                    : '-'}
                </td>
                <td className="border p-2">
                  {transfer.processedBy
                    ? `${transfer.processedBy.firstName || ''} ${transfer.processedBy.lastName || ''}`.trim() || transfer.processedBy.email
                    : '-'}
                </td>
                <td className="border p-2">
                  {!canUpdateTransferStatus || transfer.status === 'completed' || transfer.status === 'cancelled' ? (
                    <span>{transfer.status}</span>
                  ) : (
                    <select
                      value={transfer.status}
                      onChange={(e) => handleStatusUpdate(transfer._id, e.target.value)}
                      className="border rounded p-1"
                    >
                      {(statusOptionsMap[transfer.status] || [transfer.status]).map((statusValue) => (
                        <option key={`${transfer._id}-${statusValue}`} value={statusValue}>
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
        <Pagination
          page={transferPage}
          totalPages={transferTotalPages}
          onPageChange={setTransferPage}
        />
      </div>
    </div>
  );
}

export default TransferList;
