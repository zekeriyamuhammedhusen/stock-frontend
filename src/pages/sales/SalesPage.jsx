import React, { useEffect, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { createSale, getSaleSourceWarehouses, getSales, getSalesSummary } from '../../api/saleApi';
import { getMe } from '../../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../../utils/authAccess';

function SparklineChart({ values }) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...safeValues, 1);
  const minVal = Math.min(...safeValues, 0);
  const range = Math.max(maxVal - minVal, 1);

  const points = safeValues.map((value, index) => {
    const x = 10 + (index * (180 / (safeValues.length - 1 || 1)));
    const y = 70 - ((value - minVal) / range) * 52;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 200 80" className="mt-2 h-16 w-full">
      <defs>
        <linearGradient id="salesSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
      <polygon points={`10,74 ${points.join(' ')} 190,74`} fill="url(#salesSpark)" />
    </svg>
  );
}

function BarsChart({ values }) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...safeValues, 1);

  return (
    <svg viewBox="0 0 200 80" className="mt-2 h-16 w-full">
      {safeValues.map((value, index) => {
        const width = 20;
        const gap = 12;
        const x = 12 + index * (width + gap);
        const height = (value / maxVal) * 56;
        const y = 72 - height;
        return (
          <rect
            key={`tx-bar-${index}`}
            x={x}
            y={y}
            width={width}
            height={Math.max(3, height)}
            rx="4"
            fill="#3b82f6"
            opacity={0.55 + (index / safeValues.length) * 0.45}
          />
        );
      })}
    </svg>
  );
}

function DonutChart({ value, max }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <svg viewBox="0 0 90 90" className="mt-2 h-16 w-16">
      <circle cx="45" cy="45" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="9" />
      <circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 45 45)"
      />
      <text x="45" y="50" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937">
        {Math.round(ratio * 100)}%
      </text>
    </svg>
  );
}

function SalesPage() {
  const isAdmin = isAdminRole();
  const permissions = getStoredPermissions();
  const canCreateSale = isAdmin || hasAnyPermission(['create_sale'], permissions);
  const canViewSaleSummary = isAdmin || hasAnyPermission(['view_sale_summary'], permissions);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSalesAmount: 0, totalTransactions: 0, averageSaleAmount: 0 });
  const [error, setError] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit] = useState(10);

  const [sellerName, setSellerName] = useState('');
  const [customer, setCustomer] = useState('');
  const [item, setItem] = useState({ product: '', warehouse: '', quantity: '', unitPrice: '' });
  const [sourceWarehouses, setSourceWarehouses] = useState([]);

  const selectedWarehouse = sourceWarehouses.find(
    (warehouse) => String(warehouse.warehouseId) === String(item.warehouse)
  );

  const loadData = async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([
        getProducts({ status: 'active' }),
        getSales(),
      ]);

      setProducts(productsRes.data.data || []);
      setSales(salesRes.data.data || []);
      if (canViewSaleSummary) {
        try {
          const summaryRes = await getSalesSummary();
          setSummary(summaryRes.data.data || { totalSalesAmount: 0, totalTransactions: 0, averageSaleAmount: 0 });
        } catch {
          setSummary({ totalSalesAmount: 0, totalTransactions: 0, averageSaleAmount: 0 });
        }
      } else {
        setSummary({ totalSalesAmount: 0, totalTransactions: 0, averageSaleAmount: 0 });
      }
      setError('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load sales data');
      setError(err.response?.data?.error || 'Failed to load sales data');
    }
  };

  useEffect(() => {
    const loadCurrentUserName = async () => {
      try {
        const meRes = await getMe();
        const me = meRes.data || {};
        const fullName = `${me.firstName || ''} ${me.lastName || ''}`.trim();
        setSellerName(fullName || me.email || '');
      } catch {
        setSellerName('');
      }
    };

    loadCurrentUserName();
    loadData();
  }, []);

  const handleProductChange = (productId) => {
    if (!canCreateSale) return;
    const selectedProduct = products.find((product) => product._id === productId);
    const fallbackPrice = Number(selectedProduct?.sellingPrice || 0) > 0
      ? Number(selectedProduct.sellingPrice)
      : Number(selectedProduct?.costPrice || 0);

    if (!productId) {
      setSourceWarehouses([]);
      setItem((prev) => ({ ...prev, product: '', warehouse: '', unitPrice: '' }));
      return;
    }

    getSaleSourceWarehouses(productId)
      .then((res) => {
        const available = Array.isArray(res.data?.data)
          ? res.data.data.map((warehouse) => ({
              ...warehouse,
              warehouseId: String(warehouse.warehouseId),
              quantity: Number(warehouse.quantity || 0),
            }))
          : [];
        setSourceWarehouses(available);
        setItem((prev) => {
          const currentWarehouseId = String(prev.warehouse || '');
          const stillValid = available.some((warehouse) => String(warehouse.warehouseId) === currentWarehouseId);
          const nextWarehouseId = available[0]?.warehouseId || '';
          return {
            ...prev,
            product: productId,
            warehouse: stillValid ? currentWarehouseId : nextWarehouseId,
            unitPrice: selectedProduct ? String(fallbackPrice) : '',
          };
        });
      })
      .catch((err) => {
        setSourceWarehouses([]);
        setItem((prev) => ({ ...prev, product: productId, warehouse: '', unitPrice: selectedProduct ? String(fallbackPrice) : '' }));
        toast.error(err.response?.data?.error || 'Failed to load sale source warehouses');
      });
  };

  useEffect(() => {
    if (!item.product || item.warehouse || sourceWarehouses.length === 0) return;
    setItem((prev) => ({
      ...prev,
      warehouse: String(sourceWarehouses[0].warehouseId),
    }));
  }, [item.product, item.warehouse, sourceWarehouses]);

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!canCreateSale) {
      toast.error('You do not have permission to create sales');
      return;
    }
    try {
      const availableSource = sourceWarehouses.find((warehouse) => warehouse.warehouseId === item.warehouse);
      if (!availableSource) {
        toast.error('Choose a source warehouse that already has this product in stock');
        return;
      }

      if (Number(item.quantity) > Number(availableSource.quantity || 0)) {
        toast.error('Quantity exceeds stock available in the selected source warehouse');
        return;
      }

      await createSale({
        customer,
        items_list: [
          {
            product: item.product,
            warehouse: item.warehouse,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          },
        ],
      });

      toast.success('Sale created successfully');
      setItem({ product: '', warehouse: '', quantity: '', unitPrice: '' });
      setSourceWarehouses([]);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sale');
      setError(err.response?.data?.error || 'Failed to create sale');
    }
  };

  const salesTotalPages = Math.max(1, Math.ceil(sales.length / salesLimit));
  const paginatedSales = sales.slice((salesPage - 1) * salesLimit, salesPage * salesLimit);
  const recentSales = sales.slice(0, 6).reverse();
  const salesAmounts = recentSales.map((sale) => Number(sale.total_amount || 0));
  const transactionBars = recentSales.map((sale) => Number(sale.items_list?.length || 0));
  const maxRecentSale = Math.max(...salesAmounts, Number(summary.averageSaleAmount || 0), 1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold"><FontAwesomeIcon icon={faCashRegister} size="sm" className="mr-3" />Sales</h2>

      {canViewSaleSummary && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow border-t-4 border-emerald-500">
          <p className="text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-emerald-700">{summary.totalSalesAmount?.toFixed?.(2) || 0}</p>
          <SparklineChart values={salesAmounts} />
        </div>
        <div className="bg-white p-4 rounded shadow border-t-4 border-blue-500">
          <p className="text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-blue-700">{summary.totalTransactions || 0}</p>
          <BarsChart values={transactionBars} />
        </div>
        <div className="bg-white p-4 rounded shadow border-t-4 border-amber-500">
          <p className="text-gray-500">Average</p>
          <p className="text-2xl font-bold text-amber-700">{summary.averageSaleAmount?.toFixed?.(2) || 0}</p>
          <DonutChart value={Number(summary.averageSaleAmount || 0)} max={maxRecentSale} />
        </div>
      </div>
      )}

      {canCreateSale && (
      <form onSubmit={handleCreateSale} className="bg-white rounded shadow p-4 grid gap-3 md:grid-cols-2">
        <input
          className="border rounded p-2"
          value={sellerName}
          readOnly
          placeholder="Sold By"
          required
        />

        <input
          className="border rounded p-2"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Customer Name"
          required
        />

        <select
          className="border rounded p-2"
          value={item.product}
          onChange={(e) => handleProductChange(e.target.value)}
          required
        >
          <option value="">Select Product</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>{product.name}</option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={item.warehouse}
          onChange={(e) => setItem({ ...item, warehouse: e.target.value })}
          required
          disabled={!item.product}
        >
          <option value="">{item.product ? 'Source Warehouse' : 'Select Product First'}</option>
          {sourceWarehouses.map((warehouse) => (
            <option key={warehouse.warehouseId} value={String(warehouse.warehouseId)}>
              {warehouse.warehouseName} ({warehouse.quantity})
            </option>
          ))}
        </select>

        <input
          type="number"
          className="border rounded p-2"
          min="0.0001"
          step="0.0001"
          value={item.quantity}
          onChange={(e) => setItem({ ...item, quantity: e.target.value })}
          placeholder="Quantity"
          required
        />

        <input
          type="number"
          className="border rounded p-2"
          min="0"
          step="0.01"
          value={item.unitPrice}
          readOnly
          placeholder="Selling Price (auto)"
          required
        />

        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded md:col-span-2">
          <FontAwesomeIcon icon={faCheckCircle} size="sm" className="mr-3" />Complete Sale
        </button>
      </form>
      )}

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Customer</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">By</th>
              <th className="border p-2 text-left">Items</th>
              <th className="border p-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.map((sale) => (
              <tr key={sale._id}>
                <td className="border p-2">{sale.customer}</td>
                <td className="border p-2">{new Date(sale.date).toLocaleString()}</td>
                <td className="border p-2">{sale.createdBy ? `${sale.createdBy.firstName || ''} ${sale.createdBy.lastName || ''}`.trim() || sale.createdBy.email : '-'}</td>
                <td className="border p-2">{sale.items_list?.length || 0}</td>
                <td className="border p-2">{sale.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={salesPage}
          totalPages={salesTotalPages}
          onPageChange={setSalesPage}
        />
      </div>
    </div>
  );
}

export default SalesPage;
