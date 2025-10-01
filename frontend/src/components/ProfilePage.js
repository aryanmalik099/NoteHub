import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import './EditNoteModal.css';
import { FaUser, FaEnvelope, FaEdit, FaTrash } from 'react-icons/fa';


function ProfilePage() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        subject: '',
        semester: '',
        academic_year: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    // 1. New state to toggle the password form's visibility
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        // We can fetch both sets of data at the same time
        const fetchData = async () => {
            try {
                // 2. Use 'api' and relative paths. No more headers!
                const profilePromise = api.get('/profile');
                const notesPromise = api.get('/notes/my_notes');

                // Wait for both requests to complete
                const [profileResponse, notesResponse] = await Promise.all([profilePromise, notesPromise]);
                
                setUser(profileResponse.data);
                setNotes(notesResponse.data);
            } catch (error) {
                toast.error('Failed to fetch your data. You may be logged out.');
            } finally {
                setLoading(false); // Stop loading, whether it succeeded or failed
            }
        };

        fetchData();
    }, []);

     const handleDelete = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) {
            return;
        }
        try {
            // 3. Use 'api' here as well. The interceptor handles the token.
            await api.delete(`/notes/${noteId}`);
            toast.success('Note deleted successfully!');
            setNotes(notes.filter(note => note.id !== noteId));
        } catch (error) {
            toast.error('Failed to delete the note.');
        }
    };

    const handleEditClick = (note) => {
        setIsEditing(note);
        setEditFormData({
            title: note.title,
            subject: note.subject,
            semester: note.semester,
            academic_year: note.academic_year,
        });
    };

    const handleEditFormChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/notes/${isEditing.id}`, editFormData);
            const updatedNote = response.data.note;
            setNotes(notes.map(note => (note.id === updatedNote.id ? updatedNote : note)));
            setIsEditing(null);
            toast.success('Note updated successfully!');
        } catch (err) {
            toast.error('Failed to update note.');
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmitPasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error("New passwords do not match.");
            return;
        }
        try {
            const response = await api.post('/profile/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            toast.success(response.data.message);
            // Clear the form fields after successful submission
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setShowPasswordForm(false);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to change password.");
        }
    };

    if (loading) return <div>Loading your profile...</div>;

    if (!user) return <div>Could not load profile.</div>;

    return (
        <div className="profile-page-container">
            <div className="form-container">
                <h2>User Profile</h2>
                <p><FaUser /> <strong>Username:</strong> {user.username}</p>
                <p><FaEnvelope /> <strong>Email:</strong> {user.email}</p>
                
                <hr className="form-divider" />

                {showPasswordForm ? (
                    <>
                        <h3>Change Password</h3>
                        <form onSubmit={handleSubmitPasswordChange}>
                            <div className="form-group">
                                <label htmlFor="current_password">Current Password</label>
                                <input id="current_password" type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new_password">New Password</label>
                                <input id="new_password" type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm_password">Confirm New Password</label>
                                <input id="confirm_password" type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required />
                            </div>
                            <button type="submit">Update Password</button>
                            <button type="button" onClick={() => setShowPasswordForm(false)} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>
                                Cancel
                            </button>
                        </form>
                    </>
                ) : (
                    <button onClick={() => setShowPasswordForm(true)}>
                        Change Password
                    </button>
                )}
            </div>
            <hr />
            <h3>My Notes</h3>
            {notes.length > 0 ? (
                <div className="notes-grid">
                    {notes.map(note => (
                        <div key={note.id} className="note-card">
                            <h4>{note.title}</h4>
                            <p><strong>Subject:</strong> {note.subject}</p>
                            <a href={note.file_url} target="_blank" rel="noopener noreferrer">View File</a>
                            {/* 4. Add the Edit and Delete buttons here */}
                            <div className="note-actions">
                                <button onClick={() => handleEditClick(note)}><FaEdit /> Edit</button>
                                <button onClick={() => handleDelete(note.id)}><FaTrash /> Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>You have not uploaded any notes yet.</p>
            )}

            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Edit Note</h2>
                        <form onSubmit={handleUpdateNote}>
                            <input type="text" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                            <input type="text" name="subject" value={editFormData.subject} onChange={handleEditFormChange} required />
                            <input type="number" name="semester" value={editFormData.semester} onChange={handleEditFormChange} required />
                            <input type="text" name="academic_year" value={editFormData.academic_year} onChange={handleEditFormChange} required />
                            <div className="modal-actions">
                                <button type="submit">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;