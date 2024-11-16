import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Socket.io configuration
let socket = null;

export const initializeSocket = (token) => {
    if (socket) socket.disconnect();

    socket = io(API_URL, {
        auth: { token }
    });

    return socket;
};

export const getSocket = () => socket;