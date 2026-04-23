    import React, { useState, useEffect, useCallback } from "react";
    import { Offcanvas, Button, Form } from "react-bootstrap";
    import { getUser, updateUser } from "../api/userApi";
    import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
    import { faIdBadge } from "@fortawesome/free-solid-svg-icons";
    import { toast } from 'react-toastify';

    const UserProfilePanel = ({ show, handleClose, userId }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        address: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Fetch current user profile
    const fetchProfile = useCallback(async () => {
        try {
        const { data } = await getUser(userId);
        setFormData({
            ...data,
            password: "",
            confirmPassword: "",
        });
        } catch (err) {
        console.error("Error fetching profile:", err);
        }
    }, [userId]);

    useEffect(() => {
        if (show && userId) {
        fetchProfile();
        }
    }, [show, userId, fetchProfile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
        await updateUser(userId, {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            email: formData.email,
        });
        toast.success('Profile updated successfully');
        handleClose();
        } catch (err) {
        console.error("Error updating profile:", err);
        toast.error(err.response?.data?.error || 'Failed to update profile');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
        }
        try {
        await updateUser(userId, { password: formData.password });
        toast.success('Password updated successfully');
        setFormData({ ...formData, password: "", confirmPassword: "" });
        } catch (err) {
        console.error("Error updating password:", err);
        toast.error(err.response?.data?.error || 'Failed to update password');
        }
    };

    return (
        <Offcanvas show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
            <Offcanvas.Title>
            <FontAwesomeIcon icon={faIdBadge} title="Profile" aria-label="Profile" />
            </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <h5 className="mb-3">Update Profile</h5>
            <Form onSubmit={handleUpdateProfile}>
            {["firstName", "middleName", "lastName", "phoneNumber", "address", "email"].map(
                (field) => (
                <Form.Group className="mb-3" controlId={field} key={field}>
                    <Form.Label className="text-capitalize">{field}</Form.Label>
                    <Form.Control
                    type="text"
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    required={["firstName", "lastName", "phoneNumber", "email"].includes(field)}
                    />
                </Form.Group>
                )
            )}
            <Button variant="primary" type="submit" className="w-100">
                Save Profile
            </Button>
            </Form>

            <hr />

            <h5 className="mb-3">Change Password</h5>
            <Form onSubmit={handleUpdatePassword}>
            <Form.Group className="mb-3" controlId="password">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                />
            </Form.Group>
            <Button variant="warning" type="submit" className="w-100">
                Update Password
            </Button>
            </Form>
        </Offcanvas.Body>
        </Offcanvas>
    );
    };

    export default UserProfilePanel;
