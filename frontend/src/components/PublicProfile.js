import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { Container, Paper, Title, Text, Loader, Center, Grid, Card, Group, Badge } from '@mantine/core';

function PublicProfile() {
    const { username } = useParams(); // Get username from the URL
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/users/${username}`);
                setProfile(res.data);
            } catch (err) {
                setError('User not found or an error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (loading) {
        return <Center style={{ height: 300 }}><Loader /></Center>;
    }

    if (error) {
        return <Text c="red" ta="center" mt="xl">{error}</Text>;
    }

    return (
        <Container my="md">
            {profile && (
                <>
                    <Paper withBorder shadow="md" p={30} radius="md" mb="xl">
                        <Title order={2}>{profile.user.username}</Title>
                        <Text tt="capitalize">Role: {profile.user.role}</Text>
                        {profile.user.department_name && (
                            <Text>Department: {profile.user.department_name}</Text>
                        )}
                    </Paper>

                    <Title order={3} mb="md">Notes by {profile.user.username}</Title>
                    <Grid>
                        {profile.notes.length > 0 ? (
                            profile.notes.map(note => (
                                <Grid.Col key={note.id} span={{ base: 12, md: 6, lg: 4 }}>
                                    <Card component={RouterLink} to={`/notes/${note.id}`} shadow="sm" padding="lg" radius="md" withBorder>
                                        <Group justify="space-between" mt="md" mb="xs">
                                            <Text fw={500}>{note.title}</Text>
                                            {note.is_verified && <Badge color="green" variant="light">Verified</Badge>}
                                        </Group>
                                        <Text size="sm" c="dimmed">Subject: {note.subject}</Text>
                                    </Card>
                                </Grid.Col>
                            ))
                        ) : (
                            <Text c="dimmed">This user has not uploaded any notes yet.</Text>
                        )}
                    </Grid>
                </>
            )}
        </Container>
    );
}

export default PublicProfile;