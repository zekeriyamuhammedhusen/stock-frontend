    import React, { useEffect, useRef, useState } from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import { login } from '../api/authApi';
    import { getMe } from '../api/userApi';
    import { setToken } from '../utils/token';
    import { extractPermissionNames, setStoredPermissions } from '../utils/authAccess';
    import { markSessionLogin } from '../utils/sessionTimeout';
    import { toast } from 'react-toastify';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

    function Home({ setIsAuthenticated }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const passwordInputRef = useRef(null);

    useEffect(() => {
        const logoutToastMessage = sessionStorage.getItem('logoutToastMessage');
        if (logoutToastMessage) {
        toast.success(logoutToastMessage);
        sessionStorage.removeItem('logoutToastMessage');
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
        requestAnimationFrame(() => {
            passwordInputRef.current?.focus();
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
        const response = await login(formData);
        if (!response.data.token) {
            throw new Error('No token received');
        }
        setToken(response.data.token);
        markSessionLogin();
        const meResponse = await getMe();
        setStoredPermissions(extractPermissionNames(meResponse.data));
        setIsAuthenticated(true);
        sessionStorage.removeItem('authToastShown');
        toast.success('Login successful');
        navigate('/dashboard');
        } catch (err) {
        const message = err.response?.data?.error || err.response?.data?.message || 'Invalid email or password';
        setError(message);
        toast.error(message);
        }
    };

    return (
        <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
            background:
            'radial-gradient(circle at 12% 18%, #e3f2fd 0%, rgba(227, 242, 253, 0) 36%), radial-gradient(circle at 88% 22%, #ffe0b2 0%, rgba(255, 224, 178, 0) 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        }}
        >
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white/90 backdrop-blur-sm grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden lg:flex p-10 bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-transparent to-amber-400/20" />
            <div className="relative z-10 flex flex-col justify-between">
                <div>
                <p className="tracking-[0.22em] text-xs uppercase text-cyan-200 mb-4">Stock Management</p>
                <h1 className="text-4xl font-bold leading-tight">Stock Management System Login</h1>
                <p className="mt-4 text-slate-200 max-w-sm">
                    Sign in to manage inventory, warehouses, purchases, sales, and stock transfers.
                </p>
                </div>
                <div className="text-xs text-slate-300">
                Authorized users only. All actions are tracked by role and permission.
                </div>
            </div>
            </div>

            <div className="p-8 sm:p-10 lg:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-sm text-slate-600 mb-7">Enter your registered email and password to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-500 transition"
                    placeholder="name@company.com"
                />
                </div>

                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                    <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-500 transition"
                    placeholder="Enter your password"
                    />
                    <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    >
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                    </button>
                </div>
                </div>

                <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 text-white px-4 py-3 font-semibold hover:bg-slate-800 transition"
                >
                Login
                </button>

                <div className="flex items-center justify-between text-sm pt-1">
                <Link to="/forgot-password" className="text-cyan-700 hover:text-cyan-900 font-semibold">
                    Forgot password?
                </Link>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
    }

    export default Home;