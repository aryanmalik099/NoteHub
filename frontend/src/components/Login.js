import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../api';

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
            // 2. Use the 'api' client instead of axios
            const response = await api.post('/login', loginData);

            if (response.data.access_token) {
                const { access_token, refresh_token } = response.data;
                localStorage.setItem('token', access_token);
                localStorage.setItem('refreshToken',refresh_token);
                const decodedToken = jwtDecode(access_token);
                localStorage.setItem('userId', decodedToken.sub);
                localStorage.setItem('userRole', decodedToken.role);
                toast.success('Login successful!');
                setIsLoggedIn(true);
            }
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.error || 'An error occurred.');
            } else if (error.request) {
                toast.error('Network Error: Cannot connect to the server.');
            } else {
                toast.error('An unexpected error occurred during login.');
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="login-username">Username</label>
                    <input id="login-username" type="text" name="username" onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Password</label>
                    <input id="login-password" type="password" name="password" onChange={handleInputChange} required />
                </div>
                <button type="submit">Login</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/forgot-password">Forgot Password?</Link>
            </div>
        </div>
    );
}

export default Login;