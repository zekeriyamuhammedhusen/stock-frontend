    import React, { useState, useEffect } from 'react';
    import { Link } from 'react-router-dom';
    import { deleteRole, getRoles, activateRole, deactivateRole } from '../../api/roleApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faUserTag, faPlus, faPenToSquare, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { confirmToast } from '../../utils/toast';
    import Pagination from '../../components/common/Pagination';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function RoleList() {
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState(null);
        const [page, setPage] = useState(1);
        const [limit] = useState(10);
        const [total, setTotal] = useState(0);

        const fetchRoles = async (pageNumber = page) => {
        try {
                const response = await getRoles({ page: pageNumber, limit });
            setRoles(Array.isArray(response.data.data) ? response.data.data : []);
                setTotal(Number(response.data.total) || 0);
                setPage(Number(response.data.page) || pageNumber);
            setError(null);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                setRoles([]);
                setError(null);
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to fetch roles');
            setError(err.response?.data?.message || 'Failed to fetch roles');
            setRoles([]);
        }
    };

    useEffect(() => {
            fetchRoles(page);
        }, [page]);

    const handleDelete = async (id) => {
        const confirmed = await confirmToast('Delete this role?', 'Delete', 'Cancel');
        if (!confirmed) {
            toast.info('Delete operation cancelled');
            return;
        }
        try {
            await deleteRole(id);
            toast.success('Role deleted successfully');
            fetchRoles(page);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to delete role');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'active') {
                await deactivateRole(id);
                toast.success('Role deactivated successfully');
            } else {
                await activateRole(id);
                toast.success('Role activated successfully');
            }
            fetchRoles(page);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to update role status');
        }
    };

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserTag} className="mr-2" />Roles</h2>
        <Link
            to="/roles/create"
            className="mb-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />Create Role
        </Link>
        {roles.length === 0 ? (
            <p>No roles found</p>
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
                    {roles.map((role) => (
                    <tr key={role._id}>
                        <td className="border p-2">{role.name}</td>
                        <td className="border p-2">{role.description}</td>
                        <td className="border p-2">
                        <span className={role.status === 'active' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {role.status || 'inactive'}
                        </span>
                        </td>
                        <td className="border p-2 action-column-cell">
                        <div className="action-icons">
                        <Link
                            to={`/roles/edit/${role._id}`}
                            className="action-icon-btn action-icon-edit"
                            aria-label="Edit"
                            title="Edit"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </Link>
                        <button
                            type="button"
                            className="action-icon-btn action-icon-delete"
                            onClick={() => handleDelete(role._id)}
                            aria-label="Delete"
                            title="Delete"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button
                            type="button"
                            className={`action-icon-btn ${role.status === 'active' ? 'action-icon-status-active' : 'action-icon-status-inactive'}`}
                            onClick={() => handleToggleStatus(role._id, role.status)}
                            aria-label={role.status === 'active' ? 'Deactivate' : 'Activate'}
                            title={role.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                            <FontAwesomeIcon icon={role.status === 'active' ? faToggleOff : faToggleOn} />
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
                    label="roles"
                />
            </div>
        )}
        </div>
    );
    }

    export default RoleList;