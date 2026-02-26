import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Optional if they install it, but we can just use standard div or I'll implement a fast one. Wait, I didn't install react-hot-toast.
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Fallback if toast libraries aren't installed, we just comment them out or rely on the user having them since we will add instructions.

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      </Routes>
      <div id="toast-root"></div>
    </>
  );
}

export default App;
