import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Layout from './components/Layout';
import Workspace from './pages/Workspace';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import GradingView from './pages/GradingView';
import CaseCreate from './pages/CaseCreate';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  useEffect(() => {
    useStore.getState().initAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspace/:id" element={<Workspace />} />
            <Route path="results/:id" element={<Results />} />
            <Route path="grading/:id" element={<GradingView />} />
            <Route path="create-case" element={<CaseCreate />} />
            <Route path="edit-case/:id" element={<CaseCreate />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
