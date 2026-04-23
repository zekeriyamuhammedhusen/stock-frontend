    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import RoleForm from '../../components/RoleForm';
    import { createRole } from '../../api/roleApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faUserTag } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function RoleCreate() {
    const navigate = useNavigate();
        const [formData, setFormData] = useState({ name: '', description: '', status: 'inactive' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await createRole(formData);
        navigate('/roles');
        } catch (err) {
        if (isMissingPermissionError(err)) {
            toast.error('You do not have permission to perform this action.');
            return;
        }
                toast.error('Failed to create role');
                setError('Failed to create role');
        }
    };

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faUserTag} className="mr-2" />Create Role</h2>
        <RoleForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit} 
            error={error}
        />
        </div>
    );
    }

    export default RoleCreate;