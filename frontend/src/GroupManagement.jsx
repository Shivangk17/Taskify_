import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroups } from './GroupContext';
import { useAuth } from './AuthContext';

const GroupManagement = () => {
    const { groups, createGroup, inviteUsers, removeUser, leaveGroup } = useGroups();
    const { user } = useAuth();
    const [newGroupName, setNewGroupName] = useState('');
    const [invitedEmails, setInvitedEmails] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [error, setError] = useState('');

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const emailList = invitedEmails.split(',').map(email => email.trim()).filter(Boolean);
            await createGroup(newGroupName, emailList);
            setNewGroupName('');
            setInvitedEmails('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating group');
        }
    };

    const handleInviteUsers = async (groupId) => {
        try {
            const emailList = invitedEmails.split(',').map(email => email.trim()).filter(Boolean);
            await inviteUsers(groupId, emailList);
            setInvitedEmails('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error inviting users');
        }
    };

    const handleRemoveUser = async (groupId, userEmail) => {
        try {
            await removeUser(groupId, userEmail);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error removing user');
        }
    };

    const handleLeaveGroup = async (groupId) => {
        try {
            await leaveGroup(groupId);
            setSelectedGroup(null);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error leaving group');
        }
    };

    const isGroupAdmin = (group) => {
        const member = group.members.find(m => m.email === user.email);
        return member?.role === 'admin';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
            <motion.h2
                className="text-3xl font-bold mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Group Management
            </motion.h2>

            {error && (
                <motion.div
                    className="bg-red-500 text-white p-4 rounded-md mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.div>
            )}

            <motion.div
                className="bg-gray-800 p-6 rounded-lg mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium mb-1">Group Name:</label>
                        <input
                            id="groupName"
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="inviteEmails" className="block text-sm font-medium mb-1">Invite Users (comma-separated emails):</label>
                        <input
                            id="inviteEmails"
                            type="text"
                            value={invitedEmails}
                            onChange={(e) => setInvitedEmails(e.target.value)}
                            placeholder="user1@example.com, user2@example.com"
                            className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                    >
                        Create Group
                    </button>
                </form>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <h3 className="text-2xl font-semibold mb-4">Your Groups</h3>
                {groups.map(group => (
                    <motion.div
                        key={group._id}
                        className="bg-gray-800 p-4 rounded-lg mb-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-medium">{group.name}</h4>
                            <button
                                onClick={() => setSelectedGroup(selectedGroup?._id === group._id ? null : group)}
                                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors duration-300"
                            >
                                {selectedGroup?._id === group._id ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {selectedGroup?._id === group._id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <h5 className="font-medium mb-2">Members:</h5>
                                    {group.members.map(member => (
                                        <div key={member.email} className="flex justify-between items-center mb-2">
                                            <span>{member.email} ({member.role})</span>
                                            {isGroupAdmin(group) && member.email !== user.email && (
                                                <button
                                                    onClick={() => handleRemoveUser(group._id, member.email)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-sm transition-colors duration-300"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {isGroupAdmin(group) && (
                                        <div className="mt-4">
                                            <h5 className="font-medium mb-2">Invite More Users:</h5>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={invitedEmails}
                                                    onChange={(e) => setInvitedEmails(e.target.value)}
                                                    placeholder="user1@example.com, user2@example.com"
                                                    className="flex-grow px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={() => handleInviteUsers(group._id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                                                >
                                                    Send Invites
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!isGroupAdmin(group) && (
                                        <button
                                            onClick={() => handleLeaveGroup(group._id)}
                                            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                                        >
                                            Leave Group
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default GroupManagement;