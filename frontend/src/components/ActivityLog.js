import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAction, setSelectedAction] = useState('');

    const logActions = [
        'user_signup',
        'user_login',
        'note_upload',
        'note_delete',
        'admin_role_change'
    ];

    useEffect(() => {
        const fetchLogs = async () => {
            if (!selectedDate) return;
            setLoading(true);
            try {
                const params = { day: selectedDate };
                if (selectedAction) {
                    params.action = selectedAction;
                }

                const response = await api.get('/admin/logs', { params });
                setLogs(response.data);
            } catch (error) {
                toast.error('Failed to fetch activity logs.');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [selectedDate, selectedAction]);

    return (
        <div className="admin-panel activity-log-container">
            <h3>Activity Logs</h3>
            <div className="log-filters">
                <div className="form-group">
                    <label htmlFor="log-date">Select Date:</label>
                    <input
                        id="log-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="log-action">Filter by Action:</label>
                    <select
                        id="log-action"
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        {logActions.map(action => (
                            <option key={action} value={action}>{action.replace('_', ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <p>Loading logs...</p>
            ) : (
                <div className="log-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td data-label="Timestamp">{log.timestamp}</td>
                                        <td data-label="User">{log.username}</td>
                                        <td data-label="Action">{log.action}</td>
                                        <td data-label="Details">{log.details}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No activity recorded for the selected filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ActivityLog;