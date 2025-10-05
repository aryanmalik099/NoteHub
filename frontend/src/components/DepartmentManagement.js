import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

function DepartmentManagement({ departments, courses, onAdd, onEdit, onDelete }) {
    const handleAddDepartment = (e) => {
        e.preventDefault();
        const form = e.target;
        const newDepartment = {
            name: form.name.value,
            short_name: form.short_name.value,
            course_id: parseInt(form.course_id.value, 10)
        };
        onAdd(newDepartment);
        form.reset();
    };

    return (
        <div className="admin-section">
            <h2>Manage Departments</h2>

            {/* --- Add Department Form --- */}
            <form onSubmit={handleAddDepartment} className="add-course-form">
                <input type="text" name="name" placeholder="Department Name (e.g., Computer Science)" required />
                <input type="text" name="short_name" placeholder="Short Name (e.g., CSE)" required />
                <select name="course_id" required>
                    <option value="">Select Course</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.name} ({course.short_name})
                        </option>
                    ))}
                </select>
                <button type="submit">Add Department</button>
            </form>

            {/* --- Departments Table --- */}
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Short Name</th>
                            <th>Course</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map(dept => (
                            <tr key={dept.id}>
                                <td data-label="ID">{dept.id}</td>
                                <td data-label="Name">{dept.name}</td>
                                <td data-label="Short Name">{dept.short_name}</td>
                                <td data-label="Course">{dept.course_short_name}</td>
                                <td data-label="Actions">
                                    <button className="action-btn" onClick={() => onEdit(dept)}><FaEdit /></button>
                                    <button className="action-btn" onClick={() => onDelete(dept.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DepartmentManagement;