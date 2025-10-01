import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { FaTrash } from 'react-icons/fa';


function NotesList() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [filters, setFilters] = useState({
        title: '',
        subject: '',
        academic_year: '',
        verified: false
    });
    const currentUserRole = localStorage.getItem('userRole');

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters({
            ...filters,
            [name]: type === 'checkbox' ? checked : value
        });
        setCurrentPage(1);
    };

    const fetchNotes = useCallback(async (searchParams, page) => {
        setLoading(true);
        try {
            const nonEmptyParams = Object.fromEntries(
                Object.entries(searchParams).filter(([key, value]) => {
                    return value !== '' && value !== false;
                })
            );
            const params = { ...nonEmptyParams, page: page };
            const response = await api.get('/notes', { params });
            
            setNotes(response.data.notes);
            setTotalPages(response.data.total_pages);
            setCurrentPage(response.data.current_page);
        } catch (err) {
            setError('Failed to fetch notes.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect for handling live search with debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNotes(filters, 1);
        }, 500);

        return () => clearTimeout(timer);
    }, [filters, fetchNotes]);

    // 4. Function to handle page changes
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchNotes(filters, newPage);
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm("As a moderator, are you sure?")) return;
        try {
            await api.delete(`/notes/${noteId}`);
            // Refetch the current page to show the updated list
            fetchNotes(filters, currentPage);
        } catch (err) {
            setError('Failed to delete note.');
        }
    };

    return (
        <div>
            <div className="search-form">
                <h3>Search Notes</h3>
                <input type="text" name="title" placeholder="Search by Title..." value={filters.title} onChange={handleFilterChange} />
                <input type="text" name="subject" placeholder="Filter by Subject..." value={filters.subject} onChange={handleFilterChange} />
                <input type="text" name="academic_year" placeholder="Filter by Year..." value={filters.academic_year} onChange={handleFilterChange} />
                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="verified"
                        name="verified"
                        checked={filters.verified}
                        onChange={handleFilterChange}
                    />
                    <label htmlFor="verified">Show Verified Only ✔️</label>
                </div>
            </div>
            <hr />
            <h2>All Notes</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {loading ? ( <p>Searching...</p> ) : (
                <>
                    <div className="notes-grid">
                        {notes.length > 0 ? notes.map(note => (
                            <div key={note.id} className="note-card">
                                <h3>
                                    {note.title}
                                    {note.is_verified && <span className="verified-badge">✔️ Verified</span>}
                                </h3>
                                <p><strong>Subject:</strong> {note.subject}</p>
                                <p><strong>Semester:</strong> {note.semester}</p>
                                <p><strong>Year:</strong> {note.academic_year}</p>
                                <a href={note.file_url} target="_blank" rel="noopener noreferrer">Download Note</a>
                                <p><em>by {note.author_username}</em></p>
                                {['moderator', 'super_admin'].includes(currentUserRole) && (
                                    <div className="note-actions">
                                        <button onClick={() => handleDelete(note.id)}><FaTrash />Delete ({currentUserRole})</button>
                                    </div>
                                )}
                            </div>
                        )) : <p>No notes found for your search.</p>}
                    </div>

                    <div className="pagination-controls">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                            &laquo; Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                            Next &raquo;
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default NotesList;