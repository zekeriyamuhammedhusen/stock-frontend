    import React from 'react';

    function RoleForm({ formData, setFormData, onSubmit, error }) {
    const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? (checked ? 'active' : 'inactive') : value,
            });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg mx-auto">
        <div>
            <label className="block text-sm font-medium">Role Name</label>
            <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
            placeholder="Enter role name"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter role description"
            />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
            <input
            type="checkbox"
            name="status"
            checked={formData.status === 'active'}
            onChange={handleChange}
            />
            Active
        </label>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            {formData.id ? 'Update' : 'Create'} Role
        </button>
        </form>
    );
    }

    export default RoleForm;