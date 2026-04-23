import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deleteUser, getUsers, activateUser, deactivateUser } from '../../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faPenToSquare, faIdBadge, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { confirmToast } from '../../utils/toast';
import Pagination from '../../components/common/Pagination';

function UserList() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchUsers = async (pageNumber = page) => {
        try {
            const response = await getUsers({ page: pageNumber, limit });
            setUsers(Array.isArray(response.data.data) ? response.data.data : []);
            setTotal(Number(response.data.total) || 0);
            setPage(Number(response.data.page) || pageNumber);
            setError(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to fetch users');
            setError(err.response?.data?.error || 'Failed to fetch users');
            setUsers([]);
        }
    };

    useEffect(() => {
        fetchUsers(page);
    }, [page]);

    const handleDelete = async (id) => {
        const confirmed = await confirmToast('Delete this user?', 'Delete', 'Cancel');
        if (!confirmed) {
            toast.info('Delete operation cancelled');
            return;
        }
        try {
            await deleteUser(id);
            toast.success('User deleted successfully');
            fetchUsers(page);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'active') {
                await deactivateUser(id);
                toast.success('User deactivated successfully');
            } else {
                await activateUser(id);
                toast.success('User activated successfully');
            }
            fetchUsers(page);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update user status');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUsers} className="mr-2" />Users</h2>
            <Link
                to="/users/create"
                className="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />Create User
            </Link>
            {users.length === 0 ? (
                <p>No users found</p>
            ) : (
                <div className="space-y-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Status</th>
                                <th className="border p-2 action-column-head">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="border p-2">{`${user.firstName} ${user.lastName}`}</td>
                                    <td className="border p-2">{user.email}</td>
                                    <td className="border p-2">
                                        <span className={user.status === 'active' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                            {user.status || 'inactive'}
                                        </span>
                                    </td>
                                    <td className="border p-2 action-column-cell">
                                        <div className="action-icons">
                                        <Link
                                            to={`/users/edit/${user._id}`}
                                            className="action-icon-btn action-icon-edit"
                                            aria-label="Edit"
                                            title="Edit"
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </Link>
                                        <Link
                                            to={`/users/profile/${user._id}`}
                                            className="action-icon-btn action-icon-profile"
                                            aria-label="Profile"
                                            title="Profile"
                                        >
                                            <FontAwesomeIcon icon={faIdBadge} />
                                        </Link>
                                        <button
                                            type="button"
                                            className="action-icon-btn action-icon-delete"
                                            onClick={() => handleDelete(user._id)}
                                            aria-label="Delete"
                                            title="Delete"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                        <button
                                            type="button"
                                            className={`action-icon-btn ${user.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                                            onClick={() => handleToggleStatus(user._id, user.status)}
                                            aria-label={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                        >
                                            <FontAwesomeIcon icon={user.status === 'active' ? faToggleOff : faToggleOn} />
                                        </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        page={page}
                        totalPages={Math.max(1, Math.ceil(total / limit))}
                        onPageChange={setPage}
                        label="users"
                    />
                </div>
            )}
        </div>
    );
}

export default UserList;