    import React, { useEffect, useState } from 'react';
    import { Link, useLocation } from 'react-router-dom';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faHouse, faUsers, faKey, faLock, faBoxesStacked, faWarehouse, faTruckFast, faCashRegister, faCartShopping, faChartLine, faTags, faScaleBalanced, faChevronDown, faChevronRight, faBuildingColumns, faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons';
    import { getStoredPermissions, hasAnyPermission, isAdminRole } from '../utils/authAccess';

    function Sidebar({ isMobileOpen = false, onNavigate = () => {} }) {
    const location = useLocation();
    const isWarehouseSectionRoute = ['/warehouses', '/categories', '/units'].includes(location.pathname);
    const [isWarehouseSectionOpen, setIsWarehouseSectionOpen] = useState(isWarehouseSectionRoute);
        const isAdmin = isAdminRole();
        const permissions = getStoredPermissions();

        const canAccessRoute = ({ adminOnly = false, requiredPermissions = [] } = {}) => {
            if (adminOnly) return isAdmin;
            if (requiredPermissions.length === 0) return true;
            if (isAdmin) return true;
            return hasAnyPermission(requiredPermissions, permissions);
        };

        const canAccessWarehouseSetup =
            canAccessRoute({ requiredPermissions: ['view_warehouse'] }) ||
            canAccessRoute({ requiredPermissions: ['view_category'] }) ||
            canAccessRoute({ requiredPermissions: ['view_unit'] });

    useEffect(() => {
        if (isWarehouseSectionRoute) {
        setIsWarehouseSectionOpen(true);
        }
    }, [isWarehouseSectionRoute]);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: faHouse },
        ...(canAccessRoute({ adminOnly: true }) ? [{ path: '/users', label: 'Users', icon: faUsers }] : []),
        ...(canAccessRoute({ adminOnly: true }) ? [{ path: '/roles', label: 'Roles', icon: faKey }] : []),
        ...(canAccessRoute({ adminOnly: true }) ? [{ path: '/permissions', label: 'Permissions', icon: faLock }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_product'] }) ? [{ path: '/products', label: 'Products', icon: faBoxesStacked }] : []),
        ...(canAccessWarehouseSetup ? [{ type: 'warehouse-section', label: 'Warehouse Setup', icon: faWarehouse }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_inventory', 'view_stock_transactions'] }) ? [{ path: '/stock', label: 'Stock', icon: faWarehouse }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_transfer'] }) ? [{ path: '/transfers', label: 'Transfers', icon: faTruckFast }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_sale'] }) ? [{ path: '/sales', label: 'Sales', icon: faCashRegister }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_purchase_order'] }) ? [{ path: '/purchases', label: 'Purchases', icon: faCartShopping }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_bank_account'] }) ? [{ path: '/bank-accounts', label: 'Bank Accounts', icon: faBuildingColumns }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_credit'] }) ? [{ path: '/credits', label: 'Credits', icon: faHandHoldingDollar }] : []),
        ...(canAccessRoute({ requiredPermissions: ['view_dashboard_metrics', 'view_low_stock_report', 'view_profit_loss_report', 'view_sales_report', 'view_supplier_performance_report'] }) ? [{ path: '/reports', label: 'Reports', icon: faChartLine }] : []),
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-800 text-white p-4 overflow-y-auto transform transition-transform duration-300 ease-in-out md:w-64 md:translate-x-0 ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
        <div className="mb-6 flex items-center justify-between md:justify-start">
            <h2 className="text-xl font-bold">Menu</h2>
            <span className="ml-3 rounded-full bg-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] md:hidden">
                Menu
            </span>
        </div>
        <nav>
            <ul className="space-y-2">
            {navItems.map((item) => (
                <li key={item.path || item.type}>
                {item.type === 'warehouse-section' ? (
                    <>
                    <button
                        type="button"
                        onClick={() => setIsWarehouseSectionOpen((prev) => !prev)}
                        className={`w-full text-left flex items-center justify-between p-2 rounded-md ${
                        isWarehouseSectionRoute ? 'bg-gray-700' : 'hover:bg-gray-700'
                        }`}
                    >
                        <span className="flex items-center">
                        <FontAwesomeIcon icon={faWarehouse} size="sm" className="mr-3" />
                        Warehouse Setup
                        </span>
                        <FontAwesomeIcon icon={isWarehouseSectionOpen ? faChevronDown : faChevronRight} size="xs" />
                    </button>
                    {isWarehouseSectionOpen && (
                        <div className="space-y-1 mt-1">
                        {canAccessRoute({ requiredPermissions: ['view_warehouse'] }) && (
                            <Link
                                to="/warehouses"
                                onClick={onNavigate}
                                className={`ml-7 flex items-center p-2 rounded-md ${
                                location.pathname === '/warehouses' ? 'bg-gray-700' : 'hover:bg-gray-700'
                                }`}
                            >
                                <FontAwesomeIcon icon={faWarehouse} size="sm" className="mr-3" />
                                Warehouses
                            </Link>
                        )}
                        {canAccessRoute({ requiredPermissions: ['view_category'] }) && (
                            <Link
                                to="/categories"
                                onClick={onNavigate}
                                className={`ml-7 flex items-center p-2 rounded-md ${
                                location.pathname === '/categories' ? 'bg-gray-700' : 'hover:bg-gray-700'
                                }`}
                            >
                                <FontAwesomeIcon icon={faTags} size="sm" className="mr-3" />
                                Categories
                            </Link>
                        )}
                        {canAccessRoute({ requiredPermissions: ['view_unit'] }) && (
                            <Link
                                to="/units"
                                onClick={onNavigate}
                                className={`ml-7 flex items-center p-2 rounded-md ${
                                location.pathname === '/units' ? 'bg-gray-700' : 'hover:bg-gray-700'
                                }`}
                            >
                                <FontAwesomeIcon icon={faScaleBalanced} size="sm" className="mr-3" />
                                Units
                            </Link>
                        )}
                        </div>
                    )}
                    </>
                ) : (
                    <Link
                    to={item.path}
                    onClick={onNavigate}
                    className={`flex items-center p-2 rounded-md ${
                        location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                    >
                    <FontAwesomeIcon icon={item.icon} size="sm" className="mr-3" />
                    {item.label}
                    </Link>
                )}
                </li>
            ))}
            </ul>
        </nav>
        </aside>
    );
    }

    export default Sidebar;