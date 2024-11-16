import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { api } from './api';

const ProfileSettings = () => {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch('/users/profile', {
                name: name || undefined,
                avatar: avatar || undefined
            });

            setSuccess('Profile updated successfully');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating profile');
            setSuccess('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
            <motion.h2
                className="text-3xl font-bold mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Profile Settings
            </motion.h2>

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="bg-red-500 text-white p-4 rounded-md mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        className="bg-green-500 text-white p-4 rounded-md mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.form
                onSubmit={handleSubmit}
                className="bg-gray-800 p-6 rounded-lg mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name:</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="avatar" className="block text-sm font-medium mb-1">Avatar URL:</label>
                    <input
                        id="avatar"
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <motion.button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Update Profile
                </motion.button>
            </motion.form>

            <motion.div
                className="bg-gray-800 p-6 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h3 className="text-xl font-semibold mb-4">Current Profile</h3>
                <p className="mb-2">Email: {user?.email}</p>
                <p className="mb-2">Name: {user?.name}</p>
                {user?.avatar && (
                    <div>
                        <p className="mb-2">Avatar:</p>
                        <motion.img
                            src={user.avatar}
                            alt="Profile avatar"
                            className="max-w-[200px] rounded-md"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ProfileSettings;