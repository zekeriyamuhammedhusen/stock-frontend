    import React from 'react';
    import { Link, useLocation, useNavigate } from 'react-router-dom';
    import { logout } from '../api/authApi';
    import { removeToken } from '../utils/token';
    import { clearStoredPermissions } from '../utils/authAccess';
    import { clearSessionTracking } from '../utils/sessionTimeout';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

function Navbar({ onMenuClick = () => {} }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname === '/dashboard';

    const handleLogout = async () => {
        try {
        await logout();
        } catch (err) {
        console.error('Logout failed:', err);
        } finally {
        removeToken();
        clearStoredPermissions();
        clearSessionTracking();
        sessionStorage.removeItem('authToastShown');
        sessionStorage.setItem('logoutToastMessage', 'You logged out successfully');
        navigate('/', { replace: true });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 md:left-64 z-40 bg-blue-600 text-white shadow-md">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
            <button
                type="button"
                onClick={onMenuClick}
                className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 md:hidden"
                aria-label="Open menu"
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            {isDashboard ? <h1 className="truncate text-lg font-bold sm:text-xl lg:text-2xl">Stock Management System</h1> : <div />}
            </div>
            <nav className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 hover:bg-red-600"
                aria-label="Logout"
                title="Logout"
            >
                <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
            </nav>
        </div>
        </header>
    );
    }

    export default Navbar;