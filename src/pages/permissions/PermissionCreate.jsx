    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import PermissionForm from '../../components/PermissionForm';
    import { createPermission } from '../../api/permissionApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function PermissionCreate() {
    const navigate = useNavigate();
        const [formData, setFormData] = useState({ name: '', description: '', status: 'inactive' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await createPermission(formData);
        navigate('/permissions');
        } catch (err) {
        if (isMissingPermissionError(err)) {
            toast.error('You do not have permission to perform this action.');
            return;
        }
        toast.error('Failed to create permission');
        setError('Failed to create permission');
        }
    };

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faShieldHalved} className="mr-2" />Create Permission</h2>
        <PermissionForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit} 
            error={error}
        />
        </div>
    );
    }

    export default PermissionCreate;