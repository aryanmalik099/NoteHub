import React, { useState } from 'react';
import { Table, Button, Group, TextInput, Checkbox, Paper, Title, Badge } from '@mantine/core';

function AcademicSessionManagement({ sessions, onAdd, onSetActive, onDelete }) {
    const [yearName, setYearName] = useState('');
    const [isActive, setIsActive] = useState(false);

    const handleAddSessionSubmit = (e) => {
        e.preventDefault();
        onAdd({
            year_name: yearName,
            is_active: isActive
        });
        setYearName('');
        setIsActive(false);
    };

    const rows = sessions.map((session) => (
        <Table.Tr key={session.id} bg={session.is_active ? 'var(--mantine-color-blue-light)' : undefined}>
            <Table.Td>{session.id}</Table.Td>
            <Table.Td>{session.year_name}</Table.Td>
            <Table.Td>
                {session.is_active ? (
                    <Badge color="green">Active</Badge>
                ) : (
                    <Button variant="outline" size="xs" onClick={() => onSetActive(session)}>
                        Set Active
                    </Button>
                )}
            </Table.Td>
            <Table.Td>
                <Button variant="outline" color="red" size="xs" onClick={() => onDelete(session.id)}>
                    Delete
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Paper withBorder shadow="md" p={30} mt="md" radius="md">
                <Title order={4} mb="md">Add New Academic Session</Title>
                <form onSubmit={handleAddSessionSubmit}>
                    <Group grow align="flex-end">
                        <TextInput
                            label="Session Name"
                            placeholder="e.g., 2025-2026"
                            required
                            value={yearName}
                            onChange={(e) => setYearName(e.currentTarget.value)}
                        />
                        <Checkbox
                            label="Set as Active Session"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.currentTarget.checked)}
                        />
                    </Group>
                    <Button type="submit" mt="md">Add Session</Button>
                </form>
            </Paper>

            <Paper withBorder shadow="md" p={30} mt="xl" radius="md">
                <Title order={4} mb="md">Existing Academic Sessions</Title>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Session Name</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}

export default AcademicSessionManagement;