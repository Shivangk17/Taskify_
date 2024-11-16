import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroups } from './GroupContext';

const GroupInvitations = () => {
    const { invitations, acceptInvitation } = useGroups();

    const handleAcceptInvitation = async (groupId) => {
        try {
            await acceptInvitation(groupId);
        } catch (error) {
            console.error('Error accepting invitation:', error);
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
                Group Invitations
            </motion.h2>

            <AnimatePresence>
                {invitations.length === 0 ? (
                    <motion.p
                        className="text-gray-400 text-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        No pending invitations
                    </motion.p>
                ) : (
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    >
                        {invitations.map(group => (
                            <motion.div
                                key={group._id}
                                className="bg-gray-800 rounded-lg p-6 shadow-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                                <p className="text-gray-400 mb-1">Created by: {group.creator}</p>
                                <p className="text-gray-400 mb-4">
                                    Members: {group.members.filter(m => m.status === 'active').length}
                                </p>
                                <motion.button
                                    onClick={() => handleAcceptInvitation(group._id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Accept Invitation
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupInvitations;