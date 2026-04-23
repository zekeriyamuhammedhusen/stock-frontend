import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/userApi';
import { getRoles } from '../../api/roleApi';
import { getPermissions } from '../../api/permissionApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

function UserCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    email: '',
    password: '',
    status: 'inactive',
    isAdmin: false,
    role: '',
    permissions: [],
  });
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const adminRole = roles.find((role) => String(role.name || '').toLowerCase() === 'admin');
  const adminRoleId = adminRole?._id || '';

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [rolesRes, permissionsRes] = await Promise.all([getRoles(), getPermissions()]);
        setRoles(Array.isArray(rolesRes.data?.data) ? rolesRes.data.data : []);
        setPermissions(Array.isArray(permissionsRes.data?.data) ? permissionsRes.data.data : []);
      } catch {
          toast.error('Failed to load roles and permissions');
        setError('Failed to load roles and permissions');
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!formData.isAdmin) return;
    if (!adminRoleId) return;
    setFormData((prev) => ({ ...prev, role: adminRoleId, permissions: [] }));
  }, [adminRoleId, formData.isAdmin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'isAdmin') {
      setFormData((prev) => ({
        ...prev,
        isAdmin: checked,
        role: checked ? adminRoleId : '',
        permissions: checked ? [] : prev.permissions,
      }));
      return;
    }

    const nextValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: nextValue });
  };

  const handlePermissionToggle = (permissionId) => {
    if (formData.isAdmin) return;
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
      if (formData.isAdmin && !adminRoleId) {
        toast.error('Admin role is not available. Please seed roles first.');
        return;
      }

      const payload = {
        ...formData,
        role: formData.isAdmin ? adminRoleId : formData.role,
        permissions: formData.isAdmin ? [] : formData.permissions,
      };
      await createUser(payload);
      toast.success('User created successfully');
      navigate('/users');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserPlus} className="mr-2" />Create User</h2>
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
            placeholder="Enter first name"
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
            placeholder="Enter middle name"
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
            placeholder="Enter last name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter password"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="isAdmin"
              checked={Boolean(formData.isAdmin)}
              onChange={handleChange}
            />
            Admin User
          </label>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.status === 'active'}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.checked ? 'active' : 'inactive' }))
              }
            />
            Active
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">Assign Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required={!formData.isAdmin}
            disabled={formData.isAdmin}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </select>
          {formData.isAdmin && (
            <p className="mt-1 text-xs text-gray-600">Admin role is assigned automatically.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Assign Permissions</label>
          <div className="grid gap-2 rounded-md border p-3 max-h-64 overflow-auto">
            {permissions.map((permission) => (
              <label key={permission._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission._id)}
                  disabled={formData.isAdmin}
                  onChange={() => handlePermissionToggle(permission._id)}
                />
                <span>{permission.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />Create User
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="mr-2" />Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserCreate;