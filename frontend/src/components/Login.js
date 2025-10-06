import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { Container, Paper, Title, TextInput, PasswordInput, Button, Anchor} from '@mantine/core';

function Login({ setIsLoggedIn }) {
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });

    const handleInputChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/login', loginData);

            if (response.data.access_token) {
                const { access_token, refresh_token } = response.data;
                localStorage.setItem('token', access_token);
                localStorage.setItem('refreshToken', refresh_token);
                const decodedToken = jwtDecode(access_token);
                localStorage.setItem('userId', decodedToken.sub);
                localStorage.setItem('userRole', decodedToken.role);
                toast.success('Login successful!');
                setIsLoggedIn(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred during login.');
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Login
            </Title>
            
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Username"
                        placeholder="Your username"
                        required
                        name="username"
                        onChange={handleInputChange}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Your password"
                        required
                        mt="md"
                        name="password"
                        onChange={handleInputChange}
                    />
                    <Anchor component={RouterLink} to="/forgot-password" size="sm" mt="sm">
                        Forgot Password?
                    </Anchor>
                    <Button fullWidth mt="xl" type="submit">
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default Login;