import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, updateUser } from '../../api/userApi';
import { getRoles } from '../../api/roleApi';
import { getPermissions } from '../../api/permissionApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

function UserEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, rolesRes, permissionsRes] = await Promise.all([
                    getUser(id),
                    getRoles(),
                    getPermissions(),
                ]);

                const user = userRes.data;
                setFormData({
                    firstName: user.firstName || '',
                    middleName: user.middleName || '',
                    lastName: user.lastName || '',
                    address: user.address || '',
                    status: user.status || 'inactive',
                    role: Array.isArray(user.roles) && user.roles.length > 0 ? (user.roles[0]._id || user.roles[0]) : '',
                    permissions: Array.isArray(user.permissions) ? user.permissions.map((p) => p._id || p) : [],
                });

                setRoles(Array.isArray(rolesRes.data?.data) ? rolesRes.data.data : []);
                setPermissions(Array.isArray(permissionsRes.data?.data) ? permissionsRes.data.data : []);
            } catch {
                toast.error('Failed to load user data');
                setError('Failed to load user data');
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePermissionToggle = (permissionId) => {
        setFormData((prev) => {
            const exists = prev.permissions.includes(permissionId);
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter((id) => id !== permissionId)
                    : [...prev.permissions, permissionId],
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(id, formData);
            toast.success('User updated successfully');
            navigate('/users');
        } catch {
            toast.error('Failed to update user');
            setError('Failed to update user');
        }
    };

    if (!formData) return <div className="container mx-auto p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserPen} className="mr-2" />Edit User</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Middle Name</label>
                    <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="">Select a role</option>
                        {roles.map((role) => (
                            <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Grant/Revoke Permissions</label>
                    <div className="grid gap-2 rounded-md border p-3 max-h-64 overflow-auto">
                        {permissions.map((permission) => (
                            <label key={permission._id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission._id)}
                                    onChange={() => handlePermissionToggle(permission._id)}
                                />
                                <span>{permission.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Update User
                    </button>
                    <button
                        type="button"
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        onClick={() => navigate('/users')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UserEdit;