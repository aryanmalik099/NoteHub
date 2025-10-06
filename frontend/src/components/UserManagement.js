import React from 'react';
import { Table, Button, Select, Paper, Title } from '@mantine/core';

function UserManagement({ users, sections, onRoleChange, onStudentSectionChange, onManageProfessorDepts }) {
    
    const rows = users.map((user) => (
        <Table.Tr key={user.id}>
            <Table.Td>{user.username}</Table.Td>
            <Table.Td>{user.email}</Table.Td>
            <Table.Td>
                <Select
                    data={['student', 'moderator', 'professor', 'super_admin']}
                    value={user.role}
                    onChange={(newRole) => onRoleChange(user.id, newRole)}
                />
            </Table.Td>
            <Table.Td>
                {user.role === 'student' && (
                    <Select
                        placeholder="Assign section"
                        data={[{ value: '', label: '-- Unassigned --' }, ...sections]}
                        value={user.section_id ? String(user.section_id) : ''}
                        onChange={(sectionId) => onStudentSectionChange(user.id, sectionId ? Number(sectionId) : null)}
                        searchable
                    />
                )}
                {user.role === 'professor' && (
                    <Button variant="outline" size="xs" onClick={() => onManageProfessorDepts(user)}>
                        Manage Departments ({user.departments_taught.length})
                    </Button>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="md" p={30} mt="md" radius="md">
            <Title order={4} mb="md">Manage Users</Title>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Username</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>Assignment</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Paper>
    );
}

export default UserManagement;