import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import ProfilePage from './components/ProfilePage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPanel from './components/AdminPanel';
import NoteUpload from './components/NoteUpload';
import NoteList from './components/NoteList';
import logo from './logo.png';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { MantineProvider, AppShell, Burger, Group, Button, Image } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) { return <Navigate to="/login" replace />; }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [opened, { toggle }] = useDisclosure();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { setIsLoggedIn(true); }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  return (
    <MantineProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={5000} theme="light" />
        <AppShell
          header={{ height: 60 }}
          navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
          padding="md"
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <RouterLink to="/">
                  <Image src={logo} alt="NoteHub" h={40} />
                </RouterLink>
              </Group>
              <Group visibleFrom="sm">
                <Button component={RouterLink} to="/" variant="subtle">Home</Button>
                {isLoggedIn ? (
                  <>
                    {localStorage.getItem('userRole') === 'super_admin' && <Button component={RouterLink} to="/admin" variant="subtle">Admin Panel</Button>}
                    <Button component={RouterLink} to="/upload" variant="subtle">Upload Note</Button>
                    <Button component={RouterLink} to="/profile" variant="subtle">Profile</Button>
                    <Button variant="subtle" onClick={handleLogout} component={RouterLink} to="/login">Logout</Button>
                  </>
                ) : (
                  <>
                    <Button component={RouterLink} to="/login" variant="subtle">Login</Button>
                    <Button component={RouterLink} to="/signup">Sign Up</Button>
                  </>
                )}
              </Group>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar py="md" px={4}>
            <Button component={RouterLink} to="/" variant="subtle" onClick={toggle}>Home</Button>
            {isLoggedIn ? (
              <>
                {localStorage.getItem('userRole') === 'super_admin' && <Button component={RouterLink} to="/admin" variant="subtle" onClick={toggle}>Admin Panel</Button>}
                <Button component={RouterLink} to="/upload" variant="subtle" onClick={toggle}>Upload Note</Button>
                <Button component={RouterLink} to="/profile" variant="subtle" onClick={toggle}>Profile</Button>
                <Button variant="subtle" onClick={() => { handleLogout(); toggle(); }} component={RouterLink} to="/login">Logout</Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" variant="subtle" onClick={toggle}>Login</Button>
                <Button component={RouterLink} to="/signup" onClick={toggle}>Sign Up</Button>
              </>
            )}
          </AppShell.Navbar>

          <AppShell.Main>
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
          </AppShell.Main>
        </AppShell>
      </Router>
    </MantineProvider>
  );
}

export default App;