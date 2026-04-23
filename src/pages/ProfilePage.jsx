    import React, { useEffect, useState } from "react";
    import { getUser } from "../api/userApi";

    const ProfilePage = ({ userId }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const { data } = await getUser(userId);
            setUser(data);
        } catch (err) {
            console.error("Error loading profile", err);
        }
        };
        if (userId) fetchProfile();
    }, [userId]);

    if (!user) return <p>Loading...</p>;

    return (
        <div className="container mt-5">
        <h2>My Profile</h2>
        <div className="card">
            <div className="card-body">
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phoneNumber}</p>
            <p><strong>Address:</strong> {user.address}</p>
            </div>
        </div>
        </div>
    );
    };

    export default ProfilePage;
