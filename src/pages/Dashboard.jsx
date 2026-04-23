import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp,
  faBoxesStacked,
  faBuildingColumns,
  faCartShopping,
  faCashRegister,
  faChartLine,
  faHandHoldingDollar,
  faLayerGroup,
  faRightLeft,
  faScaleBalanced,
  faTags,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { getProducts } from '../api/productApi';
import { getCategories, getUnits, getWarehouses } from '../api/masterApi';
import { getInventory } from '../api/stockApi';
import { getTransfers } from '../api/transferApi';
import { getSales } from '../api/saleApi';
import { getPurchaseOrders } from '../api/purchaseOrderApi';
import { getBankAccounts } from '../api/bankAccountApi';
import { getCredits } from '../api/creditApi';
import { getDashboardMetrics } from '../api/reportApi';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../utils/authAccess';

const REPORT_PERMISSIONS = [
  'view_dashboard_metrics',
  'view_low_stock_report',
  'view_profit_loss_report',
  'view_sales_report',
  'view_supplier_performance_report',
];

const cardMeta = [
  { path: '/products', title: 'Products', icon: faBoxesStacked, key: 'products', color: '#31d0aa', requiredPermissions: ['view_product'] },
  { path: '/categories', title: 'Categories', icon: faTags, key: 'categories', color: '#ff6f91', requiredPermissions: ['view_category'] },
  { path: '/units', title: 'Units', icon: faScaleBalanced, key: 'units', color: '#38bdf8', requiredPermissions: ['view_unit'] },
  { path: '/warehouses', title: 'Warehouses', icon: faWarehouse, key: 'warehouses', color: '#f59e0b', requiredPermissions: ['view_warehouse'] },
  { path: '/stock', title: 'Stock', icon: faWarehouse, key: 'stock', color: '#6366f1', requiredPermissions: ['view_inventory', 'view_stock_transactions'] },
  { path: '/transfers', title: 'Transfers', icon: faRightLeft, key: 'transfers', color: '#14b8a6', requiredPermissions: ['view_transfer'] },
  { path: '/sales', title: 'Sales', icon: faCashRegister, key: 'sales', color: '#60a5fa', requiredPermissions: ['view_sale'] },
  { path: '/purchases', title: 'Purchases', icon: faCartShopping, key: 'purchases', color: '#f97316', requiredPermissions: ['view_purchase_order'] },
  { path: '/bank-accounts', title: 'Bank Accounts', icon: faBuildingColumns, key: 'bankAccounts', color: '#22c55e', requiredPermissions: ['view_bank_account'] },
  { path: '/credits', title: 'Credits', icon: faHandHoldingDollar, key: 'credits', color: '#fb7185', requiredPermissions: ['view_credit'] },
  { path: '/reports', title: 'Reports', icon: faChartLine, key: 'reports', color: '#a78bfa', requiredPermissions: REPORT_PERMISSIONS },
];

const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

function SparklineChart({ value, max, color, seed }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const points = Array.from({ length: 10 }, (_, index) => {
    const wave = 0.62 + 0.28 * Math.sin((index + 1) * (seed + 1) * 0.65);
    const intensity = Math.min(1, Math.max(0.12, ratio * 0.7 + wave * 0.3));
    const x = 14 + index * 21;
    const y = 76 - intensity * 52;
    return { x, y };
  });

  const linePath = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = `14,84 ${linePath} 203,84`;

  return (
    <svg viewBox="0 0 220 92" className="h-24 w-full">
      <defs>
        <linearGradient id={`spark-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={areaPath} fill={`url(#spark-${seed})`} stroke="none" />
      <polyline points={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4.5" fill={color} />
    </svg>
  );
}

function GaugeChart({ value, max, color }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const visibleArc = circumference * 0.7;
  const dashOffset = visibleArc * (1 - ratio);

  return (
    <svg viewBox="0 0 220 110" className="h-24 w-full">
      <g transform="translate(110 64)">
        <circle
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth="12"
          strokeDasharray={`${visibleArc} ${circumference}`}
          transform="rotate(144)"
          strokeLinecap="round"
        />
        <circle
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${visibleArc} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform="rotate(144)"
          strokeLinecap="round"
        />
      </g>
      <text x="110" y="70" textAnchor="middle" className="fill-white" fontSize="20" fontWeight="800">
        {Math.round(ratio * 100)}%
      </text>
    </svg>
  );
}

function SegmentedBarsChart({ value, max, color }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const segments = 12;
  const active = Math.round(ratio * segments);

  return (
    <svg viewBox="0 0 220 70" className="h-20 w-full">
      {Array.from({ length: segments }, (_, index) => (
        <rect
          key={index}
          x={12 + index * 17}
          y={16}
          width="12"
          height="34"
          rx="4"
          fill={index < active ? color : '#273447'}
          opacity={index < active ? 0.95 : 0.45}
        />
      ))}
    </svg>
  );
}

function ColumnMixChart({ value, max, color, seed }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <svg viewBox="0 0 220 92" className="h-24 w-full">
      {Array.from({ length: 8 }, (_, index) => {
        const base = 0.3 + ((seed + index * 2) % 5) * 0.09;
        const dynamic = 0.24 + ratio * 0.66;
        const height = Math.max(14, Math.min(70, (base + dynamic) * 54));
        return (
          <rect
            key={index}
            x={18 + index * 24}
            y={82 - height}
            width="15"
            height={height}
            rx="4"
            fill={color}
            opacity={0.4 + index * 0.06}
          />
        );
      })}
    </svg>
  );
}

function MetricChart({ value, max, color, index }) {
  const chartType = index % 4;
  if (chartType === 0) return <SparklineChart value={value} max={max} color={color} seed={index + 1} />;
  if (chartType === 1) return <GaugeChart value={value} max={max} color={color} />;
  if (chartType === 2) return <SegmentedBarsChart value={value} max={max} color={color} />;
  return <ColumnMixChart value={value} max={max} color={color} seed={index + 3} />;
}

function RankingBars({ entries }) {
  const max = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{entry.title}</span>
            <span className="font-semibold text-white">{formatCompact(entry.value)}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800/80">
            <div
              className="h-2.5 rounded-full transition-all"
              style={{
                width: `${Math.max(8, Math.round((entry.value / max) * 100))}%`,
                background: `linear-gradient(90deg, ${entry.color}, #f8fafc)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const permissionsKey = useMemo(
    () => [...permissions].map((permission) => String(permission).toLowerCase()).sort().join('|'),
    [permissions]
  );

  const canViewDashboardMetrics = isAdmin || hasAnyPermission(['view_dashboard_metrics'], permissions);

  const [counts, setCounts] = useState({
    products: 0,
    categories: 0,
    units: 0,
    warehouses: 0,
    stock: 0,
    transfers: 0,
    sales: 0,
    purchases: 0,
    bankAccounts: 0,
    credits: 0,
    reports: 0,
  });

  const visibleCards = useMemo(
    () => cardMeta.filter((card) => isAdmin || hasAnyPermission(card.requiredPermissions || [], permissions)),
    [isAdmin, permissionsKey]
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      const requestsByKey = {
        products: () => getProducts({ limit: 1 }),
        categories: () => getCategories(),
        units: () => getUnits(),
        warehouses: () => getWarehouses(),
        stock: () => getInventory({ limit: 1 }),
        transfers: () => getTransfers({ limit: 1 }),
        sales: () => getSales({ limit: 1 }),
        purchases: () => getPurchaseOrders({ limit: 1 }),
        bankAccounts: () => getBankAccounts({ limit: 1 }),
        credits: () => getCredits({ limit: 1 }),
        reports: () => (canViewDashboardMetrics ? getDashboardMetrics() : Promise.resolve({ data: { data: null } })),
      };

      const results = await Promise.allSettled(
        visibleCards.map((card) => requestsByKey[card.key]())
      );

      const nextCounts = {
        products: 0,
        categories: 0,
        units: 0,
        warehouses: 0,
        stock: 0,
        transfers: 0,
        sales: 0,
        purchases: 0,
        bankAccounts: 0,
        credits: 0,
        reports: 0,
      };

      let nextMetrics = {
        totalSales: 0,
        totalSalesTransactions: 0,
        totalSalesUnits: 0,
        currentStockValue: 0,
        totalStockUnits: 0,
        recentTransactions: [],
      };

      visibleCards.forEach((card, index) => {
        const result = results[index];
        if (!result || result.status !== 'fulfilled') return;

        switch (card.key) {
          case 'products':
            nextCounts.products = Number(result.value.data?.total || 0);
            break;
          case 'categories':
            nextCounts.categories = Number(result.value.data?.length || 0);
            break;
          case 'units':
            nextCounts.units = Number(result.value.data?.length || 0);
            break;
          case 'warehouses':
            nextCounts.warehouses = Number(result.value.data?.length || 0);
            break;
          case 'stock':
            nextCounts.stock = Number(result.value.data?.data?.length || 0);
            break;
          case 'transfers':
            nextCounts.transfers = Number(result.value.data?.data?.length || 0);
            break;
          case 'sales':
            nextCounts.sales = Number(result.value.data?.data?.length || 0);
            break;
          case 'purchases':
            nextCounts.purchases = Number(result.value.data?.data?.length || 0);
            break;
          case 'bankAccounts':
            nextCounts.bankAccounts = Number(result.value.data?.total || result.value.data?.data?.length || 0);
            break;
          case 'credits':
            nextCounts.credits = Number(result.value.data?.total || result.value.data?.data?.length || 0);
            break;
          case 'reports': {
            const reportData = result.value.data?.data;
            if (reportData) {
              nextCounts.reports = Number(reportData.recentTransactions?.length || 0);
              nextMetrics = {
                totalSales: Number(reportData.totalSales || 0),
                totalSalesTransactions: Number(reportData.totalSalesTransactions || 0),
                totalSalesUnits: Number(reportData.totalSalesUnits || 0),
                currentStockValue: Number(reportData.currentStockValue || 0),
                totalStockUnits: Number(reportData.totalStockUnits || 0),
                recentTransactions: Array.isArray(reportData.recentTransactions)
                  ? reportData.recentTransactions
                  : [],
              };
            }
            break;
          }
          default:
            break;
        }
      });

      if (!canViewDashboardMetrics && visibleCards.some((card) => card.key === 'reports')) {
        const grantedReportPermissions = REPORT_PERMISSIONS.filter((permission) =>
          hasAnyPermission([permission], permissions)
        ).length;
        nextCounts.reports = grantedReportPermissions;
      }

      setCounts(nextCounts);
    };

    loadDashboardData();
  }, [visibleCards, permissionsKey, canViewDashboardMetrics]);

  const visibleEntries = useMemo(
    () => visibleCards.map((card) => ({ ...card, value: Number(counts[card.key] || 0) })),
    [visibleCards, counts]
  );

  const maxCount = useMemo(
    () => Math.max(...visibleEntries.map((entry) => entry.value), 1),
    [visibleEntries]
  );

  const spotlightEntries = useMemo(() => visibleEntries.slice(0, 6), [visibleEntries]);

  return (
    <div className="space-y-6 p-4 text-white md:p-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.map((entry, index) => (
          <Link
            key={entry.path}
            to={entry.path}
            className="group rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-slate-400"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  <FontAwesomeIcon icon={entry.icon} className="mr-2" />
                  {entry.title}
                </p>
                <h4 className="mt-2 text-3xl font-black" style={{ color: entry.color }}>
                  {formatCompact(entry.value)}
                </h4>
              </div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${entry.color}33`, color: entry.color }}>
                <FontAwesomeIcon icon={faArrowTrendUp} />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-700/70 bg-slate-950/80 p-2.5">
              <MetricChart value={entry.value} max={maxCount} color={entry.color} index={index} />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Raw count</span>
              <span>{formatNumber(entry.value)}</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/20">
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <div>
            <h3 className="text-lg font-bold tracking-wide">Category Ranking</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4">
          <RankingBars entries={spotlightEntries.length ? spotlightEntries : [{ key: 'empty-rank', title: 'No Data', value: 0, color: '#64748b' }]} />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
