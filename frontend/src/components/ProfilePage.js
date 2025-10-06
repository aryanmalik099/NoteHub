import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import {
    Container,
    Paper,
    Title,
    Text,
    Tabs,
    Grid,
    Card,
    Button,
    Group,
    Badge,
    Modal,
    TextInput,
    PasswordInput,
    Center,
    Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const [myNotes, setMyNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for the edit modal, preserved from original logic
    const [editingNote, setEditingNote] = useState(null);
    const [opened, { open, close }] = useDisclosure(false);

    // State for the password change form, preserved from original logic
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
    });

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        try {
            const userRes = await api.get('/profile');
            setUserData(userRes.data);

            const notesRes = await api.get('/notes/my_notes');
            if (Array.isArray(notesRes.data)) {
                setMyNotes(notesRes.data);
            }
        } catch (err) {
            setError('Failed to fetch profile data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await api.delete(`/notes/${noteId}`);
                toast.success('Note deleted successfully!');
                fetchProfileData(); // Re-fetch data to update the list
            } catch (err) {
                toast.error('Failed to delete note.');
            }
        }
    };

    const handleEditClick = (note) => {
        setEditingNote(note);
        open();
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote) return;

        try {
            await api.put(`/notes/${editingNote.id}`, editingNote);
            toast.success('Note updated successfully!');
            close();
            setEditingNote(null);
            fetchProfileData(); // Re-fetch data
        } catch (err) {
            toast.error('Failed to update note.');
        }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            await api.post('/profile/change-password', passwordData);
            toast.success('Password changed successfully!');
            setPasswordData({ current_password: '', new_password: '' }); // Clear form
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password.');
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
            <Paper withBorder shadow="md" p={30} radius="md">
                <Title order={2}>Profile</Title>
                {userData && (
                    <>
                        <Text mt="sm"><strong>Username:</strong> {userData.username}</Text>
                        <Text><strong>Email:</strong> {userData.email}</Text>
                    </>
                )}
            </Paper>

            <Tabs defaultValue="my-notes" mt="xl">
                <Tabs.List>
                    <Tabs.Tab value="my-notes">My Notes</Tabs.Tab>
                    <Tabs.Tab value="change-password">Change Password</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="my-notes" pt="xs">
                    <Grid mt="md">
                        {myNotes.length > 0 ? (
                            myNotes.map(note => (
                                <Grid.Col key={note.id} span={{ base: 12, md: 6, lg: 4 }}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Group justify="space-between" mt="md" mb="xs">
                                            <Text fw={500}>{note.title}</Text>
                                            {note.is_verified && <Badge color="green">Verified</Badge>}
                                        </Group>
                                        <Text size="sm" c="dimmed">Subject: {note.subject}</Text>
                                        <Text size="sm" c="dimmed">Semester: {note.semester}</Text>
                                        <Text size="sm" c="dimmed">Year: {note.academic_year}</Text>
                                        <Group mt="md">
                                            <Button variant="light" color="blue" onClick={() => handleEditClick(note)}>Edit</Button>
                                            <Button variant="light" color="red" onClick={() => handleDelete(note.id)}>Delete</Button>
                                        </Group>
                                    </Card>
                                </Grid.Col>
                            ))
                        ) : (
                            <Grid.Col span={12}>
                                <Text ta="center" c="dimmed" mt="xl">You have not uploaded any notes yet.</Text>
                            </Grid.Col>
                        )}
                    </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="change-password" pt="xs">
                    <Paper withBorder shadow="md" p={30} mt="md" radius="md">
                        <form onSubmit={handlePasswordChange}>
                            <PasswordInput
                                label="Current Password"
                                required
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.currentTarget.value })}
                            />
                            <PasswordInput
                                label="New Password"
                                required
                                mt="md"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.currentTarget.value })}
                            />
                            <Button type="submit" mt="xl">Update Password</Button>
                        </form>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

            {/* Edit Note Modal - Logic and state preserved from original component */}
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

export default ProfilePage;