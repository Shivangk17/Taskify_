import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useGroups } from './GroupContext';
import { getSocket, api } from './api';

const ChatInterface = () => {
    const { user } = useAuth();
    const { groups } = useGroups();
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState({});
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef({});

    useEffect(() => {
        const socket = getSocket();

        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', handleUserTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping', handleUserTyping);
        };
    }, [selectedGroup]);

    const handleNewMessage = ({ groupId, message }) => {
        if (groupId === selectedGroup?._id) {
            setMessages(prev => [...prev, message]);
        }
    };

    const handleUserTyping = ({ groupId, user: typingUser, isTyping }) => {
        if (groupId === selectedGroup?._id && typingUser !== user.email) {
            setTyping(prev => ({ ...prev, [typingUser]: isTyping }));
        }
    };

    const loadMessages = async (groupId) => {
        setLoading(true);
        try {
            const response = await api.get(`/groups/${groupId}/messages`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            loadMessages(selectedGroup._id);
            getSocket().emit('joinGroup', selectedGroup._id);
        }
        return () => {
            if (selectedGroup) {
                getSocket().emit('leaveGroup', selectedGroup._id);
            }
        };
    }, [selectedGroup]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedGroup) return;

        getSocket().emit('sendMessage', {
            groupId: selectedGroup._id,
            content: newMessage
        });

        setNewMessage('');
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (selectedGroup) {
            const socket = getSocket();
            socket.emit('typing', {
                groupId: selectedGroup._id,
                isTyping: true
            });

            // Clear previous timeout
            if (typingTimeoutRef.current[selectedGroup._id]) {
                clearTimeout(typingTimeoutRef.current[selectedGroup._id]);
            }

            // Set new timeout
            typingTimeoutRef.current[selectedGroup._id] = setTimeout(() => {
                socket.emit('typing', {
                    groupId: selectedGroup._id,
                    isTyping: false
                });
            }, 2000);
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            <motion.div
                className="w-1/4 bg-gray-800 p-4 overflow-hidden"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-xl font-bold mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Groups
                </h3>
                <div className="overflow-y-auto h-full">
                    {groups.map(group => (
                        <motion.div
                            key={group._id}
                            onClick={() => setSelectedGroup(group)}
                            className={`p-2 mb-2 rounded-md cursor-pointer transition-colors ${selectedGroup?._id === group._id ? 'bg-blue-600' : 'hover:bg-gray-700'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {group.name}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="flex-1 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {selectedGroup ? (
                    <>
                        <div className="bg-gray-800 p-4">
                            <h3 className="text-xl font-bold flex items-center">
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {selectedGroup.name}
                            </h3>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map(message => (
                                        <motion.div
                                            key={message._id}
                                            className={`mb-4 ${message.sender === user.email ? 'text-right' : 'text-left'
                                                }`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <span className="inline-block bg-gray-700 rounded-lg px-4 py-2">
                                                <strong>{message.sender === user.email ? 'You' : message.sender}: </strong>
                                                {message.content}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-gray-800">
                            <div className="mb-2 h-6">
                                <AnimatePresence>
                                    {Object.entries(typing)
                                        .filter(([email, isTyping]) => isTyping)
                                        .map(([email]) => (
                                            <motion.div
                                                key={email}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="text-sm text-gray-400"
                                            >
                                                {email} is typing...
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </div>
                            <form onSubmit={sendMessage} className="flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTyping}
                                    placeholder="Type a message..."
                                    className="flex-1 mr-2 bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-300">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Select a group to start chatting
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ChatInterface;




