import React, { useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

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
        <div className="form-container">
            <h2>Forgot Password</h2>
            <p>Enter your email address and we will send you a link to reset your password.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Send Reset Link</button>
            </form>
        </div>
    );
}

export default ForgotPassword;