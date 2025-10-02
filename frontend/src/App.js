import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa'; // Icons for the menu
import Signup from './components/Signup';
import Login from './components/Login';
import ProfilePage from './components/ProfilePage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPanel from './components/AdminPanel';
import NoteUpload from './components/NoteUpload';
import NoteList from './components/NoteList';
import logo from './logo.png';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) { return <Navigate to="/login" replace />; }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { setIsLoggedIn(true); }
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Clears all stored items (token, role, etc.)
    setIsLoggedIn(false);
  };
  
  const closeMenu = () => setIsMenuOpen(false); // Function to close the menu

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} theme="light" />
      
      {/* This overlay will dim the background when the menu is open */}
      {isMenuOpen && <div className="overlay" onClick={closeMenu}></div>}

      <header className="App-header">
        <h1><Link to="/" onClick={closeMenu}><img src={logo} alt="NoteHub"/></Link></h1>
        
        {/* The nav menu now has a conditional class to slide it into view */}
        <nav className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          {isLoggedIn ? (
            <>
              {localStorage.getItem('userRole') === 'super_admin' && <Link to="/admin" onClick={closeMenu}>Admin Panel</Link>}
              <Link to="/upload" onClick={closeMenu}>Upload Note</Link>
              <Link to="/profile" onClick={closeMenu}>Profile</Link>
              <Link to="/login" onClick={() => { closeMenu(); handleLogout(); }}>Logout</Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/signup" onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </nav>

        {/* This button toggles the menu's visibility */}
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<NoteList />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={isLoggedIn ? <Navigate to="/" /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/upload" element={<ProtectedRoute isLoggedIn={isLoggedIn}><NoteUpload /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute isLoggedIn={isLoggedIn}><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;