import React from 'react';

function Logout() {
    const handleLogout = () => {
        // Remove the token from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        // Reload the page to reset the application state
        window.location.reload();
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}

export default Logout;