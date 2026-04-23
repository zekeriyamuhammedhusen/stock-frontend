    import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate, useSearchParams, Link } from 'react-router-dom';
    import { resetPassword } from '../api/authApi';
    import { toast } from 'react-toastify';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

    const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const newPasswordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!email || !token) {
        setError('Invalid or missing reset token');
        toast.error('Invalid or missing reset token');
        setTimeout(() => navigate('/'), 3000);
        }
    }, [email, token, navigate]);

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword((prev) => !prev);
        requestAnimationFrame(() => {
        newPasswordInputRef.current?.focus();
        });
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prev) => !prev);
        requestAnimationFrame(() => {
        confirmPasswordInputRef.current?.focus();
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        toast.error('Passwords do not match');
        return;
        }
        setLoading(true);
        try {
        await resetPassword({ email, token, newPassword });
        setSuccess('Password reset successfully. Redirecting to login...');
        toast.success('Password reset successfully. Redirecting to login...');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/'), 3000);
        } catch (err) {
        console.error('Reset password error:', err.response?.data || err.message);
        const message = err.response?.data?.error || 'Failed to reset password';
        setError(message);
        toast.error(message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
            background:
            'radial-gradient(circle at 8% 12%, #dbeafe 0%, rgba(219, 234, 254, 0) 34%), radial-gradient(circle at 88% 20%, #fde68a 0%, rgba(253, 230, 138, 0) 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        }}
        >
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white/90 backdrop-blur-sm grid grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden lg:flex p-10 bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-transparent to-blue-400/20" />
            <div className="relative z-10 flex flex-col justify-between">
                <div>
                <p className="tracking-[0.22em] text-xs uppercase text-cyan-200 mb-4">StockMe</p>
                <h1 className="text-4xl font-bold leading-tight">Create a New Password</h1>
                <p className="mt-4 text-slate-200 max-w-sm">
                    Your reset link is active for one hour. Choose a strong password to secure your account.
                </p>
                </div>
                <div className="text-xs text-slate-300">
                If you did not request this reset, you can return to login safely.
                </div>
            </div>
            </div>

            <div className="p-8 sm:p-10 lg:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-600 mb-7">Set your new password and confirm it to continue.</p>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
                </div>
            )}
            {loading && (
                <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
                Resetting password...
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <div className="relative">
                    <input
                    ref={newPasswordInputRef}
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-500 transition"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    required
                    />
                    <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggleNewPasswordVisibility}
                    className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    aria-pressed={showNewPassword}
                    title={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                    <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                    </button>
                </div>
                </div>

                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                    <input
                    ref={confirmPasswordInputRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-500 transition"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    required
                    />
                    <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 px-4 text-slate-500 hover:text-slate-700"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
                    </button>
                </div>
                </div>

                <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 text-white px-4 py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
                disabled={loading || !email || !token}
                >
                {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <div className="text-sm pt-1">
                <Link to="/" className="text-cyan-700 hover:text-cyan-900 font-semibold">
                    Back to Login
                </Link>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
    };

    export default ResetPassword;