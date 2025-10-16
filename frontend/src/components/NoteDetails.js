import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { Container, Paper, Title, Text, Button, Loader, Center, Badge, Group, AspectRatio, Modal, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function NoteDetails() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [editingNote, setEditingNote] = useState(null);

    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = localStorage.getItem('userRole');

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await api.get(`/notes/${noteId}`);
                setNote(res.data);
            } catch (err) {
                setError('Note not found or an error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [noteId]);

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
        setEditingNote({ ...note });
        open();
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote) return;

        try {
            await api.put(`/notes/${editingNote.id}`, editingNote);
            toast.success('Note updated successfully!');
            setNote(editingNote);
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
                    <Text c="dimmed" mt="sm">Uploaded by: {note.author_username} on {note.created_at}</Text>
                    
                    <Text mt="lg"><strong>Subject:</strong> {note.subject}</Text>
                    <Text><strong>Semester:</strong> {note.semester}</Text>
                    <Text><strong>Academic Year:</strong> {note.academic_year}</Text>
                    {note.department_name && <Text><strong>Department:</strong> {note.department_name}</Text>}
                    {note.section_code && <Text><strong>Section:</strong> {note.section_code}</Text>}
                    
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
                         <TextInput
                            label="Semester"
                            required
                            mt="md"
                            value={editingNote.semester}
                            onChange={(e) => setEditingNote({ ...editingNote, semester: e.currentTarget.value })}
                        />
                        <TextInput
                            label="Academic Year"
                            required
                            mt="md"
                            value={editingNote.academic_year}
                            onChange={(e) => setEditingNote({ ...editingNote, academic_year: e.currentTarget.value })}
                        />
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