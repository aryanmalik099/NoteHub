import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import MultiSelectModal from './MultiSelectModal';
import ActivityLog from './ActivityLog';
import CourseManagement from './CourseManagement';
import DepartmentManagement from './DepartmentManagement';
import AcademicSessionManagement from './AcademicSessionManagement';
import SectionManagement from './SectionManagement';
import './EditNoteModal.css';

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
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const departmentOptions = departments.map(d => ({ value: d.id, label: `${d.name} (${d.course_short_name})` }));
    const [sessions, setSessions] = useState([]);
    const [sections, setSections] = useState([]);
    const sectionOptions = sections.map(s => ({ value: s.id, label: `${s.section_code} (${s.session_name})` }));

    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [currentUserForModal, setCurrentUserForModal] = useState(null);

    const fetchData = async () => {
        try {
            const [usersResponse, statsResponse, coursesResponse, departmentsResponse, sessionsResponse, sectionsResponse] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats'),
                api.get('/admin/courses'),
                api.get('/admin/departments'),
                api.get('/admin/sessions'),
                api.get('/admin/sections')
            ]);

            const enhancedUsers = usersResponse.data.map(user => ({
                ...user,
                section_id: user.section_id || null,
                departments_taught: user.departments_taught || []
            }));

            setUsers(enhancedUsers);
            setStats(statsResponse.data);
            setCourses(coursesResponse.data);
            setDepartments(departmentsResponse.data);
            setSessions(sessionsResponse.data);
            setSections(sectionsResponse.data);

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

    const handleAddCourse = async (courseData) => {
        try {
            await api.post('/admin/courses', courseData);
            toast.success('Course added successfully!');
            fetchData(); // Refresh all data
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add course.');
        }
    };

    const handleEditCourse = async (course) => {
        const newName = prompt("Enter new course name:", course.name);
        const newShortName = prompt("Enter new short name:", course.short_name);
        const newDuration = prompt("Enter new duration (years):", course.duration_years);

        if (newName && newShortName && newDuration) {
            try {
                await api.put(`/admin/courses/${course.id}`, {
                    name: newName,
                    short_name: newShortName,
                    duration_years: parseInt(newDuration, 10)
                });
                toast.success('Course updated!');
                fetchData();
            } catch (error) {
                toast.error('Failed to update course.');
            }
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await api.delete(`/admin/courses/${courseId}`);
                toast.success('Course deleted!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete course.');
            }
        }
    };

    const handleAddDepartment = async (deptData) => {
        try {
            await api.post('/admin/departments', deptData);
            toast.success('Department added successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add department.');
        }
    };

    const handleEditDepartment = async (dept) => {
        const newName = prompt("Enter new department name:", dept.name);
        const newShortName = prompt("Enter new short name:", dept.short_name);

        if (newName && newShortName) {
            try {
                await api.put(`/admin/departments/${dept.id}`, {
                    name: newName,
                    short_name: newShortName,
                    course_id: dept.course_id
                });
                toast.success('Department updated!');
                fetchData();
            } catch (error) {
                toast.error('Failed to update department.');
            }
        }
    };

    const handleDeleteDepartment = async (deptId) => {
        if (window.confirm("Are you sure you want to delete this department?")) {
            try {
                await api.delete(`/admin/departments/${deptId}`);
                toast.success('Department deleted!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete department.');
            }
        }
    };

    const handleAddSession = async (sessionData) => {
        try {
            await api.post('/admin/sessions', sessionData);
            toast.success('Academic Session added!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add session.');
        }
    };

    const handleSetActiveSession = async (session) => {
        if (!window.confirm(`Are you sure you want to set ${session.year_name} as the active session?`)) return;
        try {
            await api.put(`/admin/sessions/${session.id}`, { ...session, is_active: true });
            toast.success(`${session.year_name} is now the active session.`);
            fetchData();
        } catch (error) {
            toast.error('Failed to set active session.');
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (window.confirm("Are you sure? This action cannot be undone.")) {
            try {
                await api.delete(`/admin/sessions/${sessionId}`);
                toast.success('Academic Session deleted!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete session.');
            }
        }
    };

    const handleAddSection = async (sectionData) => {
        try {
            await api.post('/admin/sections', sectionData);
            toast.success('Section added successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add section.');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (window.confirm("Are you sure you want to delete this section?")) {
            try {
                await api.delete(`/admin/sections/${sectionId}`);
                toast.success('Section deleted!');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Failed to delete section.');
            }
        }
    };

    const handleEditSection = async (section) => {
        const newName = prompt("Enter new section name (e.g., 'A', '1'):", section.name);
        const newYear = prompt("Enter new year (e.g., 1, 2, 3, 4):", section.year);

        if (newName && newYear) {
            try {
                await api.put(`/admin/sections/${section.id}`, {
                    ...section,
                    name: newName,
                    year: parseInt(newYear, 10)
                });
                toast.success('Section updated!');
                fetchData();
            } catch (error) {
                toast.error('Failed to update section.');
            }
        }
    };

    const handleStudentSectionChange = async (userId, sectionId) => {
        try {
            await api.put(`/admin/students/${userId}/section`, { section_id: sectionId });
            toast.success("Student's section updated!");
            fetchData(); // Refresh all data to ensure consistency
        } catch (error) {
            toast.error("Failed to update student's section.");
        }
    };

    const handleProfessorDeptsChange = async (selectedOptions) => {
        const departmentIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        try {
            await api.put(`/admin/professors/${currentUserForModal.id}/departments`, { department_ids: departmentIds });
            toast.success("Professor's departments updated!");
            fetchData();
        } catch (error) {
            toast.error("Failed to update professor's departments.");
        } finally {
            setIsDeptModalOpen(false);
        }
    };
    
    const openDeptModal = (user) => {
        setCurrentUserForModal(user);
        setIsDeptModalOpen(true);
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

            <AcademicSessionManagement
                sessions={sessions}
                onAdd={handleAddSession}
                onSetActive={handleSetActiveSession}
                onDelete={handleDeleteSession}
            />

            <hr className="form-divider" />

            <CourseManagement 
                courses={courses}
                onAdd={handleAddCourse}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
            />

            <hr className="form-divider" />

            <DepartmentManagement
                departments={departments}
                courses={courses}
                onAdd={handleAddDepartment}
                onEdit={handleEditDepartment}
                onDelete={handleDeleteDepartment}
            />

            <hr className="form-divider" />

            <SectionManagement
                sections={sections}
                departments={departments}
                sessions={sessions}
                onAdd={handleAddSection}
                onEdit={handleEditSection}
                onDelete={handleDeleteSection}
            />

            <hr className="form-divider" />
            
            <ActivityLog />
            
            <hr className="form-divider" />

            <h2>User Management</h2>
            <div className="log-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Assignment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td data-label="Username">{user.username}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Role">
                                    <select onChange={(e) => handleRoleChange(user.id, e.target.value)} value={user.role}>
                                        <option value="student">Student</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="professor">Professor</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </td>
                                <td data-label="Assignment">
                                    {user.role === 'student' && (
                                        <select
                                            value={user.section_id || ''}
                                            onChange={(e) => handleStudentSectionChange(user.id, e.target.value ? parseInt(e.target.value, 10) : null)}
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {sectionOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    )}
                                    {user.role === 'professor' && (
                                        <button onClick={() => openDeptModal(user)}>
                                            Manage Departments ({user.departments_taught.length})
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isDeptModalOpen && (
                <MultiSelectModal
                    title={`Assign Departments for ${currentUserForModal.username}`}
                    options={departmentOptions}
                    selected={currentUserForModal.departments_taught}
                    onSave={handleProfessorDeptsChange}
                    onCancel={() => setIsDeptModalOpen(false)}
                />
            )}
        </div>
    );
}

export default AdminPanel;