import React, { useState } from 'react';
import { Table, Button, Group, TextInput, Select, Paper, Title } from '@mantine/core';

function DepartmentManagement({ departments, courses, onAdd, onEdit, onDelete }) {
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [courseId, setCourseId] = useState('');

    const handleAddDepartmentSubmit = (e) => {
        e.preventDefault();
        onAdd({
            name: name,
            short_name: shortName,
            course_id: Number(courseId)
        });
        setName('');
        setShortName('');
        setCourseId('');
    };

    const courseOptions = courses.map(course => ({
        value: String(course.id),
        label: `${course.name} (${course.short_name})`
    }));

    const rows = departments.map((dept) => (
        <Table.Tr key={dept.id}>
            <Table.Td>{dept.id}</Table.Td>
            <Table.Td>{dept.name}</Table.Td>
            <Table.Td>{dept.short_name}</Table.Td>
            <Table.Td>{dept.course_short_name}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button variant="outline" size="xs" onClick={() => onEdit(dept)}>Edit</Button>
                    <Button variant="outline" color="red" size="xs" onClick={() => onDelete(dept.id)}>Delete</Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Paper withBorder shadow="md" p={30} mt="md" radius="md">
                <Title order={4} mb="md">Add New Department</Title>
                <form onSubmit={handleAddDepartmentSubmit}>
                    <Group grow>
                        <TextInput
                            label="Department Name"
                            placeholder="e.g., Computer Science"
                            required
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Short Name"
                            placeholder="e.g., CSE"
                            required
                            value={shortName}
                            onChange={(e) => setShortName(e.currentTarget.value)}
                        />
                        <Select
                            label="Parent Course"
                            placeholder="Select a course"
                            required
                            data={courseOptions}
                            value={courseId}
                            onChange={setCourseId}
                            searchable
                        />
                    </Group>
                    <Button type="submit" mt="md">Add Department</Button>
                </form>
            </Paper>

            <Paper withBorder shadow="md" p={30} mt="xl" radius="md">
                <Title order={4} mb="md">Existing Departments</Title>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Short Name</Table.Th>
                            <Table.Th>Course</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </div>
    );
}

export default DepartmentManagement;