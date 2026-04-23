    import React, { useState, useEffect } from 'react';
    import { useNavigate, useParams } from 'react-router-dom';
    import PermissionForm from '../../components/PermissionForm';
    import { getPermission, updatePermission } from '../../api/permissionApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';
    import { isMissingPermissionError } from '../../utils/errorUtils';

    function PermissionEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPermission = async () => {
        try {
            const response = await getPermission(id);
            setFormData(response.data.data);
        } catch (err) {
            if (isMissingPermissionError(err)) {
                toast.error('You do not have permission to perform this action.');
                return;
            }
            toast.error('Failed to fetch permission');
            setError('Failed to fetch permission');
        }
        };
        fetchPermission();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        await updatePermission(id, formData);
        navigate('/permissions');
        } catch (err) {
        if (isMissingPermissionError(err)) {
            toast.error('You do not have permission to perform this action.');
            return;
        }
        toast.error('Failed to update permission');
        setError('Failed to update permission');
        }
    };

    if (!formData) return <div className="container mx-auto p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faShieldHalved} className="mr-2" />Edit Permission</h2>
        <PermissionForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleSubmit} 
            error={error}
        />
        </div>
    );
    }

    export default PermissionEdit;