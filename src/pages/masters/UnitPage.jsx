import React, { useEffect, useState } from 'react';
import { createUnit, deleteUnit, getUnits, updateUnit, activateUnit, deactivateUnit } from '../../api/masterApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faPlus, faTrash, faPenToSquare, faXmark, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function UnitPage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreate = isAdmin || hasAnyPermission(['create_unit'], permissions);
  const canUpdate = isAdmin || hasAnyPermission(['update_unit'], permissions);
  const canDelete = isAdmin || hasAnyPermission(['delete_unit'], permissions);
  const canActivate = isAdmin || hasAnyPermission(['activate_unit'], permissions);
  const canDeactivate = isAdmin || hasAnyPermission(['deactivate_unit'], permissions);

  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({ name: '', abbreviation: '', status: 'inactive' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = async (pageNumber = page) => {
    try {
      const res = await getUnits({ page: pageNumber, limit });
      setUnits(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total) || 0);
      setPage(Number(res.data?.page) || pageNumber);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load units');
      setError(err.response?.data?.error || 'Failed to load units');
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
        await updateUnit(editingId, formData);
        toast.success('Unit updated successfully');
      } else {
        await createUnit(formData);
        toast.success('Unit created successfully');
      }
      setFormData({ name: '', abbreviation: '', status: 'inactive' });
      setEditingId(null);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} unit`);
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} unit`);
    }
  };

  const handleEdit = (unit) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update units');
      return;
    }
    setFormData({ name: unit.name || '', abbreviation: unit.abbreviation || '', status: unit.status || 'inactive' });
    setEditingId(unit._id);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', abbreviation: '', status: 'inactive' });
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete units');
      return;
    }
    try {
      await deleteUnit(id);
      toast.success('Unit deleted successfully');
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete unit');
      setError(err.response?.data?.error || 'Failed to delete unit');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if ((currentStatus === 'active' && !canDeactivate) || (currentStatus !== 'active' && !canActivate)) {
      toast.error('You do not have permission to change unit status');
      return;
    }
    try {
      if (currentStatus === 'active') {
        await deactivateUnit(id);
        toast.success('Unit deactivated successfully');
      } else {
        await activateUnit(id);
        toast.success('Unit activated successfully');
      }
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update unit status');
      setError(err.response?.data?.error || 'Failed to update unit status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faScaleBalanced} size="sm" className="mr-3" />Units</h2>

      {(canCreate || (editingId && canUpdate)) && (
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow grid gap-3 md:grid-cols-3">
        <input
          className="border rounded p-2"
          placeholder="Unit name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Abbreviation (kg, pc, box)"
          value={formData.abbreviation}
          onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={formData.status === 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
          />
          Active
        </label>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white rounded px-4 py-2" type="submit">
            <FontAwesomeIcon icon={editingId ? faPenToSquare : faPlus} size="sm" className="mr-3" />
            {editingId ? 'Update Unit' : 'Create Unit'}
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
              <th className="border p-2 text-left">Abbreviation</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left action-column-head">Action</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit._id}>
                <td className="border p-2">{unit.name}</td>
                <td className="border p-2">{unit.abbreviation}</td>
                <td className="border p-2">{unit.status}</td>
                <td className="border p-2 action-column-cell">
                  <div className="action-icons">
                  {canUpdate && (
                  <button
                    className="action-icon-btn action-icon-edit"
                    onClick={() => handleEdit(unit)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  )}
                  {canDelete && (
                  <button
                    className="action-icon-btn action-icon-delete"
                    onClick={() => handleDelete(unit._id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )}
                  {((unit.status === 'active' && canDeactivate) || (unit.status !== 'active' && canActivate)) && (
                  <button
                    className={`action-icon-btn ${unit.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                    onClick={() => handleToggleStatus(unit._id, unit.status)}
                    aria-label={unit.status === 'active' ? 'Deactivate' : 'Activate'}
                    title={unit.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={unit.status === 'active' ? faToggleOff : faToggleOn} />
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
          label="units"
        />
      </div>
    </div>
  );
}

export default UnitPage;
