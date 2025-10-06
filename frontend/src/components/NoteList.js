import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Card, Grid, TextInput, Switch, Button, Text, Badge, Group, Paper, Loader, Center, Pagination } from '@mantine/core';

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

    const fetchNotes = useCallback(async (searchParams, page) => {
        setLoading(true);
        setError('');
        try {
            const params = { page };
            if (searchParams.title) params.title = searchParams.title;
            if (searchParams.subject) params.subject = searchParams.subject;
            if (searchParams.academic_year) params.academic_year = searchParams.academic_year;
            // The backend expects the string 'true' for this filter
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
    
    // --- THIS IS THE FINAL FIX ---
    // This single handler is now robust enough for all inputs.
    // It reads the name, value, type, and checked status from the event *immediately*.
    const handleFilterChange = (event) => {
        const { name, value, type, checked } = event.currentTarget;
        
        // Use the stored value (not the event object) to update the state.
        setFilters(currentFilters => ({
            ...currentFilters,
            [name]: type === 'checkbox' ? checked : value
        }));
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
                            notes.map(note => (
                                <Grid.Col key={note.id} span={{ base: 12, md: 6, lg: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Group justify="space-between" mt="md" mb="xs">
                                            <Text fw={500}>{note.title}</Text>
                                            {note.is_verified && (
                                                <Badge color="green" variant="light">
                                                    Verified
                                                </Badge>
                                            )}
                                        </Group>
                                        <Text size="sm" c="dimmed">Subject: {note.subject}</Text>
                                        <Text size="sm" c="dimmed">Semester: {note.semester}</Text>
                                        <Text size="sm" c="dimmed">Year: {note.academic_year}</Text>
                                        <Text size="sm" c="dimmed" mt="sm">
                                            Uploaded by: {note.author_username}
                                        </Text>
                                        <Button
                                            component="a"
                                            href={note.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="light"
                                            color="blue"
                                            fullWidth
                                            mt="md"
                                            radius="md"
                                        >
                                            Download Note
                                        </Button>
                                    </Card>
                                </Grid.Col>
                            ))
                        ) : (
                            <Grid.Col span={12}>
                                <Text ta="center" c="dimmed" mt="xl">
                                    No notes found for your search.
                                </Text>
                            </Grid.Col>
                        )}
                    </Grid>
                    
                    <Center mt="xl">
                        <Pagination
                            total={totalPages}
                            value={currentPage}
                            onChange={handlePageChange}
                            disabled={totalPages === 0}
                        />
                    </Center>
                </>
            )}
        </div>
    );
}

export default NoteList;