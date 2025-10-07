import React, { useState, useMemo, memo } from 'react';
import { Table, Button, Select, NativeSelect, Paper, Title, TextInput, Group, Pagination } from '@mantine/core';

const UserRow = memo(function UserRow({ user, sections, onRoleChange, onStudentSectionChange, onManageProfessorDepts }) {
    return (
        <Table.Tr key={user.id}>
            <Table.Td data-label="Username">{user.username}</Table.Td>
            <Table.Td data-label="Email">{user.email}</Table.Td>
            <Table.Td data-label="Role">
                <Select
                    data={['student', 'moderator', 'professor', 'super_admin']}
                    value={user.role}
                    onChange={(newRole) => onRoleChange(user.id, newRole)}
                    withinPortal
                />
            </Table.Td>
            <Table.Td data-label="Assignment">
                {(user.role === 'student' || user.role === 'moderator') && (
                    <NativeSelect
                        data={[{ value: '', label: '-- Unassigned --' }, ...sections]}
                        value={user.section_id ? String(user.section_id) : ''}
                        onChange={(e) => onStudentSectionChange(user.id, e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                    />
                )}
                {user.role === 'professor' && (
                    <Button variant="outline" size="xs" onClick={() => onManageProfessorDepts(user)}>
                        Manage Departments ({user.departments_taught.length})
                    </Button>
                )}
            </Table.Td>
        </Table.Tr>
    );
}, (prev, next) => {
    // Only re-render if relevant user fields or sections options have changed.
    const a = prev.user; const b = next.user;
    if (a.id !== b.id) return false;
    if (a.username !== b.username) return false;
    if (a.email !== b.email) return false;
    if (a.role !== b.role) return false;
    if ((a.section_id || null) !== (b.section_id || null)) return false;
    const aDeptLen = Array.isArray(a.departments_taught) ? a.departments_taught.length : 0;
    const bDeptLen = Array.isArray(b.departments_taught) ? b.departments_taught.length : 0;
    if (aDeptLen !== bDeptLen) return false;
    // sections is a memoized array in parent; assume identity stability
    if (prev.sections !== next.sections) return false;
    return true;
});

function UserManagement({ users, sections, onRoleChange, onStudentSectionChange, onManageProfessorDepts }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const filteredUsers = useMemo(() => {
        const searchTermLower = searchTerm.trim().toLowerCase();
        const hasSearch = searchTermLower.length > 0;
        const hasRole = !!roleFilter;
        if (!hasSearch && !hasRole) return users;
        return users.filter(user => {
            const matchesSearch = hasSearch
                ? (user.username.toLowerCase().includes(searchTermLower) || user.email.toLowerCase().includes(searchTermLower))
                : true;
            const matchesRole = hasRole ? user.role === roleFilter : true;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page]);
    
    const rows = paginatedUsers.map((user) => (
        <UserRow
            key={user.id}
            user={user}
            sections={sections}
            onRoleChange={onRoleChange}
            onStudentSectionChange={onStudentSectionChange}
            onManageProfessorDepts={onManageProfessorDepts}
        />
    ));

    return (
        <Paper withBorder shadow="md" p="md" mt="md" radius="md">
            <Title order={4} mb="md">Manage Users</Title>
            <Group grow mb="md">
                <TextInput
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(event) => { setSearchTerm(event.currentTarget.value); setPage(1); }}
                />
                <Select
                    placeholder="Filter by role"
                    data={[
                        { value: '', label: 'All Roles' },
                        'student',
                        'moderator',
                        'professor',
                        'super_admin'
                    ]}
                    value={roleFilter}
                    onChange={(val) => { setRoleFilter(val); setPage(1); }}
                    clearable
                />
            </Group>
            <Group justify="space-between" mb="xs">
                <div />
                <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="md"/>
            </Group>
            <Table.ScrollContainer minWidth={500}>
                <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Role</Table.Th>
                            <Table.Th>Assignment</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows.length > 0 ? rows : (
                        <Table.Tr>
                            <Table.Td colSpan={4}>
                                <div style={{ textAlign: 'center', padding: '20px' }}>No users found.</div>
                            </Table.Td>
                        </Table.Tr>
                    )}</Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Paper>
    );
}

export default UserManagement;