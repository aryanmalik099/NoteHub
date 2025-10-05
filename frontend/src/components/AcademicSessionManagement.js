import React from 'react';
import { FaTrash } from 'react-icons/fa';

function AcademicSessionManagement({ sessions, onAdd, onSetActive, onDelete }) {
    const handleAddSession = (e) => {
        e.preventDefault();
        const form = e.target;
        const newSession = {
            year_name: form.year_name.value,
            is_active: form.is_active.checked
        };
        onAdd(newSession);
        form.reset();
    };

    return (
        <div className="admin-section">
            <h2>Manage Academic Sessions</h2>

            {/* --- Add Session Form --- */}
            <form onSubmit={handleAddSession} className="add-course-form">
                <input type="text" name="year_name" placeholder="Session Name (e.g., 2025-2026)" required />
                <div className="form-group checkbox-group">
                    <input type="checkbox" id="is_active" name="is_active" />
                    <label htmlFor="is_active">Set as Active Session</label>
                </div>
                <button type="submit">Add Session</button>
            </form>

            {/* --- Sessions Table --- */}
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Session Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(session => (
                            <tr key={session.id} className={session.is_active ? 'active-row' : ''}>
                                <td data-label="ID">{session.id}</td>
                                <td data-label="Session Name">{session.year_name}</td>
                                <td data-label="Status">
                                    {session.is_active ? (
                                        <span className="status-active">● Active</span>
                                    ) : (
                                        <button className="action-btn" onClick={() => onSetActive(session)}>Set Active</button>
                                    )}
                                </td>
                                <td data-label="Actions">
                                    <button className="action-btn" onClick={() => onDelete(session.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AcademicSessionManagement;