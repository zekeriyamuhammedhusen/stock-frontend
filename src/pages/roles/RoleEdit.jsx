    import React, { useState, useEffect } from 'react';
    import { useNavigate, useParams } from 'react-router-dom';
    import RoleForm from '../../components/RoleForm';
    import { getRole, updateRole } from '../../api/roleApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faUserTag } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function RoleEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRole = async () => {
        try {
            const response = await getRole(id);
            setFormData(response.data.data);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error('Failed to fetch role');
            setError('Failed to fetch role');
        }
        };
        fetchRole();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await updateRole(id, formData);
        navigate('/roles');
        } catch (err) {
        if (isMissingPermissionError(err)) {
            toast.error('You do not have permission to perform this action.');
            return;
        }
        toast.error('Failed to update role');
        setError('Failed to update role');
        }
    };

    if (!formData) return <div className="container mx-auto p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserTag} className="mr-2" />Edit Role</h2>
        <RoleForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit} 
            error={error}
        />
        </div>
    );
    }

    export default RoleEdit;