import React, { useEffect, useState } from 'react';
import {
  getDashboardMetrics,
  getLowStockReport,
  getProfitLossReport,
  getSalesReport,
  getSupplierPerformanceReport,
} from '../../api/reportApi';
import { getApprovalRequests, approveApprovalRequest, rejectApprovalRequest } from '../../api/approvalApi';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faFilter, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';

const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function MiniDonut({ value, total, color }) {
  const safeTotal = Math.max(total || 0, 1);
  const pct = Math.max(0, Math.min(100, Math.round((Number(value || 0) / safeTotal) * 100)));

  return (
    <div
      className="relative h-24 w-24 rounded-full"
      style={{ background: `conic-gradient(${color} 0deg ${(pct / 100) * 360}deg, #ffffff ${(pct / 100) * 360}deg 360deg)` }}
    >
      <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-700 shadow-inner">
        {pct}%
      </div>
    </div>
  );
}

function ProfitLossPie({ revenue, expense, profit }) {
  const revenueValue = Math.abs(Number(revenue || 0));
  const expenseValue = Math.abs(Number(expense || 0));
  const profitValue = Math.abs(Number(profit || 0));
  const total = Math.max(revenueValue + expenseValue + profitValue, 1);

  const revenuePct = (revenueValue / total) * 100;
  const expensePct = (expenseValue / total) * 100;
  const profitPct = (profitValue / total) * 100;

  const revenueEnd = (revenuePct / 100) * 360;
  const expenseEnd = revenueEnd + (expensePct / 100) * 360;
  const profitEnd = expenseEnd + (profitPct / 100) * 360;

  return (
    <div
      className="relative h-24 w-24 rounded-full"
      style={{
        background: `conic-gradient(
          #16a34a 0deg ${revenueEnd}deg,
          #ef4444 ${revenueEnd}deg ${expenseEnd}deg,
          #2563eb ${expenseEnd}deg ${profitEnd}deg,
          #ffffff ${profitEnd}deg 360deg
        )`,
      }}
    >
      <div className="absolute inset-[22%] rounded-full bg-white shadow-inner" />
    </div>
  );
}

function StatCard({ title, value, colorClass, note, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
          {note && <p className="mt-2 text-sm text-slate-500">{note}</p>}
        </div>
        <div className="rounded-2xl bg-slate-50 p-2 shadow-inner">{children}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ReportsDashboard() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canViewDashboardMetrics = isAdmin || hasAnyPermission(['view_dashboard_metrics'], permissions);
  const canViewLowStock = isAdmin || hasAnyPermission(['view_low_stock_report'], permissions);
  const canViewProfitLoss = isAdmin || hasAnyPermission(['view_profit_loss_report'], permissions);
  const canViewSalesItemReport = isAdmin || hasAnyPermission(['view_sales_report'], permissions);
  const canViewSupplierPerformance = isAdmin || hasAnyPermission(['view_supplier_performance_report'], permissions);
  const canViewApprovals = isAdmin;
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    currentStockValue: 0,
    totalStockUnits: 0,
    recentTransactions: [],
  });
  const [lowStock, setLowStock] = useState([]);
  const [profitLoss, setProfitLoss] = useState({ revenue: 0, totalCostOfGoodsSold: 0, profit: 0 });
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isApprovalVisible, setIsApprovalVisible] = useState(false);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [txDateFilter, setTxDateFilter] = useState('all');
  const [salesLineDateFilter, setSalesLineDateFilter] = useState('all');
  const [salesLinePage, setSalesLinePage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const [tableLimit] = useState(10);
  const [salesLines, setSalesLines] = useState([]);

  const salesTotal = Number(metrics.totalSales || 0);
  const stockValueTotal = Number(metrics.currentStockValue || 0);
  const stockUnitsTotal = Number(metrics.totalStockUnits || 0);
  const summaryTotal = Math.max(salesTotal + stockValueTotal + stockUnitsTotal, 1);
  const [supplierReportRows, setSupplierReportRows] = useState([]);

  const loadData = async (customThreshold = '') => {
    try {
      const lowStockPromise = canViewLowStock
        ? getLowStockReport(customThreshold ? { threshold: customThreshold } : {})
        : Promise.resolve({ data: { data: [] } });

      const [metricsRes, lowStockRes, plRes] = await Promise.allSettled([
        canViewDashboardMetrics
          ? getDashboardMetrics()
          : Promise.resolve({ data: { data: { totalSales: 0, currentStockValue: 0, totalStockUnits: 0, recentTransactions: [] } } }),
        lowStockPromise,
        canViewProfitLoss
          ? getProfitLossReport()
          : Promise.resolve({ data: { data: { revenue: 0, totalCostOfGoodsSold: 0, expense: 0, profit: 0 } } }),
      ]);

      setMetrics(metricsRes.status === 'fulfilled' ? (metricsRes.value.data.data || {}) : { totalSales: 0, currentStockValue: 0, totalStockUnits: 0, recentTransactions: [] });
      setLowStock(lowStockRes.status === 'fulfilled' ? (lowStockRes.value.data.data || []) : []);
      setProfitLoss(plRes.status === 'fulfilled' ? (plRes.value.data.data || { revenue: 0, totalCostOfGoodsSold: 0, expense: 0, profit: 0 }) : { revenue: 0, totalCostOfGoodsSold: 0, expense: 0, profit: 0 });

      if (canViewSalesItemReport) {
        try {
          const salesRes = await getSalesReport({});
          const rows = Array.isArray(salesRes.data?.data)
            ? salesRes.data.data.map((row, index) => ({
                id: `${row.saleId || 'sale'}-${index}`,
                date: row.date,
                customer: row.customer || '-',
                soldBy: row.salesperson || '-',
                itemName: row.productName || '-',
                quantity: Number(row.quantity || 0),
                unitPrice: Number(row.unitPrice || 0),
                lineTotal: Number(row.lineTotal || 0),
              }))
            : [];
          setSalesLines(rows);
        } catch {
          setSalesLines([]);
        }
      } else {
        setSalesLines([]);
      }

      if (canViewSupplierPerformance) {
        try {
          const supplierRes = await getSupplierPerformanceReport({});
          setSupplierReportRows(Array.isArray(supplierRes.data?.data) ? supplierRes.data.data : []);
        } catch {
          setSupplierReportRows([]);
        }
      } else {
        setSupplierReportRows([]);
      }

      if (canViewApprovals) {
        try {
          const approvalsRes = await getApprovalRequests({ status: 'pending', page: 1, limit: 100 });
          setPendingApprovals(approvalsRes.data.data || []);
          setIsApprovalVisible(true);
        } catch {
          setPendingApprovals([]);
          setIsApprovalVisible(false);
        }
      } else {
        setPendingApprovals([]);
        setIsApprovalVisible(false);
      }
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load reporting');
      setError(err.response?.data?.error || 'Failed to load reporting');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThreshold = async (e) => {
    e.preventDefault();
    if (!canViewLowStock) return;
    loadData(threshold);
  };

  const lowStockTotalPages = Math.max(1, Math.ceil(lowStock.length / tableLimit));
  const paginatedLowStock = lowStock.slice((lowStockPage - 1) * tableLimit, lowStockPage * tableLimit);
  const transactions = metrics.recentTransactions || [];
  
  const getFilteredTransactions = () => {
    if (txDateFilter === 'all') return transactions;
    
    const now = new Date();
    let startDate = new Date();
    
    if (txDateFilter === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (txDateFilter === '2weeks') {
      startDate.setDate(now.getDate() - 14);
    } else if (txDateFilter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (txDateFilter === '2months') {
      startDate.setMonth(now.getMonth() - 2);
    } else if (txDateFilter === '3months') {
      startDate.setMonth(now.getMonth() - 3);
    }
    
    return transactions.filter((tx) => new Date(tx.createdAt) >= startDate);
  };
  
  const filteredTransactions = getFilteredTransactions();

  const getFilteredSalesLines = () => {
    if (salesLineDateFilter === 'all') return salesLines;

    const now = new Date();
    const startDate = new Date();

    if (salesLineDateFilter === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (salesLineDateFilter === '2weeks') {
      startDate.setDate(now.getDate() - 14);
    } else if (salesLineDateFilter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (salesLineDateFilter === '2months') {
      startDate.setMonth(now.getMonth() - 2);
    } else if (salesLineDateFilter === '3months') {
      startDate.setMonth(now.getMonth() - 3);
    }

    return salesLines.filter((line) => new Date(line.date) >= startDate);
  };

  const filteredSalesLines = getFilteredSalesLines();

  const handleClearSalesItemsView = () => {
    setSalesLines([]);
    setSalesLinePage(1);
    toast.success('Sales item report cleared');
  };

  const handleResetSalesItemsFilter = () => {
    setSalesLineDateFilter('all');
    setSalesLinePage(1);
  };

  const txTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / tableLimit));
  const paginatedTransactions = filteredTransactions.slice((txPage - 1) * tableLimit, txPage * tableLimit);
  const salesLineTotalPages = Math.max(1, Math.ceil(filteredSalesLines.length / tableLimit));
  const paginatedSalesLines = filteredSalesLines.slice((salesLinePage - 1) * tableLimit, salesLinePage * tableLimit);
  const approvalTotalPages = Math.max(1, Math.ceil(pendingApprovals.length / tableLimit));
  const paginatedApprovals = pendingApprovals.slice((approvalPage - 1) * tableLimit, approvalPage * tableLimit);

  const handleApprovalAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await approveApprovalRequest(id);
        toast.success('Request approved successfully');
      } else {
        await rejectApprovalRequest(id);
        toast.success('Request rejected successfully');
      }
      loadData(threshold);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process approval request');
      setError(err.response?.data?.error || 'Failed to process approval request');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="container mx-auto space-y-6 p-6">
        {canViewDashboardMetrics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              title="Total Sales"
              value={moneyFormatter.format(salesTotal)}
              colorClass="text-blue-700"
            >
              <MiniDonut value={salesTotal} total={summaryTotal} color="#2563eb" />
            </StatCard>
            {stockValueTotal > 0 ? (
              <StatCard
                title="Current Stock Value"
                value={moneyFormatter.format(stockValueTotal)}
                colorClass="text-emerald-700"
                note="Estimated inventory value on hand."
              >
                <MiniDonut value={stockValueTotal} total={summaryTotal} color="#16a34a" />
              </StatCard>
            ) : (
              <StatCard
                title="Current Stock Value"
                value={moneyFormatter.format(stockValueTotal)}
                colorClass="text-emerald-700"
              >
                <MiniDonut value={stockValueTotal} total={summaryTotal} color="#16a34a" />
              </StatCard>
            )}
            <StatCard
              title="Total Stock Units"
              value={Math.round(stockUnitsTotal) || 0}
              colorClass="text-orange-700"
            >
              <MiniDonut value={stockUnitsTotal} total={summaryTotal} color="#ea580c" />
            </StatCard>
          </div>
        )}

        {canViewProfitLoss && (
          <SectionCard
            title="Profit & Loss"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm font-semibold text-emerald-700">Revenue</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{Number(profitLoss.revenue || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm font-semibold text-rose-700">Expense (Purchases)</p>
                <p className="mt-2 text-3xl font-bold text-rose-900">{Number(profitLoss.expense || 0).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm transition hover:shadow-md">
                <p className="text-sm font-semibold text-blue-700">Net Profit</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{Number(profitLoss.profit || 0).toFixed(2)}</p>
              </div>
            </div>
          </SectionCard>
        )}

      {canViewLowStock && (
        <SectionCard
          title="Low Stock Report"
          action={
            <form onSubmit={handleThreshold} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 sm:w-40"
                placeholder="Threshold"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
                <FontAwesomeIcon icon={faFilter} size="sm" className="mr-3" />Apply
              </button>
            </form>
          }
        >

          <div className="overflow-auto">
            <table className="w-full border-collapse overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Product</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Warehouse</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Quantity</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Reorder Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLowStock.map((item) => (
                  <tr key={item._id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3">{item.warehouseName}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.reorderLevel}</td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>No low-stock items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={lowStockPage}
              totalPages={lowStockTotalPages}
              onPageChange={setLowStockPage}
            />
          </div>
        </SectionCard>
      )}

      {canViewSalesItemReport && (
        <SectionCard
          title="Sales Item Report"
          subtitle="Every sold item broken down by customer, seller, and amount."
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2 sm:w-48"
                value={salesLineDateFilter}
                onChange={(e) => {
                  setSalesLineDateFilter(e.target.value);
                  setSalesLinePage(1);
                }}
              >
                <option value="all">All Time</option>
                <option value="week">Last 1 Week</option>
                <option value="2weeks">Last 2 Weeks</option>
                <option value="month">Last 1 Month</option>
                <option value="2months">Last 2 Months</option>
                <option value="3months">Last 3 Months</option>
              </select>
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={handleResetSalesItemsFilter}
              >
                Clear Filter
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500"
                onClick={handleClearSalesItemsView}
              >
                Clear List
              </button>
            </div>
          }
        >
          <div className="overflow-auto">
            <table className="w-full border-collapse overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Date</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Sold By</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Item Name</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Item Qty</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Unit Money</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Total Money (Qty x Unit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSalesLines.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(row.date).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.customer}</td>
                    <td className="px-4 py-3">{row.soldBy}</td>
                    <td className="px-4 py-3">{row.itemName}</td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3">{row.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">{row.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
                {filteredSalesLines.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>No sales items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={salesLinePage}
              totalPages={salesLineTotalPages}
              onPageChange={setSalesLinePage}
            />
          </div>
        </SectionCard>
      )}

      {canViewDashboardMetrics && (
      <SectionCard
        title="Recent Transactions"
        subtitle="Latest stock movements across the system."
        action={
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 sm:w-48"
            value={txDateFilter}
            onChange={(e) => {
              setTxDateFilter(e.target.value);
              setTxPage(1);
            }}
          >
            <option value="all">All Time</option>
            <option value="week">Last 1 Week</option>
            <option value="2weeks">Last 2 Weeks</option>
            <option value="month">Last 1 Month</option>
            <option value="2months">Last 2 Months</option>
            <option value="3months">Last 3 Months</option>
          </select>
        }
      >
        <div className="overflow-auto">
          <table className="w-full border-collapse overflow-hidden rounded-2xl">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Type</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Product</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Warehouse</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Quantity</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => (
                <tr key={tx._id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3">{tx.type}</td>
                  <td className="px-4 py-3">{tx.product?.name || '-'}</td>
                  <td className="px-4 py-3">{tx.warehouse?.name || '-'}</td>
                  <td className="px-4 py-3">{tx.quantity}</td>
                  <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={txPage}
            totalPages={txTotalPages}
            onPageChange={setTxPage}
          />
        </div>
      </SectionCard>
      )}

      {canViewApprovals && isApprovalVisible && (
        <SectionCard
          title="Pending User Requests"
          subtitle="Admin review queue for approvals and rejections."
        >
          <div className="overflow-auto">
            <table className="w-full border-collapse overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Action</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Requested By</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Requested At</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApprovals.map((request) => (
                  <tr key={request._id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-3">{request.actionType}</td>
                    <td className="px-4 py-3">
                      {request.requestedBy
                        ? `${request.requestedBy.firstName || ''} ${request.requestedBy.lastName || ''}`.trim() || request.requestedBy.email
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{new Date(request.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{request.status}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 p-2 text-white transition hover:bg-emerald-500"
                        onClick={() => handleApprovalAction(request._id, 'approve')}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-rose-600 p-2 text-white transition hover:bg-rose-500"
                        onClick={() => handleApprovalAction(request._id, 'reject')}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingApprovals.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={approvalPage}
              totalPages={approvalTotalPages}
              onPageChange={setApprovalPage}
            />
          </div>
        </SectionCard>
      )}
      </div>
    </div>
  );
}

export default ReportsDashboard;
