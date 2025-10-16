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
import NoteDetails from './components/NoteDetails';
import logo from './logo.png';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { MantineProvider, AppShell, Burger, Group, Button, Image, Drawer, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  if (!isLoggedIn) { return <Navigate to="/login" replace />; }
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [opened, { toggle, close }] = useDisclosure();

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
                    <Button variant="filled" color="red" onClick={handleLogout} component={RouterLink} to="/login">Logout</Button>
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

          <AppShell.Main>
            <Routes>
              <Route path="/" element={<NoteList />} />
              <Route path="/notes/:noteId" element={<NoteDetails />} />
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
        <Drawer opened={opened} onClose={close} title="" hiddenFrom="sm" size="50%">
            <Stack>
                <Button component={RouterLink} to="/" variant="subtle" onClick={close}>Home</Button>
                {isLoggedIn ? (
                  <>
                    {localStorage.getItem('userRole') === 'super_admin' && <Button component={RouterLink} to="/admin" variant="subtle" onClick={close}>Admin Panel</Button>}
                    <Button component={RouterLink} to="/upload" variant="subtle" onClick={close}>Upload Note</Button>
                    <Button component={RouterLink} to="/profile" variant="subtle" onClick={close}>Profile</Button>
                    <Button variant="filled" color="red" onClick={handleLogout} component={RouterLink} to="/login">Logout</Button>
                  </>
                ) : (
                  <>
                    <Button component={RouterLink} to="/login" variant="subtle" onClick={close}>Login</Button>
                    <Button component={RouterLink} to="/signup" onClick={close}>Sign Up</Button>
                  </>
                )}
            </Stack>
        </Drawer>
      </Router>
    </MantineProvider>
  );
}

export default App;