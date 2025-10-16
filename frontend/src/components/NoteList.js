import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { Card, Grid, TextInput, Switch, Button, Text, Badge, Group, Paper, Loader, Center, Pagination, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function NoteList() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        title: '',
        subject: '',
        academic_year: '',
        verified: false
    });
    const [opened, { open, close }] = useDisclosure(false);
    const [editingNote, setEditingNote] = useState(null);

    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    const fetchNotes = useCallback(async (searchParams, page) => {
        setLoading(true);
        setError('');
        try {
            const params = { page };
            if (searchParams.title) params.title = searchParams.title;
            if (searchParams.subject) params.subject = searchParams.subject;
            if (searchParams.academic_year) params.academic_year = searchParams.academic_year;
            if (searchParams.verified) params.verified = 'true';

            const response = await api.get('/notes', { params });

            if (Array.isArray(response.data.notes)) {
                setNotes(response.data.notes);
                setTotalPages(response.data.total_pages);
                setCurrentPage(response.data.current_page);
            } else {
                setError('Received unexpected data from server.');
                setNotes([]);
            }
        } catch (err) {
            setError('Failed to fetch notes. The server might be down.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotes(filters, 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters, fetchNotes]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchNotes(filters, newPage);
        }
    };
    
    const handleFilterChange = (event) => {
        const { name, value, type, checked } = event.currentTarget;
        
        setFilters(currentFilters => ({
            ...currentFilters,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await api.delete(`/notes/${noteId}`);
                toast.success('Note deleted successfully!');
                fetchNotes(filters, currentPage);
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to delete note.');
            }
        }
    };

    const handleEditClick = (note) => {
        setEditingNote({ ...note });
        open();
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote) return;
        try {
            await api.put(`/notes/${editingNote.id}`, editingNote);
            toast.success('Note updated successfully!');
            close();
            fetchNotes(filters, currentPage);
        } catch (err) {
            toast.error('Failed to update note.');
        }
    };

    if (error) {
        return <Text c="red" ta="center" mt="xl">{error}</Text>;
    }

    return (
        <div>
            <Paper p="md" shadow="sm" withBorder mb="xl">
                <Grid align="flex-end" gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Search by Title"
                            placeholder="e.g., Physics Midterm"
                            name="title"
                            value={filters.title}
                            onChange={handleFilterChange}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Filter by Subject"
                            placeholder="e.g., PHY-101"
                            name="subject"
                            value={filters.subject}
                            onChange={handleFilterChange}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Filter by Year"
                            placeholder="e.g., 2023"
                            name="academic_year"
                            value={filters.academic_year}
                            onChange={handleFilterChange}
                        />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} mt="xs">
                         <Switch
                            label="Show Verified Only"
                            name="verified"
                            checked={filters.verified}
                            onChange={handleFilterChange}
                        />
                    </Grid.Col>
                </Grid>
            </Paper>

            {loading ? (
                <Center style={{ height: 300 }}><Loader /></Center>
            ) : (
                <>
                    <Grid>
                        {notes.length > 0 ? (
                            notes.map(note => {
                                const isAuthor = String(note.author_id) === userId;
                                const isPrivileged = ['moderator', 'professor', 'super_admin'].includes(userRole);

                                return (
                                    <Grid.Col key={note.id} span={{ base: 12, md: 6, lg: 4 }}>
                                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                                            <Card.Section component={RouterLink} to={`/notes/${note.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <Group justify="space-between" mt="md" px="md">
                                                    <Text fw={500}>{note.title}</Text>
                                                    {note.is_verified && <Badge color="green" variant="light">Verified</Badge>}
                                                </Group>
                                                <Text size="sm" c="dimmed" px="md" pb="xs">Subject: {note.subject}</Text>
                                            </Card.Section>

                                            <Group mt="md" grow>
                                                <Button
                                                    component="a"
                                                    href={note.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="light"
                                                    color="blue"
                                                    size="xs"
                                                >
                                                    Download
                                                </Button>
                                                {(isAuthor || isPrivileged) && (
                                                    <Button variant="light" size="xs" onClick={() => handleEditClick(note)}>Edit</Button>
                                                )}
                                                {(isAuthor || isPrivileged) && (
                                                    <Button variant="light" color="red" size="xs" onClick={() => handleDelete(note.id)}>Delete</Button>
                                                )}
                                            </Group>
                                        </Card>
                                    </Grid.Col>
                                )
                            })
                        ) : (
                            <Grid.Col span={12}>
                                <Text ta="center" c="dimmed" mt="xl">No notes found for your search.</Text>
                            </Grid.Col>
                        )}
                    </Grid>
                    
                    <Center mt="xl">
                        <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} disabled={totalPages === 0} />
                    </Center>
                </>
            )}

            <Modal opened={opened} onClose={close} title="Edit Note">
                {editingNote && (
                    <form onSubmit={handleUpdateNote}>
                        <TextInput label="Title" required value={editingNote.title} onChange={(e) => setEditingNote({ ...editingNote, title: e.currentTarget.value })} />
                        <TextInput label="Subject" required mt="md" value={editingNote.subject} onChange={(e) => setEditingNote({ ...editingNote, subject: e.currentTarget.value })} />
                        <TextInput label="Semester" required mt="md" value={editingNote.semester} onChange={(e) => setEditingNote({ ...editingNote, semester: e.currentTarget.value })} />
                        <TextInput label="Academic Year" required mt="md" value={editingNote.academic_year} onChange={(e) => setEditingNote({ ...editingNote, academic_year: e.currentTarget.value })} />
                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={close}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </Group>
                    </form>
                )}
            </Modal>
        </div>
    );
}

export default NoteList;