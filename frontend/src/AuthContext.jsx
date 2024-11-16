import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, setAuthToken, initializeSocket } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            setUser(response.data.user);
            initializeSocket(localStorage.getItem('token'));
        } catch (error) {
            localStorage.removeItem('token');
            setAuthToken(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;
        const userEmail = response.data.user.email;
        console.log(response.data.user)
        localStorage.setItem('user', response.data.user);
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', userEmail)
        setAuthToken(token);
        setUser(user);
        initializeSocket(token);
        return user;
    };

    const signup = async (name, email, password) => {
        const response = await api.post('/auth/signup', { name, email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setAuthToken(token);
        setUser(user);
        initializeSocket(token);
        return user;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('userEmail');
            localStorage.removeItem('token');
            setAuthToken(null);
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};