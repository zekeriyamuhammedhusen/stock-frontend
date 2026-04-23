import React, { useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategories, updateCategory, activateCategory, deactivateCategory } from '../../api/masterApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faPlus, faTrash, faPenToSquare, faXmark, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function CategoryPage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreate = isAdmin || hasAnyPermission(['create_category'], permissions);
  const canUpdate = isAdmin || hasAnyPermission(['update_category'], permissions);
  const canDelete = isAdmin || hasAnyPermission(['delete_category'], permissions);
  const canActivate = isAdmin || hasAnyPermission(['activate_category'], permissions);
  const canDeactivate = isAdmin || hasAnyPermission(['deactivate_category'], permissions);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', code: '', status: 'inactive' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = async (pageNumber = page) => {
    try {
      const res = await getCategories({ page: pageNumber, limit });
      setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total) || 0);
      setPage(Number(res.data?.page) || pageNumber);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load categories');
      setError(err.response?.data?.error || 'Failed to load categories');
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
        await updateCategory(editingId, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
      }
      setFormData({ name: '', code: '', status: 'inactive' });
      setEditingId(null);
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} category`);
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} category`);
    }
  };

  const handleEdit = (category) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update categories');
      return;
    }
    setFormData({ name: category.name || '', code: category.code || '', status: category.status || 'inactive' });
    setEditingId(category._id);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', status: 'inactive' });
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete categories');
      return;
    }
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if ((currentStatus === 'active' && !canDeactivate) || (currentStatus !== 'active' && !canActivate)) {
      toast.error('You do not have permission to change category status');
      return;
    }
    try {
      if (currentStatus === 'active') {
        await deactivateCategory(id);
        toast.success('Category deactivated successfully');
      } else {
        await activateCategory(id);
        toast.success('Category activated successfully');
      }
      loadData(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update category status');
      setError(err.response?.data?.error || 'Failed to update category status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faTags} size="sm" className="mr-3" />Categories</h2>

      {(canCreate || (editingId && canUpdate)) && (
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow grid gap-3 md:grid-cols-3">
        <input
          className="border rounded p-2"
          placeholder="Category name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Unique code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
            {editingId ? 'Update Category' : 'Create Category'}
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
              <th className="border p-2 text-left">Code</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left action-column-head">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td className="border p-2">{category.name}</td>
                <td className="border p-2">{category.code}</td>
                <td className="border p-2">{category.status}</td>
                <td className="border p-2 action-column-cell">
                  <div className="action-icons">
                  {canUpdate && (
                  <button
                    className="action-icon-btn action-icon-edit"
                    onClick={() => handleEdit(category)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  )}
                  {canDelete && (
                  <button
                    className="action-icon-btn action-icon-delete"
                    onClick={() => handleDelete(category._id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )}
                  {((category.status === 'active' && canDeactivate) || (category.status !== 'active' && canActivate)) && (
                  <button
                    className={`action-icon-btn ${category.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                    onClick={() => handleToggleStatus(category._id, category.status)}
                    aria-label={category.status === 'active' ? 'Deactivate' : 'Activate'}
                    title={category.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={category.status === 'active' ? faToggleOff : faToggleOn} />
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
          label="categories"
        />
      </div>
    </div>
  );
}

export default CategoryPage;
