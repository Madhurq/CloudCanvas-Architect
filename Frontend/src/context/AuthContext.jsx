import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sync Firebase user to backend after auth state changes
    const syncUserToBackend = async (firebaseUser) => {
        if (!firebaseUser) return;

        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await apiClient.syncFirebaseUser(idToken);
            const { accessToken, refreshToken } = response?.data || {};
            if (accessToken) {
                apiClient.setTokens(accessToken, refreshToken);
            }
        } catch (error) {
            console.warn('Failed to sync user to backend:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await syncUserToBackend(firebaseUser);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToBackend(result.user);
        return result;
    };

    const signup = async (email, password) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserToBackend(result.user);
        return result;
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await syncUserToBackend(result.user);
        return result;
    };

    const logout = async () => {
        return signOut(auth);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
