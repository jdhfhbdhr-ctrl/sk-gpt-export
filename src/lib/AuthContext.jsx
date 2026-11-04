import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        setAuthError(null);
      },
      (error) => {
        setAuthError({ type: "unknown", message: error.message });
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return unsubscribe;
  }, []);

  const checkUserAuth = useCallback(async () => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    setIsAuthenticated(!!currentUser);
    setAuthChecked(true);
    setIsLoadingAuth(false);
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  const logout = async (shouldRedirect = true) => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
