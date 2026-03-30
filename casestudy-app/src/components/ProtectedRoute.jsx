import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../store/useStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, authLoading } = useStore();

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
