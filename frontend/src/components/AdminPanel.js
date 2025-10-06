import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Container, Title, Tabs, Loader, Center, Modal, TextInput, NumberInput, Group, Button, Select } from '@mantine/core';

import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import DepartmentManagement from './DepartmentManagement';
import AcademicSessionManagement from './AcademicSessionManagement';
import SectionManagement from './SectionManagement';
import ActivityLog from './ActivityLog';

import MultiSelectModal from './MultiSelectModal';

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [currentUserForModal, setCurrentUserForModal] = useState(null);
    
    const courseOptions = courses.map(c => ({ value: String(c.id), label: c.name }));
    const departmentOptions = departments.map(d => ({ value: String(d.id), label: `${d.name} (${d.course_short_name})` }));
    const sectionOptions = sections.map(s => ({ value: String(s.id), label: `${s.section_code} (${s.session_name})` }));
    const sessionOptions = sessions.map(s => ({ value: String(s.id), label: s.year_name }));
    
    const fetchData = useCallback(async () => {
        try {
            const [usersResponse, coursesResponse, departmentsResponse, sessionsResponse, sectionsResponse] = await Promise.all([
                api.get('/admin/users'),
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
            setCourses(coursesResponse.data);
            setDepartments(departmentsResponse.data);
            setSessions(sessionsResponse.data);
            setSections(sectionsResponse.data);

        } catch (error) {
            toast.error('You do not have permission to view this page.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const openEditModal = (item, type) => {
        setEditingItem({ ...item, type }); // Store the item and its type (e.g., 'course')
        setIsEditModalOpen(true);
    };

    // --- REFACTORED: Single function to handle all update API calls ---
    const handleUpdate = async () => {
        if (!editingItem) return;
        
        const { type, id, ...data } = editingItem;
        let endpoint = '';
        let payload = {};

        // Determine the correct API endpoint and payload based on the item's type
        switch (type) {
            case 'course':
                endpoint = `/admin/courses/${id}`;
                payload = { name: data.name, short_name: data.short_name, duration_years: Number(data.duration_years) };
                break;
            case 'department':
                endpoint = `/admin/departments/${id}`;
                payload = { name: data.name, short_name: data.short_name, course_id: Number(data.course_id) };
                break;
            case 'section':
                endpoint = `/admin/sections/${id}`;
                payload = { name: data.name, year: Number(data.year), department_id: Number(data.department_id), academic_session_id: Number(data.academic_session_id) };
                break;
            default:
                toast.error("Unknown item type.");
                return;
        }

        try {
            await api.put(endpoint, payload);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(`Failed to update ${type}.`);
        }
    };
    const handleEditFormChange = (field, value) => {
        setEditingItem(currentItem => ({
            ...currentItem,
            [field]: value
        }));
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

    if (loading) {
        return <Center style={{ height: 300 }}><Loader /></Center>;
    }

    return (
        <Container fluid my="md">
            <Title order={2} mb="xl">Admin Panel</Title>
            <Tabs defaultValue="courses">
                <Tabs.List>
                    <Tabs.Tab value="users">Users</Tabs.Tab>
                    <Tabs.Tab value="courses">Courses</Tabs.Tab>
                    <Tabs.Tab value="departments">Departments</Tabs.Tab>
                    <Tabs.Tab value="sessions">Sessions</Tabs.Tab>
                    <Tabs.Tab value="sections">Sections</Tabs.Tab>
                    <Tabs.Tab value="logs">Activity Logs</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="users" pt="lg">
                   <UserManagement
                        users={users}
                        sections={sectionOptions}
                        onRoleChange={handleRoleChange}
                        onStudentSectionChange={handleStudentSectionChange}
                        onManageProfessorDepts={openDeptModal}
                   />
                </Tabs.Panel>
                
                <Tabs.Panel value="courses" pt="lg">
                    <CourseManagement 
                        courses={courses}
                        onAdd={handleAddCourse}
                        onEdit={(item) => openEditModal(item, 'course')}
                        onDelete={handleDeleteCourse}
                    />
                </Tabs.Panel>
                
                <Tabs.Panel value="departments" pt="lg">
                    <DepartmentManagement
                        departments={departments}
                        courses={courses}
                        onAdd={handleAddDepartment}
                        onEdit={(item) => openEditModal(item, 'department')}
                        onDelete={handleDeleteDepartment}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="sessions" pt="lg">
                    <AcademicSessionManagement
                        sessions={sessions}
                        onAdd={handleAddSession}
                        onSetActive={handleSetActiveSession}
                        onDelete={handleDeleteSession}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="sections" pt="lg">
                    <SectionManagement
                        sections={sections}
                        departments={departments}
                        sessions={sessions}
                        onAdd={handleAddSection}
                        onEdit={(item) => openEditModal(item, 'section')}
                        onDelete={handleDeleteSection}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="logs" pt="lg">
                    <ActivityLog />
                </Tabs.Panel>
            </Tabs>

            <Modal opened={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${editingItem?.type || ''}`}>
                {editingItem && (
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                        {/* Dynamically render form fields using the new, safe handler */}
                        {editingItem.type === 'course' && (
                            <>
                                <TextInput label="Course Name" required value={editingItem.name} onChange={(e) => handleEditFormChange('name', e.currentTarget.value)} />
                                <TextInput label="Short Name" required mt="md" value={editingItem.short_name} onChange={(e) => handleEditFormChange('short_name', e.currentTarget.value)} />
                                <NumberInput label="Duration (Years)" required mt="md" value={editingItem.duration_years} onChange={(val) => handleEditFormChange('duration_years', val)} min={1} />
                            </>
                        )}
                        {editingItem.type === 'department' && (
                            <>
                                <TextInput label="Department Name" required value={editingItem.name} onChange={(e) => handleEditFormChange('name', e.currentTarget.value)} />
                                <TextInput label="Short Name" required mt="md" value={editingItem.short_name} onChange={(e) => handleEditFormChange('short_name', e.currentTarget.value)} />
                                <Select label="Parent Course" required mt="md" data={courseOptions} value={String(editingItem.course_id)} onChange={(val) => handleEditFormChange('course_id', val)} />
                            </>
                        )}
                        {editingItem.type === 'section' && (
                            <>
                                <TextInput label="Section Name" required value={editingItem.name} onChange={(e) => handleEditFormChange('name', e.currentTarget.value)} />
                                <NumberInput label="Year" required mt="md" value={editingItem.year} onChange={(val) => handleEditFormChange('year', val)} />
                                <Select label="Department" required mt="md" data={departmentOptions} value={String(editingItem.department_id)} onChange={(val) => handleEditFormChange('department_id', val)} />
                                <Select label="Academic Session" required mt="md" data={sessionOptions} value={String(editingItem.academic_session_id)} onChange={(val) => handleEditFormChange('academic_session_id', val)} />
                            </>
                        )}

                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </Group>
                    </form>
                )}
            </Modal>

            {isDeptModalOpen && (
                <MultiSelectModal
                    title={`Assign Departments for ${currentUserForModal.username}`}
                    options={departmentOptions}
                    selected={currentUserForModal.departments_taught}
                    onSave={handleProfessorDeptsChange}
                    onCancel={() => setIsDeptModalOpen(false)}
                />
            )}
        </Container>
    );
}

export default AdminPanel;