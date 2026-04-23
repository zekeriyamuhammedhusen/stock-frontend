import React, { useEffect, useState } from 'react';
import { createProduct, deleteProduct, getProducts, updateProduct, activateProduct, deactivateProduct } from '../../api/productApi';
import { getCategories, getUnits, getWarehouses } from '../../api/masterApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faSearch, faPlus, faPenToSquare, faTrash, faXmark, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmToast } from '../../utils/toast';
import Pagination from '../../components/common/Pagination';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function ProductList() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreateProduct = isAdmin || hasAnyPermission(['create_product'], permissions);
  const canUpdateProduct = isAdmin || hasAnyPermission(['update_product'], permissions);
  const canDeleteProduct = isAdmin || hasAnyPermission(['delete_product'], permissions);
  const canActivateProduct = isAdmin || hasAnyPermission(['activate_product'], permissions);
  const canDeactivateProduct = isAdmin || hasAnyPermission(['deactivate_product'], permissions);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    warehouse: '',
    quantity: '',
    costPrice: '',
    sellingPrice: '',
    status: 'inactive',
  });

  const loadData = async (searchValue = search, pageNumber = page) => {
    try {
      const [productRes, categoryRes, unitRes, warehouseRes] = await Promise.all([
        getProducts({ search: searchValue, page: pageNumber, limit }),
        getCategories({ page: 1, limit: 1000, status: 'active' }),
        getUnits({ page: 1, limit: 1000, status: 'active' }),
        getWarehouses({ page: 1, limit: 1000, status: 'active' }),
      ]);

      setProducts(productRes.data.data || []);
      setTotal(Number(productRes.data.total) || 0);
      setPage(Number(productRes.data.page) || pageNumber);
      setCategories(Array.isArray(categoryRes.data?.data) ? categoryRes.data.data : []);
      setUnits(Array.isArray(unitRes.data?.data) ? unitRes.data.data : []);
      setWarehouses(Array.isArray(warehouseRes.data?.data) ? warehouseRes.data.data : []);
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load products');
      setError(err.response?.data?.error || 'Failed to load products');
    }
  };

  useEffect(() => {
    loadData(search, page);
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((editingId && !canUpdateProduct) || (!editingId && !canCreateProduct)) {
      toast.error('You do not have permission to perform this action');
      return;
    }
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
        toast.success('Product updated successfully');
      } else {
        const response = await createProduct(formData);
        if (response?.data?.status === 'pending_approval') {
          toast.success('your product created succesfully waiting for admin approval');
        } else {
          toast.success('Product created successfully');
        }
      }
      setFormData({
        name: '',
        description: '',
        category: '',
        unit: '',
        warehouse: '',
        quantity: '',
        costPrice: '',
        sellingPrice: '',
        status: 'inactive',
      });
      setEditingId(null);
      setPage(1);
      loadData(search, 1);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} product`);
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} product`);
    }
  };

  const handleEdit = (product) => {
    if (!canUpdateProduct) {
      toast.error('You do not have permission to update products');
      return;
    }
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category?._id || '',
      unit: product.unit?._id || '',
      quantity: product.quantity ?? '',
      costPrice: product.costPrice ?? '',
      sellingPrice: product.sellingPrice ?? '',
      status: product.status || 'inactive',
    });
    setEditingId(product._id);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      unit: '',
      warehouse: '',
      quantity: '',
      costPrice: '',
      sellingPrice: '',
      status: 'inactive',
    });
  };

  const handleDelete = async (id) => {
    if (!canDeleteProduct) {
      toast.error('You do not have permission to delete products');
      return;
    }
    const confirmed = await confirmToast('Delete this product?', 'Delete', 'Cancel');
    if (!confirmed) {
      toast.info('Delete operation cancelled');
      return;
    }
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
      loadData(search, page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    loadData(search, 1);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if ((currentStatus === 'active' && !canDeactivateProduct) || (currentStatus !== 'active' && !canActivateProduct)) {
      toast.error('You do not have permission to change product status');
      return;
    }
    try {
      if (currentStatus === 'active') {
        await deactivateProduct(id);
        toast.success('Product deactivated successfully');
      } else {
        await activateProduct(id);
        toast.success('Product activated successfully');
      }
      loadData(search, page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update product status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faBoxesStacked} size="sm" className="mr-3" />Products</h2>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or description"
          className="border rounded p-2 flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded"><FontAwesomeIcon icon={faSearch} size="sm" className="mr-3" />Search</button>
      </form>

      {(canCreateProduct || (editingId && canUpdateProduct)) && (
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <input
          className="border rounded p-2"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          type="number"
          min="0"
          step="0.0001"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          required
        />
        <select
          className="border rounded p-2"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          required
        >
          <option value="">Select Unit</option>
          {units.map((unit) => (
            <option key={unit._id} value={unit._id}>{unit.name}</option>
          ))}
        </select>
        {!editingId && (
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
        )}
        <textarea
          className="border rounded p-2 md:col-span-2"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <input
          className="border rounded p-2"
          type="number"
          min="0"
          step="0.01"
          placeholder="Cost"
          value={formData.costPrice}
          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Selling Price"
          value={formData.sellingPrice}
          onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
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
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            <FontAwesomeIcon icon={editingId ? faPenToSquare : faPlus} size="sm" className="mr-3" />
            {editingId ? 'Update Product' : 'Add Product'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded">
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
              <th className="border p-2 text-left">Category</th>
              <th className="border p-2 text-left">Unit</th>
              <th className="border p-2 text-left">By</th>
              <th className="border p-2 text-left">Qty</th>
              <th className="border p-2 text-left">Cost</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left action-column-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.category?.name || '-'}</td>
                <td className="border p-2">{product.unit?.abbreviation || '-'}</td>
                <td className="border p-2">{product.createdBy ? `${product.createdBy.firstName || ''} ${product.createdBy.lastName || ''}`.trim() || product.createdBy.email : '-'}</td>
                <td className="border p-2">{product.quantity ?? 0}</td>
                <td className="border p-2">{product.costPrice ?? 0}</td>
                <td className="border p-2">
                  <span className={product.status === 'active' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {product.status || 'inactive'}
                  </span>
                </td>
                <td className="border p-2 action-column-cell">
                  <div className="action-icons">
                  {canUpdateProduct && (
                  <button
                    type="button"
                    className="action-icon-btn action-icon-edit"
                    onClick={() => handleEdit(product)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  )}
                  {canDeleteProduct && (
                  <button
                    type="button"
                    className="action-icon-btn action-icon-delete"
                    onClick={() => handleDelete(product._id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )}
                  {((product.status === 'active' && canDeactivateProduct) || (product.status !== 'active' && canActivateProduct)) && (
                  <button
                    type="button"
                    className={`action-icon-btn ${product.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                    onClick={() => handleToggleStatus(product._id, product.status)}
                    aria-label={product.status === 'active' ? 'Deactivate' : 'Activate'}
                    title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={product.status === 'active' ? faToggleOff : faToggleOn} />
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
          label="products"
        />
      </div>
    </div>
  );
}

export default ProductList;
