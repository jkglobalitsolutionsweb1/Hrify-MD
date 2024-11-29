import React from 'react';
import { Navigate } from 'react-router-dom';

// Function to check if the user is authenticated
const isAuthenticated = () => {
  // Check if the user is logged in (you can use Firebase Auth or localStorage)
  const user = localStorage.getItem('user');  // Replace with Firebase auth check if necessary
  return !!user;  // If user exists, they are authenticated
};

const ProtectedRoute = ({ children }) => {
  // If the user is not authenticated, redirect to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated, render the requested page
  return children;
};

export default ProtectedRoute;
