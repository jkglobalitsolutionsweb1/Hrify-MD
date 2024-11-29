import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase'; // Adjust based on your Firebase setup

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false when auth state is resolved
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const value = { user };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only if loading is false */}
    </AuthContext.Provider>
  );
};
