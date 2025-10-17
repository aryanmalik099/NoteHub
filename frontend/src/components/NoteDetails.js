import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { Container, Paper, Title, Text, Anchor, Button, Loader, Center, Badge, Group, AspectRatio, Modal, TextInput, NumberInput, Select, MultiSelect } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function NoteDetails() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [editingNote, setEditingNote] = useState(null);

    const [profileDetails, setProfileDetails] = useState(null);
    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = localStorage.getItem('userRole');

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const [noteRes, profileRes] = await Promise.all([
                    api.get(`/notes/${noteId}`),
                    api.get('/profile/details')
                ]);
                setNote(noteRes.data);
                setProfileDetails(profileRes.data);
            } catch (err) {
                setError('Note not found or an error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [noteId]);

    const availableSections = useMemo(() => {
        if (!editingNote?.department_id || !profileDetails?.all_sections) return [];
        return profileDetails.all_sections
            .filter(s => String(s.department_id) === String(editingNote.department_id))
            .map(s => ({ value: String(s.id), label: s.section_code }));
    }, [editingNote, profileDetails]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await api.delete(`/notes/${note.id}`);
                toast.success('Note deleted successfully!');
                navigate('/');
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to delete note.');
            }
        }
    };

    const handleEditClick = () => {
        setEditingNote({
            ...note,
            department_id: note.department_id ? String(note.department_id) : '',
            section_ids: note.sections ? note.sections.map(s => String(s.id)) : []
        });
        open();
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote) return;

        try {
            const response = await api.put(`/notes/${editingNote.id}`, editingNote);
            toast.success(response.data.message || 'Note updated successfully!');
            setNote(response.data.note);
            close();
        } catch (err) {
            toast.error('Failed to update note.');
        }
    };

    if (loading) {
        return <Center style={{ height: 300 }}><Loader /></Center>;
    }

    if (error) {
        return <Text c="red" ta="center" mt="xl">{error}</Text>;
    }

    return (
        <Container my="md">
            <Button component={RouterLink} to="/" variant="subtle" mb="md">
                &larr; Back to All Notes
            </Button>
            {note && (
                <Paper withBorder shadow="md" p={30} radius="md">
                    <Group justify="space-between">
                        <Title order={2}>{note.title}</Title>
                        {note.is_verified && <Badge color="green" size="lg">Verified</Badge>}
                    </Group>
                    <Text c="dimmed" mt="sm">
                        Uploaded by: <Anchor component={RouterLink} to={`/users/${note.author_username}`}>{note.author_username}</Anchor> on {note.created_at}
                    </Text>
                    
                    <Text mt="lg"><strong>Subject:</strong> {note.subject}</Text>
                    <Text><strong>Semester:</strong> {note.semester}</Text>
                    <Text><strong>Academic Year:</strong> {note.academic_year}</Text>
                    {note.department_name && <Text><strong>Department:</strong> {note.department_name}</Text>}
                    {note.sections && note.sections.length > 0 && (
                        <Text><strong>Sections:</strong> {note.sections.map(s => s.code).join(', ')}</Text>
                    )}
                    
                    <Group mt="xl">
                        <Button component="a" href={note.file_url} target="_blank" rel="noopener noreferrer">
                            Download
                        </Button>

                        {(String(note.author_id) === currentUserId || ['moderator', 'professor', 'super_admin'].includes(currentUserRole)) && (
                            <Button variant="light" onClick={handleEditClick}>Edit</Button>
                        )}
                        
                        {(String(note.author_id) === currentUserId || ['moderator', 'professor', 'super_admin'].includes(currentUserRole)) && (
                            <Button variant="light" color="red" onClick={handleDelete}>Delete</Button>
                        )}
                    </Group>
                    
                    <Title order={4} mt="xl" mb="sm">Preview</Title>
                    <AspectRatio ratio={4 / 5}>
                        <iframe
                            src={note.file_url}
                            title="Note Preview"
                            style={{ width: '100%', height: '100%', border: '1px solid #dee2e6', borderRadius: '4px' }}
                        />
                    </AspectRatio>
                </Paper>
            )}

            <Modal opened={opened} onClose={close} title="Edit Note">
                {editingNote && (
                    <form onSubmit={handleUpdateNote}>
                        <TextInput
                            label="Title"
                            required
                            value={editingNote.title}
                            onChange={(e) => setEditingNote({ ...editingNote, title: e.currentTarget.value })}
                        />
                        <TextInput
                            label="Subject"
                            required
                            mt="md"
                            value={editingNote.subject}
                            onChange={(e) => setEditingNote({ ...editingNote, subject: e.currentTarget.value })}
                        />
                        <NumberInput
                            label="Semester"
                            required
                            mt="md"
                            value={editingNote.semester}
                            onChange={(value) => setEditingNote({ ...editingNote, semester: value || '' })}
                            min={1} max={8}
                        />
                        <TextInput
                            label="Academic Year"
                            required
                            mt="md"
                            value={editingNote.academic_year}
                            onChange={(e) => setEditingNote({ ...editingNote, academic_year: e.currentTarget.value })}
                        />
                        {profileDetails && (
                            <>
                                {currentUserRole === 'professor' && (
                                    <Select mt="md" label="Department"
                                        data={profileDetails.departments_taught.map(d => ({ value: String(d.id), label: d.name }))}
                                        value={editingNote.department_id}
                                        onChange={(val) => setEditingNote({...editingNote, department_id: val})}
                                    />
                                )}
                                {currentUserRole === 'super_admin' && (
                                    <Group grow mt="md">
                                        <Select label="Department"
                                            data={profileDetails.all_departments.map(d => ({ value: String(d.id), label: d.name }))}
                                            value={editingNote.department_id}
                                            onChange={(val) => setEditingNote({...editingNote, department_id: val, section_ids: []})} // Reset sections on change
                                        />
                                        <MultiSelect label="Sections"
                                            data={availableSections}
                                            value={editingNote.section_ids}
                                            onChange={(val) => setEditingNote({...editingNote, section_ids: val})}
                                            disabled={!editingNote.department_id}
                                        />
                                    </Group>
                                )}
                            </>
                        )}
                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={close}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </Group>
                    </form>
                )}
            </Modal>
        </Container>
    );
}

export default NoteDetails;