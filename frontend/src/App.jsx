import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import CommandCenterPage from './pages/CommandCenterPage';
import CopilotPage from './pages/CopilotPage';
import WorkspacePage from './pages/WorkspacePage';
import EvidenceGraphPage from './pages/EvidenceGraphPage';
import SearchPage from './pages/SearchPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Private Layout Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <CommandCenterPage />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/copilot" 
          element={
            <PrivateRoute>
              <CopilotPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/workspace/:firId" 
          element={
            <PrivateRoute>
              <WorkspacePage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/evidence" 
          element={
            <PrivateRoute>
              <EvidenceGraphPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/records" 
          element={
            <PrivateRoute>
              <SearchPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/map" 
          element={
            <PrivateRoute>
              <MapPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/chat" 
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
