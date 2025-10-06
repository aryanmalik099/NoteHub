import React, { useState} from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { Container, Paper, Title, TextInput, NumberInput, Button, FileInput } from '@mantine/core';

function NoteUpload() {
    // --- Your original state, including isUploading, is now here ---
    const [noteData, setNoteData] = useState({
        title: '',
        subject: '',
        semester: '',
        academic_year: ''
    });
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleInputChange = (e) => {
        setNoteData({ ...noteData, [e.target.name]: e.target.value });
    };

    const handleSemesterChange = (value) => {
        setNoteData({ ...noteData, semester: value || '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file to upload.');
            return;
        }

        setIsUploading(true); // --- Your uploading state logic ---

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', noteData.title);
        formData.append('subject', noteData.subject);
        formData.append('semester', noteData.semester);
        formData.append('academic_year', noteData.academic_year);

        try {
            await api.post('/notes/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Note uploaded successfully!');
            // --- Your original form clearing logic, adapted for Mantine ---
            setNoteData({ title: '', subject: '', semester: '', academic_year: '' });
            setFile(null); // This is the correct way to clear the Mantine FileInput
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred during upload.');
        } finally {
            setIsUploading(false); // --- Your uploading state logic ---
        }
    };

    return (
        <Container size={560} my={40}>
            <Title ta="center">
                Upload a New Note
            </Title>
            
            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Title"
                        placeholder="e.g., Chapter 5 Thermodynamics"
                        required
                        name="title"
                        value={noteData.title}
                        onChange={handleInputChange}
                        disabled={isUploading}
                    />
                    <TextInput
                        label="Subject Code"
                        placeholder="e.g., KAS-101T"
                        required
                        mt="md"
                        name="subject"
                        value={noteData.subject}
                        onChange={handleInputChange}
                        disabled={isUploading}
                    />
                    <NumberInput
                        label="Semester"
                        placeholder="e.g., 3"
                        required
                        mt="md"
                        name="semester"
                        value={noteData.semester}
                        onChange={handleSemesterChange}
                        min={1}
                        max={8}
                        disabled={isUploading}
                    />
                    <TextInput
                        label="Academic Year"
                        placeholder="e.g., 2023-24"
                        required
                        mt="md"
                        name="academic_year"
                        value={noteData.academic_year}
                        onChange={handleInputChange}
                        disabled={isUploading}
                    />
                    <FileInput
                        label="Note File"
                        placeholder="Click to upload a PDF, PNG, or JPG"
                        required
                        mt="md"
                        value={file}
                        onChange={setFile}
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={isUploading}
                        clearable // Allows the user to clear the file selection
                    />
                    {/* The Mantine Button has a `loading` prop that shows a spinner, perfect for `isUploading` */}
                    <Button fullWidth mt="xl" type="submit" loading={isUploading}>
                        Upload Note
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default NoteUpload;