import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

function SectionManagement({ sections, departments, sessions, onAdd, onEdit, onDelete }) {
    const handleAddSection = (e) => {
        e.preventDefault();
        const form = e.target;
        const newSection = {
            name: form.name.value,
            year: parseInt(form.year.value, 10),
            department_id: parseInt(form.department_id.value, 10),
            academic_session_id: parseInt(form.academic_session_id.value, 10)
        };
        onAdd(newSection);
        form.reset();
    };

    return (
        <div className="admin-section">
            <h2>Manage Sections</h2>

            {/* --- Add Section Form --- */}
            <form onSubmit={handleAddSection} className="add-course-form">
                <input type="text" name="name" placeholder="Section Name (e.g., 1, 2, A)" required />
                <input type="number" name="year" placeholder="Year (e.g., 1, 2, 3, 4)" required />
                <select name="department_id" required>
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                <select name="academic_session_id" required>
                    <option value="">Select Session</option>
                    {sessions.map(session => (
                        <option key={session.id} value={session.id}>{session.year_name}</option>
                    ))}
                </select>
                <button type="submit">Add Section</button>
            </form>

            {/* --- Sections Table --- */}
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Section Code</th>
                            <th>Department</th>
                            <th>Year</th>
                            <th>Section</th>
                            <th>Session</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map(sec => (
                            <tr key={sec.id}>
                                <td data-label="Code">{sec.section_code}</td>
                                <td data-label="Department">{sec.department_name}</td>
                                <td data-label="Year">{sec.year}</td>
                                <td data-label="Section">{sec.name}</td>
                                <td data-label="Session">{sec.session_name}</td>
                                <td data-label="Actions">
                                    <button className="action-btn" onClick={() => onEdit(sec)}><FaEdit /></button>
                                    <button className="action-btn" onClick={() => onDelete(sec.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SectionManagement;