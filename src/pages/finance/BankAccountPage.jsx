import React, { useEffect, useState } from 'react';
import {
  activateBankAccount,
  createBankAccount,
  deactivateBankAccount,
  deleteBankAccount,
  getBankAccounts,
  updateBankAccount,
} from '../../api/bankAccountApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns, faPlus, faPenToSquare, faTrash, faToggleOn, faToggleOff, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function BankAccountPage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreate = isAdmin || hasAnyPermission(['create_bank_account'], permissions);
  const canUpdate = isAdmin || hasAnyPermission(['update_bank_account'], permissions);
  const canDelete = isAdmin || hasAnyPermission(['delete_bank_account'], permissions);
  const canActivate = isAdmin || hasAnyPermission(['activate_bank_account'], permissions);
  const canDeactivate = isAdmin || hasAnyPermission(['deactivate_bank_account'], permissions);

  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    currency: 'ETB',
    balance: '',
    description: '',
    status: 'inactive',
  });

  const loadData = async () => {
    try {
      const res = await getBankAccounts();
      setAccounts(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load bank accounts');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      bankName: '',
      accountNumber: '',
      currency: 'ETB',
      balance: '',
      description: '',
      status: 'inactive',
    });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((editingId && !canUpdate) || (!editingId && !canCreate)) {
      toast.error('You do not have permission to perform this action');
      return;
    }
    try {
      if (editingId) {
        await updateBankAccount(editingId, { ...formData, balance: Number(formData.balance || 0) });
        toast.success('Bank account updated successfully');
      } else {
        await createBankAccount({ ...formData, balance: Number(formData.balance || 0) });
        toast.success('Bank account created successfully');
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save bank account');
    }
  };

  const handleEdit = (account) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update bank accounts');
      return;
    }
    setEditingId(account._id);
    setFormData({
      name: account.name || '',
      bankName: account.bankName || '',
      accountNumber: account.accountNumber || '',
      currency: account.currency || 'ETB',
      balance: account.balance ?? '',
      description: account.description || '',
      status: account.status || 'inactive',
    });
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete bank accounts');
      return;
    }
    try {
      await deleteBankAccount(id);
      toast.success('Bank account deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete bank account');
    }
  };

  const handleToggleStatus = async (id, status) => {
    if ((status === 'active' && !canDeactivate) || (status !== 'active' && !canActivate)) {
      toast.error('You do not have permission to change bank account status');
      return;
    }
    try {
      if (status === 'active') {
        await deactivateBankAccount(id);
        toast.success('Bank account deactivated successfully');
      } else {
        await activateBankAccount(id);
        toast.success('Bank account activated successfully');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update bank account status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faBuildingColumns} size="sm" className="mr-3" />Bank Accounts</h2>

      {(canCreate || (editingId && canUpdate)) && (
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <input className="border rounded p-2" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <input className="border rounded p-2" placeholder="Bank Name" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required />
        <input className="border rounded p-2" placeholder="Account Number" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required />
        <input className="border rounded p-2" placeholder="Currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
        <input type="number" min="0" step="0.01" className="border rounded p-2" placeholder="Balance" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} />
        <input className="border rounded p-2" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 md:col-span-2">
          <input
            type="checkbox"
            checked={formData.status === 'active'}
            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
          />
          Active
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            <FontAwesomeIcon icon={editingId ? faPenToSquare : faPlus} size="sm" className="mr-3" />
            {editingId ? 'Update Account' : 'Create Account'}
          </button>
          {editingId && (
            <button
              type="button"
              className="bg-gray-500 text-white rounded px-4 py-2"
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
              <th className="border p-2 text-left">Bank</th>
              <th className="border p-2 text-left">Account #</th>
              <th className="border p-2 text-left">Balance</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left action-column-head">Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account._id}>
                <td className="border p-2">{account.name}</td>
                <td className="border p-2">{account.bankName}</td>
                <td className="border p-2">{account.accountNumber}</td>
                <td className="border p-2">{account.balance}</td>
                <td className="border p-2">{account.status}</td>
                <td className="border p-2 action-column-cell">
                  <div className="action-icons">
                  {canUpdate && (
                  <button type="button" className="action-icon-btn action-icon-edit" onClick={() => handleEdit(account)} title="Edit" aria-label="Edit">
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  )}
                  {canDelete && (
                  <button type="button" className="action-icon-btn action-icon-delete" onClick={() => handleDelete(account._id)} title="Delete" aria-label="Delete">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  )}
                  {((account.status === 'active' && canDeactivate) || (account.status !== 'active' && canActivate)) && (
                  <button
                    type="button"
                    className={`action-icon-btn ${account.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                    onClick={() => handleToggleStatus(account._id, account.status)}
                    title={account.status === 'active' ? 'Deactivate' : 'Activate'}
                    aria-label={account.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon icon={account.status === 'active' ? faToggleOff : faToggleOn} />
                  </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BankAccountPage;
