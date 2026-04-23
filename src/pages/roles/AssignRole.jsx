        import React, { useState, useEffect } from 'react';
        import { useNavigate } from 'react-router-dom';
        import { getUsers } from '../../api/userApi';
        import { getRoles, assignRole } from '../../api/roleApi';
        import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
        import { faUserTag, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
        import { toast } from 'react-toastify';
        import { isMissingPermissionError } from '../../utils/errorUtils';

        function AssignRole() {
        const navigate = useNavigate();
        const [users, setUsers] = useState([]);
        const [roles, setRoles] = useState([]);
        const [selectedUser, setSelectedUser] = useState('');
        const [selectedRole, setSelectedRole] = useState('');
        const [error, setError] = useState(null);

        useEffect(() => {
            const fetchData = async () => {
            try {
                const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
                setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
                setRoles(Array.isArray(rolesRes.data.data) ? rolesRes.data.data : []);
            } catch {
                toast.error('Failed to fetch data');
                setError('Failed to fetch data');
            }
            };
            fetchData();
        }, []);

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
            await assignRole(selectedUser, selectedRole);
            navigate('/roles');
            } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error('Failed to assign role');
            setError('Failed to assign role');
            }
        };

        return (
            <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserTag} className="mr-2" />Assign Role</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <div>
                <label className="block text-sm font-medium">Select User</label>
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                >
                    <option value="">Select a user</option>
                    {users.map(user => (
                    <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName}
                    </option>
                    ))}
                </select>
                </div>
                <div>
                <label className="block text-sm font-medium">Select Role</label>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                    <option key={role._id} value={role.name}>{role.name}</option>
                    ))}
                </select>
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />Assign Role
                </button>
            </form>
            </div>
        );
        }

        export default AssignRole;