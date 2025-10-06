import React, { useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { Container, Paper, Title, TextInput, Button, Text } from '@mantine/core';

function ForgotPassword() {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/forgot-password', { email });
            toast.info(response.data.message);
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Forgot Your Password?
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Enter your email to get a reset link
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Your Email"
                        placeholder="you@imsec.ac.in"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                    <Button fullWidth mt="xl" type="submit">
                        Send Reset Link
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default ForgotPassword;