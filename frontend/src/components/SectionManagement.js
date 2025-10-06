import React, { useState } from 'react';
import { Table, Button, Group, TextInput, Select, NumberInput, Paper, Title, Grid } from '@mantine/core';

function SectionManagement({ sections, departments, sessions, onAdd, onEdit, onDelete}) {
    // State for the "Add Section" form
    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [sessionId, setSessionId] = useState('');

    const handleAddSectionSubmit = (e) => {
        e.preventDefault();
        onAdd({
            name: name,
            year: Number(year),
            department_id: Number(departmentId),
            academic_session_id: Number(sessionId)
        });
        setName('');
        setYear('');
        setDepartmentId('');
        setSessionId('');
    };

    const departmentOptions = departments.map(dept => ({
        value: String(dept.id),
        label: dept.name
    }));

    const sessionOptions = sessions.map(session => ({
        value: String(session.id),
        label: session.year_name
    }));

    const rows = sections.map((sec) => (
        <Table.Tr key={sec.id}>
            <Table.Td>{sec.section_code}</Table.Td>
            <Table.Td>{sec.department_name}</Table.Td>
            <Table.Td>{sec.year}</Table.Td>
            <Table.Td>{sec.name}</Table.Td>
            <Table.Td>{sec.session_name}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button variant="outline" size="xs" onClick={() => onEdit(sec)}>Edit</Button>
                    <Button variant="outline" color="red" size="xs" onClick={() => onDelete(sec.id)}>Delete</Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Paper withBorder shadow="md" p={30} mt="md" radius="md">
                <Title order={4} mb="md">Add New Section</Title>
                <form onSubmit={handleAddSectionSubmit}>
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <TextInput
                                label="Section Name"
                                placeholder="e.g., 1, 2, A"
                                required
                                value={name}
                                onChange={(e) => setName(e.currentTarget.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <NumberInput
                                label="Year"
                                placeholder="e.g., 1, 2, 3, 4"
                                required
                                value={year}
                                onChange={setYear}
                                min={1}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Select
                                label="Department"
                                placeholder="Select a department"
                                required
                                data={departmentOptions}
                                value={departmentId}
                                onChange={setDepartmentId}
                                searchable
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Select
                                label="Academic Session"
                                placeholder="Select a session"
                                required
                                data={sessionOptions}
                                value={sessionId}
                                onChange={setSessionId}
                                searchable
                            />
                        </Grid.Col>
                    </Grid>
                    <Button type="submit" mt="md">Add Section</Button>
                </form>
            </Paper>

            <Paper withBorder shadow="md" p={30} mt="xl" radius="md">
                <Title order={4} mb="md">Existing Sections</Title>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Section Code</Table.Th>
                            <Table.Th>Department</Table.Th>
                            <Table.Th>Year</Table.Th>
                            <Table.Th>Section</Table.Th>
                            <Table.Th>Session</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}

export default SectionManagement;