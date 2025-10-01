import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import NoteUpload from './components/NoteUpload';
import NoteList from './components/NoteList';
import ProfilePage from './components/ProfilePage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import logo from './logo.png';
import './App.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Helper component to protect routes
// It checks if the user is logged in. If not, it redirects to the /login page.
const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Updated logout function to clear all relevant items
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <header className="App-header">
        <h1><img src={logo} alt="NoteHub"/></h1>
        <nav>
          <Link to="/">Home</Link>
          {isLoggedIn ? (
            <>
              <Link to="/upload">Upload Note</Link>
              <Link to="/profile">Profile</Link>
              {/* Using a Link for logout ensures consistent styling */}
              <Link to="/login" onClick={handleLogout}>Logout</Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      
      <main>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<NoteList />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={isLoggedIn ? <Navigate to="/" /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* --- PROTECTED ROUTES --- */}
          {/* We wrap the component in our ProtectedRoute helper */}
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <NoteUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;