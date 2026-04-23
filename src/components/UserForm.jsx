    import React from 'react';

    function UserForm({ formData, setFormData, onSubmit, error, isEdit }) {
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg mx-auto">
        {error && <div className="text-red-500">{error}</div>}
        <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter first name"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">Middle Name</label>
            <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter middle name"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter last name"
            />
        </div>
        {!isEdit && (
            <>
            <div>
                <label className="block text-sm font-medium">Phone Number</label>
                <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
                placeholder="Enter phone number"
                />
            </div>
            <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
                placeholder="Enter email"
                />
            </div>
            </>
        )}
        <div>
            <label className="block text-sm font-medium">Address</label>
            <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter address"
            />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            {isEdit ? 'Update' : 'Create'} User
        </button>
        </form>
    );
    }

    export default UserForm;