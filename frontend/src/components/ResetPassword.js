import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { token } = useParams(); // Gets the token from the URL
    const navigate = useNavigate(); // To redirect the user after success

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            const response = await api.post(`/reset-password/${token}`, { new_password: password });
            toast.success(response.data.message);
            navigate('/login'); // Redirect to login page on success
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reset password.');
        }
    };

    return (
        <div className="form-container">
            <h2>Reset Your Password</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                        id="new_password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
}

export default ResetPassword;