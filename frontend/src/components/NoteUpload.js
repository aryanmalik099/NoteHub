import React, { useState, useEffect} from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { Container, Paper, Title, TextInput, NumberInput, Button, FileInput, Select, Loader, Center } from '@mantine/core';

function NoteUpload() {
    const [noteData, setNoteData] = useState({
        title: '',
        subject: '',
        semester: '',
        academic_year: ''
    });
    const [files, setFiles] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [profileDetails, setProfileDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    const handleInputChange = (e) => {
        setNoteData({ ...noteData, [e.target.name]: e.target.value });
    };

    const handleSemesterChange = (value) => {
        setNoteData({ ...noteData, semester: value || '' });
    };

    useEffect(() => {
        const fetchProfileDetails = async () => {
            try {
                const res = await api.get('/profile/details');
                setProfileDetails(res.data);
                if (res.data.role === 'student' || res.data.role === 'moderator') {
                    setSelectedSection(String(res.data.section?.id || ''));
                }
            } catch (error) {
                toast.error("Could not load user details for form.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfileDetails();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            toast.error('Please select one or more files to upload.');
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });
        formData.append('title', noteData.title);
        formData.append('subject', noteData.subject);
        formData.append('semester', noteData.semester);
        formData.append('academic_year', noteData.academic_year);

        if (profileDetails.role === 'professor' && selectedDepartment) {
            formData.append('department_id', selectedDepartment);
        } else if (selectedSection) {
            formData.append('section_id', selectedSection);
        }

        try {
            await api.post('/notes/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Note uploaded successfully!');
            setNoteData({ title: '', subject: '', semester: '', academic_year: '' });
            setFiles(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'An error occurred during upload.');
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return <Center style={{ height: 300 }}><Loader /></Center>;
    }

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
                    {(profileDetails?.role === 'student' || profileDetails?.role === 'moderator') && profileDetails?.section && (
                         <Select
                            mt="md"
                            label="Section"
                            data={[{ value: String(profileDetails.section.id), label: profileDetails.section.section_code }]}
                            value={selectedSection}
                            onChange={setSelectedSection}
                            disabled
                         />
                    )}
                    {profileDetails?.role === 'professor' && (
                        <Select
                            mt="md"
                            label="Department"
                            placeholder="Tag a department for this note"
                            data={profileDetails.departments_taught.map(d => ({ value: String(d.id), label: d.name }))}
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            clearable
                        />
                    )}
                    <FileInput
                        label="Note File(s)"
                        placeholder="Click to upload a PDF, PNG, or JPG"
                        required
                        multiple
                        mt="md"
                        value={files}
                        onChange={setFiles}
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={isUploading}
                        clearable
                    />
                    <Button fullWidth mt="xl" type="submit" loading={isUploading}>
                        Upload Note
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default NoteUpload;