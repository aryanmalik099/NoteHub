import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import ActivityLog from './ActivityLog';

function StatCard({ title, value }) {
    return (
        <div className="stat-card">
            <h4>{title}</h4>
            <p>{value}</p>
        </div>
    );
}

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Fetch both users and stats at the same time
            const [usersResponse, statsResponse] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats')
            ]);
            setUsers(usersResponse.data);
            setStats(statsResponse.data);
        } catch (error) {
            toast.error('You do not have permission to view this page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        try {
            const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success(response.data.message);
            fetchData();
        } catch (error) {
            toast.error('Failed to update user role.');
        }
    };

    if (loading) return <div>Loading Admin Panel...</div>;

    return (
        <div className="admin-panel form-container-admin">
            {stats && (
                <div className="dashboard-section">
                    <h2>Dashboard</h2>
                    <div className="stats-grid">
                        <StatCard title="Total Users" value={stats.total_users} />
                        <StatCard title="Total Notes" value={stats.total_notes} />
                    </div>
                    <div className="recent-activity-grid">
                        <div>
                            <h4>Recent Registrations</h4>
                            <ul>{stats.recent_users.map(u => <li key={u.id}>{u.username} ({u.email})</li>)}</ul>
                        </div>
                        <div>
                            <h4>Recent Uploads</h4>
                            <ul>{stats.recent_notes.map(n => <li key={n.id}>{n.title} (by {n.author})</li>)}</ul>
                        </div>
                    </div>
                </div>
            )}

            <hr className="form-divider" />
            
            <ActivityLog />
            
            <hr className="form-divider" />

            <h2>User Management</h2>
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Current Role</th>
                            <th>Change Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td data-label="ID">{user.id}</td>
                                <td data-label="Username">{user.username}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Role">{user.role}</td>
                                <td data-label="Change Role">
                                    <select onChange={(e) => handleRoleChange(user.id, e.target.value)} value={user.role}>
                                        <option value="student">Student</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="professor">Professor</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminPanel;