import React, { useState } from 'react';
import { Table, Button, Group, TextInput, NumberInput, Paper, Title } from '@mantine/core';

// This component is now a "presentational" component. 
// It receives data and functions from its parent (AdminPanel).
function CourseManagement({ courses, onAdd, onEdit, onDelete }) {
    // State for the "Add Course" form
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [duration, setDuration] = useState('');

    const handleAddCourse = (e) => {
        e.preventDefault();
        onAdd({
            name: name,
            short_name: shortName,
            duration_years: Number(duration)
        });
        // Clear the form
        setName('');
        setShortName('');
        setDuration('');
    };

    const rows = courses.map((course) => (
        <Table.Tr key={course.id}>
            <Table.Td data-label="ID">{course.id}</Table.Td>
            <Table.Td data-label="Name">{course.name}</Table.Td>
            <Table.Td data-label="Short Name">{course.short_name}</Table.Td>
            <Table.Td data-label="Duration">{course.duration_years} years</Table.Td>
            <Table.Td data-label="Actions">
                <Group gap="xs">
                    <Button variant="outline" size="xs" onClick={() => onEdit(course)}>Edit</Button>
                    <Button variant="outline" color="red" size="xs" onClick={() => onDelete(course.id)}>Delete</Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Paper withBorder shadow="md" p="md" mt="md" radius="md">
                <Title order={4} mb="md">Add New Course</Title>
                <form onSubmit={handleAddCourse}>
                    <Group grow>
                        <TextInput
                            label="Course Name"
                            placeholder="e.g., Bachelor of Technology"
                            required
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Short Name"
                            placeholder="e.g., B.Tech"
                            required
                            value={shortName}
                            onChange={(e) => setShortName(e.currentTarget.value)}
                        />
                        <NumberInput
                            label="Duration (Years)"
                            placeholder="e.g., 4"
                            required
                            value={duration}
                            onChange={setDuration}
                            min={1}
                        />
                    </Group>
                    <Button type="submit" mt="md">Add Course</Button>
                </form>
            </Paper>

            <Paper withBorder shadow="md" p="md" mt="xl" radius="md">
                <Title order={4} mb="md">Existing Courses</Title>
                <Table.ScrollContainer minWidth={500}>
                    <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Short Name</Table.Th>
                                <Table.Th>Duration</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
                
            </Paper>
        </div>
    );
}

export default CourseManagement;