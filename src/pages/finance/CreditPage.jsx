import React, { useEffect, useState } from 'react';
import { createCredit, getCredits, recordCreditPayment, updateCredit, deleteCredit } from '../../api/creditApi';
import { getBankAccounts } from '../../api/bankAccountApi';
import { getSales } from '../../api/saleApi';
import { getPurchases } from '../../api/purchaseApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandHoldingDollar, faPlus, faBan, faTrash } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

const directionForPartyType = (partyType) => (partyType === 'customer' ? 'receivable' : 'payable');
const referenceTypeForPartyType = (partyType) => (partyType === 'customer' ? 'sale' : 'purchase');

function CreditPage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreateCredit = isAdmin || hasAnyPermission(['create_credit'], permissions);
  const canUpdateCredit = isAdmin || hasAnyPermission(['update_credit'], permissions);
  const canViewBankAccounts = isAdmin || hasAnyPermission(['view_bank_account'], permissions);

  const [credits, setCredits] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [paymentById, setPaymentById] = useState({});
  const [paymentAccountById, setPaymentAccountById] = useState({});
  const [formData, setFormData] = useState({
    partyType: 'customer',
    partyName: '',
    direction: directionForPartyType('customer'),
    referenceType: 'manual',
    referenceId: '',
    amount: '',
    paidAmount: '',
    paymentBankAccount: '',
    dueDate: '',
    note: '',
  });

  const loadData = async () => {
    try {
      const requests = [getCredits()];
      if (canViewBankAccounts && (canCreateCredit || canUpdateCredit)) {
        requests.push(getBankAccounts({ status: 'active' }));
      }
      if (canCreateCredit) {
        requests.push(getSales({ limit: 100 }));
        requests.push(getPurchases({ limit: 100 }));
      }

      const results = await Promise.all(requests);
      const [creditsRes, accountsRes, salesRes, purchasesRes] = results;
      setCredits(creditsRes.data?.data || []);
      if (accountsRes) {
        setBankAccounts(accountsRes.data?.data || []);
      }
      if (salesRes) {
        setSales(salesRes.data?.data || []);
      }
      if (purchasesRes) {
        setPurchases(purchasesRes.data?.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load credit records');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateCredit) {
      toast.error('You do not have permission to create credit records');
      return;
    }
    try {
      await createCredit({
        ...formData,
        direction: directionForPartyType(formData.partyType),
        referenceType: formData.referenceType,
        referenceId: formData.referenceType === 'manual' ? undefined : formData.referenceId,
        amount: Number(formData.amount),
        paidAmount: Number(formData.paidAmount || 0),
        paymentBankAccount: Number(formData.paidAmount || 0) > 0 ? (formData.paymentBankAccount || undefined) : undefined,
        dueDate: formData.dueDate || undefined,
      });
      toast.success('Credit record created successfully');
      setFormData({
        partyType: 'customer',
        partyName: '',
        direction: directionForPartyType('customer'),
        referenceType: 'manual',
        referenceId: '',
        amount: '',
        paidAmount: '',
        paymentBankAccount: '',
        dueDate: '',
        note: '',
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create credit record');
    }
  };

  const handlePayment = async (id) => {
    if (!canUpdateCredit) {
      toast.error('You do not have permission to update credit records');
      return;
    }
    if (!paymentAccountById[id]) {
      toast.error('Please select a bank account for payment');
      return;
    }
    try {
      await recordCreditPayment(id, {
        amount: Number(paymentById[id] || 0),
        bankAccount: paymentAccountById[id],
      });
      toast.success('Payment recorded successfully');
      setPaymentById((prev) => ({ ...prev, [id]: '' }));
      setPaymentAccountById((prev) => ({ ...prev, [id]: '' }));
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleCancelCredit = async (id) => {
    if (!canUpdateCredit) {
      toast.error('You do not have permission to update credit records');
      return;
    }

    try {
      await updateCredit(id, { status: 'cancelled' });
      toast.success('Credit cancelled successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel credit');
    }
  };

  const handleDeleteCredit = async (id) => {
    if (!canUpdateCredit) {
      toast.error('You do not have permission to delete credit records');
      return;
    }

    try {
      await deleteCredit(id);
      toast.success('Credit deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete credit');
    }
  };

  const totalPages = Math.max(1, Math.ceil(credits.length / limit));
  const paginatedCredits = credits.slice((page - 1) * limit, page * limit);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faHandHoldingDollar} className="mr-2" />Credit Management</h2>

      {canCreateCredit && (
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <select
          className="border rounded p-2"
          value={formData.partyType}
          onChange={(e) =>
            setFormData({
              ...formData,
              partyType: e.target.value,
              direction: directionForPartyType(e.target.value),
            })
          }
        >
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
        </select>
        <input className="border rounded p-2" placeholder="Party Name" value={formData.partyName} onChange={(e) => setFormData({ ...formData, partyName: e.target.value })} required />
        <select className="border rounded p-2 bg-gray-50" value={formData.direction} disabled>
          <option value={formData.direction}>{formData.direction === 'receivable' ? 'Receivable' : 'Payable'}</option>
        </select>
        <select
          className="border rounded p-2"
          value={formData.referenceType}
          onChange={(e) =>
            setFormData({
              ...formData,
              referenceType: e.target.value,
              referenceId: '',
            })
          }
        >
          <option value="manual">Manual</option>
          <option value={referenceTypeForPartyType(formData.partyType)}>
            {formData.partyType === 'customer' ? 'Sale Reference' : 'Purchase Reference'}
          </option>
        </select>
        {formData.referenceType !== 'manual' && (
          <select
            className="border rounded p-2"
            value={formData.referenceId}
            onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
            required
          >
            <option value="">Select Reference</option>
            {(formData.partyType === 'customer' ? sales : purchases).map((record) => (
              <option key={record._id} value={record._id}>
                {formData.partyType === 'customer'
                  ? `${record.customer || 'Sale'} - ${Number(record.total_amount || 0).toFixed(2)}`
                  : `${record.supplier || 'Purchase'} - ${Number(record.total_amount || 0).toFixed(2)}`}
              </option>
            ))}
          </select>
        )}
        <input type="number" min="0.01" step="0.01" className="border rounded p-2" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
        <input type="number" min="0" step="0.01" className="border rounded p-2" placeholder="Paid Amount (optional)" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })} />
        {canViewBankAccounts && Number(formData.paidAmount || 0) > 0 && (
          <select
            className="border rounded p-2"
            value={formData.paymentBankAccount}
            onChange={(e) => setFormData({ ...formData, paymentBankAccount: e.target.value })}
            required
          >
            <option value="">Select Payment Bank Account</option>
            {bankAccounts.map((account) => (
              <option key={account._id} value={account._id}>{account.name}</option>
            ))}
          </select>
        )}
        <input type="date" className="border rounded p-2" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
        <input className="border rounded p-2 md:col-span-2" placeholder="Note" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />Create Credit
        </button>
      </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Party</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-left">Direction</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">Paid</th>
              <th className="border p-2 text-left">Due</th>
              <th className="border p-2 text-left">Ref</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Payment</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCredits.map((credit) => (
              <tr key={credit._id}>
                <td className="border p-2">{credit.partyName}</td>
                <td className="border p-2">{credit.partyType}</td>
                <td className="border p-2">{credit.direction}</td>
                <td className="border p-2">{credit.amount}</td>
                <td className="border p-2">{credit.paidAmount}</td>
                <td className="border p-2">{credit.dueAmount}</td>
                <td className="border p-2">{credit.referenceType || 'manual'}</td>
                <td className="border p-2">{credit.status}</td>
                <td className="border p-2">
                  {(credit.status === 'settled' || credit.status === 'cancelled' || !canUpdateCredit || !canViewBankAccounts) ? (
                    '-'
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded p-1"
                        value={paymentAccountById[credit._id] || ''}
                        onChange={(e) =>
                          setPaymentAccountById((prev) => ({ ...prev, [credit._id]: e.target.value }))
                        }
                      >
                        <option value="">Bank Account</option>
                        {bankAccounts.map((account) => (
                          <option key={account._id} value={account._id}>{account.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="border rounded p-1 w-28"
                        placeholder="Amount"
                        value={paymentById[credit._id] || ''}
                        onChange={(e) =>
                          setPaymentById((prev) => ({ ...prev, [credit._id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="bg-emerald-600 text-white rounded px-2 py-1"
                        onClick={() => handlePayment(credit._id)}
                      >
                        Pay
                      </button>
                    </div>
                  )}
                </td>
                <td className="border p-2">
                  <div className="flex items-center gap-2">
                    {canUpdateCredit && credit.status !== 'settled' && credit.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="bg-amber-600 text-white rounded px-2 py-1"
                        onClick={() => handleCancelCredit(credit._id)}
                        title="Cancel Credit"
                      >
                        <FontAwesomeIcon icon={faBan} className="mr-1" />Cancel
                      </button>
                    )}
                    {canUpdateCredit && credit.status === 'settled' && (
                      <button
                        type="button"
                        className="action-icon-btn action-icon-delete"
                        onClick={() => handleDeleteCredit(credit._id)}
                        title="Delete fully paid credit"
                        aria-label="Delete fully paid credit"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
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

export default CreditPage;
