import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api';

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
            // 2. Use the 'api' client instead of axios
            const response = await api.post('/signup', formData);
            toast.success(response.data.message);
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred.');
        }
    };

    return (
        <div className="form-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="signup-username">Username</label>
                    <input id="signup-username" type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-email">Email</label>
                    <input id="signup-email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-password">Password</label>
                    <input id="signup-password" type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default Signup;