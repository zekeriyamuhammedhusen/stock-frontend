import React, { useEffect, useState } from 'react';
import { createWarehouse, deleteWarehouse, getWarehouses, updateWarehouse, activateWarehouse, deactivateWarehouse } from '../../api/masterApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faPlus, faTrash, faPenToSquare, faXmark, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function WarehousePage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreate = isAdmin || hasAnyPermission(['create_warehouse'], permissions);
  const canUpdate = isAdmin || hasAnyPermission(['update_warehouse'], permissions);
  const canDelete = isAdmin || hasAnyPermission(['delete_warehouse'], permissions);
  const canActivate = isAdmin || hasAnyPermission(['activate_warehouse'], permissions);
  const canDeactivate = isAdmin || hasAnyPermission(['deactivate_warehouse'], permissions);

  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({ name: '', address: '', description: '', status: 'inactive' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = async (pageNumber = page) => {
    try {
      const res = await getWarehouses({ page: pageNumber, limit });
      setWarehouses(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total) || 0);
      setPage(Number(res.data?.page) || pageNumber);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load warehouses');
      setError(err.response?.data?.error || 'Failed to load warehouses');
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((editingId && !canUpdate) || (!editingId && !canCreate)) {
      toast.error('You do not have permission to perform this action');
      return;
    }
    try {
      if (editingId) {
        await updateWarehouse(editingId, formData);
        toast.success('Warehouse updated successfully');
      } else {
        await createWarehouse(formData);
        toast.success('Warehouse created successfully');
      }
      setFormData({ name: '', address: '', description: '', status: 'inactive' });
      setEditingId(null);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} warehouse`);
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} warehouse`);
    }
  };

  const handleEdit = (warehouse) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update warehouses');
      return;
    }
    setFormData({
      name: warehouse.name || '',
      address: warehouse.address || '',
      description: warehouse.description || '',
      status: warehouse.status || 'inactive',
    });
    setEditingId(warehouse._id);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', address: '', description: '', status: 'inactive' });
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete warehouses');
      return;
    }
    try {
      await deleteWarehouse(id);
      toast.success('Warehouse deleted successfully');
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete warehouse');
      setError(err.response?.data?.error || 'Failed to delete warehouse');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if ((currentStatus === 'active' && !canDeactivate) || (currentStatus !== 'active' && !canActivate)) {
      toast.error('You do not have permission to change warehouse status');
      return;
    }
    try {
      if (currentStatus === 'active') {
        await deactivateWarehouse(id);
        toast.success('Warehouse deactivated successfully');
      } else {
        await activateWarehouse(id);
        toast.success('Warehouse activated successfully');
      }
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update warehouse status');
      setError(err.response?.data?.error || 'Failed to update warehouse status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faWarehouse} size="sm" className="mr-3" />Warehouses</h2>

      {(canCreate || (editingId && canUpdate)) && (
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow grid gap-3 md:grid-cols-3">
        <input
          className="border rounded p-2"
          placeholder="Warehouse name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-3">
          <input
            type="checkbox"
            checked={formData.status === 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
          />
          Active
        </label>
        <div className="md:col-span-3 flex gap-2">
          <button className="bg-blue-600 text-white rounded px-4 py-2" type="submit">
            <FontAwesomeIcon icon={editingId ? faPenToSquare : faPlus} size="sm" className="mr-3" />
            {editingId ? 'Update Warehouse' : 'Create Warehouse'}
          </button>
          {editingId && (
            <button
              className="bg-gray-500 text-white rounded px-4 py-2"
              type="button"
              onClick={handleCancelEdit}
            >
              <FontAwesomeIcon icon={faXmark} size="sm" className="mr-3" />Cancel
            </button>
          )}
        </div>
      </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Address</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left action-column-head">Action</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => (
              <tr key={warehouse._id}>
                <td className="border p-2">{warehouse.name}</td>
                <td className="border p-2">{warehouse.address}</td>
                <td className="border p-2">{warehouse.description || '-'}</td>
                <td className="border p-2">{warehouse.status}</td>
                <td className="border p-2 action-column-cell">
                  <div className="action-icons">
                  {canUpdate && (
                  <button
                    className="action-icon-btn action-icon-edit"
                    onClick={() => handleEdit(warehouse)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  )}
                  {canDelete && (
                  <button
                    className="action-icon-btn action-icon-delete"
                    onClick={() => handleDelete(warehouse._id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )}
                  {((warehouse.status === 'active' && canDeactivate) || (warehouse.status !== 'active' && canActivate)) && (
                  <button
                    className={`action-icon-btn ${warehouse.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                    onClick={() => handleToggleStatus(warehouse._id, warehouse.status)}
                    aria-label={warehouse.status === 'active' ? 'Deactivate' : 'Activate'}
                    title={warehouse.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={warehouse.status === 'active' ? faToggleOff : faToggleOn} />
                  </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / limit))}
          onPageChange={setPage}
          label="warehouses"
        />
      </div>
    </div>
  );
}

export default WarehousePage;
