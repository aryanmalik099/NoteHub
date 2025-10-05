import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

// This component will be "dumb" - it just receives data and functions as props
function CourseManagement({ courses, onAdd, onEdit, onDelete }) {
    const handleAddCourse = (e) => {
        e.preventDefault();
        const form = e.target;
        const newCourse = {
            name: form.name.value,
            short_name: form.short_name.value,
            duration_years: parseInt(form.duration_years.value, 10)
        };
        onAdd(newCourse);
        form.reset(); // Clear the form after submission
    };

    return (
        <div className="admin-section">
            <h2>Manage Courses</h2>
            
            {/* --- Add Course Form --- */}
            <form onSubmit={handleAddCourse} className="add-course-form">
                <input type="text" name="name" placeholder="Course Name (e.g., Bachelor of Technology)" required />
                <input type="text" name="short_name" placeholder="Short Name (e.g., B.Tech)" required />
                <input type="number" name="duration_years" placeholder="Duration (Years)" required />
                <button type="submit">Add Course</button>
            </form>

            {/* --- Courses Table --- */}
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Short Name</th>
                            <th>Duration</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(course => (
                            <tr key={course.id}>
                                <td data-label="ID">{course.id}</td>
                                <td data-label="Name">{course.name}</td>
                                <td data-label="Short Name">{course.short_name}</td>
                                <td data-label="Duration">{course.duration_years} years</td>
                                <td data-label="Actions">
                                    <button className="action-btn" onClick={() => onEdit(course)}><FaEdit /></button>
                                    <button className="action-btn" onClick={() => onDelete(course.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default CourseManagement;