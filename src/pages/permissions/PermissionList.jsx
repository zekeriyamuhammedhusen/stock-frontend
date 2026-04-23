    import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import { deletePermission, getPermissions, activatePermission, deactivatePermission } from '../../api/permissionApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faShieldHalved, faPlus, faPenToSquare, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { confirmToast } from '../../utils/toast';
    import Pagination from '../../components/common/Pagination';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function PermissionList() {
    const [permissions, setPermissions] = useState([]);
    const [error, setError] = useState(null);
        const [page, setPage] = useState(1);
        const [limit] = useState(10);
        const [total, setTotal] = useState(0);

        const fetchPermissions = async (pageNumber = page) => {
        try {
                const response = await getPermissions({ page: pageNumber, limit });
            setPermissions(Array.isArray(response.data.data) ? response.data.data : []);
                setTotal(Number(response.data.total) || 0);
                setPage(Number(response.data.page) || pageNumber);
            setError(null);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                setPermissions([]);
                setError(null);
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to fetch permissions');
            setError(err.response?.data?.message || 'Failed to fetch permissions');
            setPermissions([]);
        }
    };

    useEffect(() => {
            fetchPermissions(page);
        }, [page]);

    const handleDelete = async (id) => {
        const confirmed = await confirmToast('Delete this permission?', 'Delete', 'Cancel');
        if (!confirmed) {
            toast.info('Delete operation cancelled');
            return;
        }
        try {
            await deletePermission(id);
            toast.success('Permission deleted successfully');
            fetchPermissions(page);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to delete permission');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'active') {
                await deactivatePermission(id);
                toast.success('Permission deactivated successfully');
            } else {
                await activatePermission(id);
                toast.success('Permission activated successfully');
            }
            fetchPermissions(page);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to update permission status');
        }
    };

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faShieldHalved} className="mr-2" />Permissions</h2>
        <Link
            to="/permissions/create"
            className="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Create Permission
        </Link>
        {permissions.length === 0 ? (
            <p>No permissions found</p>
        ) : (
            <div className="space-y-4">
                <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2 action-column-head">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {permissions.map((permission) => (
                    <tr key={permission._id}>
                        <td className="border p-2">{permission.name}</td>
                        <td className="border p-2">{permission.description}</td>
                        <td className="border p-2">
                        <span className={permission.status === 'active' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {permission.status || 'inactive'}
                        </span>
                        </td>
                        <td className="border p-2 action-column-cell">
                        <div className="action-icons">
                        <Link
                            to={`/permissions/edit/${permission._id}`}
                            className="action-icon-btn action-icon-edit"
                            aria-label="Edit"
                            title="Edit"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </Link>
                        <button
                            type="button"
                            className="action-icon-btn action-icon-delete"
                            onClick={() => handleDelete(permission._id)}
                            aria-label="Delete"
                            title="Delete"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button
                            type="button"
                            className={`action-icon-btn ${permission.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                            onClick={() => handleToggleStatus(permission._id, permission.status)}
                            aria-label={permission.status === 'active' ? 'Deactivate' : 'Activate'}
                            title={permission.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                            <FontAwesomeIcon icon={permission.status === 'active' ? faToggleOff : faToggleOn} />
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
                    label="permissions"
                />
            </div>
        )}
        </div>
    );
    }

    export default PermissionList;