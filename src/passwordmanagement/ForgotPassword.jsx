    import React, { useState, useEffect } from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import { forgotPassword } from '../api/authApi';
    import { toast } from 'react-toastify';

    const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Dynamic margin based on sidebar state
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const contentMargin = isCollapsed ? '60px' : '120px';

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.userId || payload.id || payload.sub) {
            setError('You are already logged in. Redirecting to dashboard...');
            toast.info('You are already logged in. Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (err) {
            console.error('Token parse error:', err.message);
            localStorage.removeItem('token');
        }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
        await forgotPassword({ email });
        setSuccess('Password reset link sent to your email');
        toast.success('Password reset link sent to your email');
        setEmail('');
        setTimeout(() => navigate('/'), 3000);
        } catch (err) {
        console.error('Forgot password error:', err.response?.data || err.message);
        const status = err.response?.status;
        const errMsg = status === 400
            ? 'Invalid email address. Please check and try again.'
            : status === 404
            ? 'No account found with this email.'
            : err.response?.data?.error || 'Failed to send reset link';
        setError(errMsg);
        toast.error(errMsg);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ marginLeft: contentMargin, paddingRight: '20px', transition: 'margin-left 0.3s' }}>
        <h2>Forgot Password</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {loading && <div className="alert alert-info">Sending reset link...</div>}
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
            <label className="form-label">Email</label>
            <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                required
            />
            </div>
            <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            >
            {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="mt-3">
            <Link to="/">Back to Login</Link>
            </div>
        </form>
        </div>
    );
    };

    export default ForgotPassword;