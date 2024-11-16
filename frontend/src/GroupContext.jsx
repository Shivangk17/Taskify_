import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
const GroupContext = createContext(null);

export const GroupProvider = ({ children }) => {
    const [groups, setGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        // Only fetch data if there's a logged-in user
        if (user) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    await Promise.all([
                        fetchGroups(),
                        fetchInvitations()
                    ]);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            // Reset state when user logs out
            setGroups([]);
            setInvitations([]);
            setLoading(false);
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data.groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const response = await api.get('/users/invitations');
            setInvitations(response.data.invitations);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        }
    };

    const createGroup = async (name, invitedUsers) => {
        const response = await api.post('/groups', { name, invitedUsers });
        setGroups([...groups, response.data.group]);
        return response.data.group;
    };

    const acceptInvitation = async (groupId) => {
        await api.post(`/groups/${groupId}/accept`);
        await Promise.all([fetchGroups(), fetchInvitations()]);
    };

    const leaveGroup = async (groupId) => {
        await api.post(`/groups/${groupId}/leave`);
        setGroups(groups.filter(group => group._id !== groupId));
    };

    const inviteUsers = async (groupId, users) => {
        const response = await api.post(`/groups/${groupId}/invite`, { users });
        const updatedGroups = groups.map(group =>
            group._id === groupId ? response.data.group : group
        );
        setGroups(updatedGroups);
    };

    const removeUser = async (groupId, userEmail) => {
        const response = await api.post(`/groups/${groupId}/remove/${userEmail}`);
        const updatedGroups = groups.map(group =>
            group._id === groupId ? response.data.group : group
        );
        setGroups(updatedGroups);
    };

    return (
        <GroupContext.Provider value={{
            groups,
            invitations,
            loading,
            createGroup,
            acceptInvitation,
            leaveGroup,
            inviteUsers,
            removeUser,
            refreshGroups: fetchGroups,
            refreshInvitations: fetchInvitations
        }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroups = () => {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error('useGroups must be used within a GroupProvider');
    }
    return context;
};