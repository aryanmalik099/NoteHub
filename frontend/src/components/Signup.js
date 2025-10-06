import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { Container, Paper, Title, TextInput, PasswordInput, Button } from '@mantine/core';

function Signup() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/signup', formData);
            toast.success(response.data.message);
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred.');
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Create an Account
            </Title>
            
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Username"
                        placeholder="Choose a username"
                        required
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                    />
                    <TextInput
                        label="College Email"
                        placeholder="..._@imsec.ac.in"
                        required
                        mt="md"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        mt="md"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <Button fullWidth mt="xl" type="submit">
                        Sign Up
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default Signup;