import React, { useRef, useState } from 'react';
import api from '../api';
import { toast } from 'react-toastify';

function NoteUpload() {
    const [noteData, setNoteData] = useState({
        title: '',
        subject: '',
        semester: '',
        academic_year: ''
    });
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        setNoteData({ ...noteData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setFile(null);
            return;
        }

        const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        
        // Check the file extension
        if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
            setFile(selectedFile); // If valid, set the file
        } else {
            setFile(null); // If invalid, clear the file selection
            e.target.value = null; // Also clear the input field in the browser
            toast.error('Invalid file type. Please select a PDF, PNG, or JPG.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            toast.error('Please select a valid file to upload.');
            return;
        }
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', noteData.title);
        formData.append('subject', noteData.subject);
        formData.append('semester', noteData.semester);
        formData.append('academic_year', noteData.academic_year);

        try {
            const response = await api.post('/notes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(response.data.message || 'Note uploaded successfully!');
            setNoteData({ title: '', subject: '', semester: '', academic_year: '' });
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Clear the file input visually
            }
        } catch (error) {
            const data = error.response?.data;
            toast.error(data?.error || 'Server responded with an error.');
        }
    };

    return (
        // 1. Use a more specific CSS class for the form container
        <div className="form-container">
            <h2>Upload New Note</h2>
            <form onSubmit={handleSubmit}>
                {/* 2. Wrap each input/label pair in a div */}
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input id="title" type="text" name="title" onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input id="subject" type="text" name="subject" onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="semester">Semester</label>
                    <input id="semester" type="number" name="semester" onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="academic_year">Academic Year</label>
                    <input id="academic_year" type="text" name="academic_year" onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="file">Note File</label>
                    <input id="file" type="file" onChange={handleFileChange} required />
                </div>
                
                {/* 3. Add disabled property to button */}
                <button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
        </div>
    );
}

export default NoteUpload;