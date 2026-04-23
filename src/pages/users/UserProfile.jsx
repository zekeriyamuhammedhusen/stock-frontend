    import React, { useState, useEffect } from 'react';
    import { useParams, Link } from 'react-router-dom';
    import { getUser } from '../../api/userApi';
    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    import { faIdBadge, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
    import { toast } from 'react-toastify';

    function UserProfile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
        try {
            const response = await getUser(id);
            setUser(response.data);
        } catch {
            toast.error('Failed to fetch user');
            setError('Failed to fetch user');
        }
        };
        fetchUser();
    }, [id]);

    if (!user) return <div className="container mx-auto p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4"><FontAwesomeIcon icon={faIdBadge} className="mr-2" />User Profile</h2>
        <div className="bg-white p-6 rounded-md shadow max-w-lg">
            <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
            <p>Email: {user.email}</p>
            <p>Phone: {user.phoneNumber}</p>
            <p>Address: {user.address}</p>
            <Link to="/users" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Back to Users
            </Link>
        </div>
        </div>
    );
    }

    export default UserProfile;