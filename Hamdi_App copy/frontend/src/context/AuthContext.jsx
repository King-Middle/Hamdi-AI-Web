import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.status === 200) {
            await checkUserLoggedIn();
            return true;
        }
        return false;
    };

    const register = async (email, password) => {
        const response = await api.post('/auth/register', { email, password });
        if (response.status === 200) {
            // Auto login after register
            return await login(email, password);
        }
        return false;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
