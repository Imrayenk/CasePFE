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
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  useEffect(() => {
    useStore.getState().initAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Only Route */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/" element={<Layout />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Regular Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
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
