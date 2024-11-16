// import React, { useState, useEffect } from 'react';
// import { useGroups } from './GroupContext';
// import { api } from './api';
// import { PlusCircle, Clock, AlertCircle } from 'lucide-react';

// const TaskPriorityBadge = ({ priority }) => {
//     const colors = {
//         high: 'bg-red-100 text-red-800',
//         medium: 'bg-yellow-100 text-yellow-800',
//         low: 'bg-green-100 text-green-800'
//     };

//     return (
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
//             {priority.charAt(0).toUpperCase() + priority.slice(1)}
//         </span>
//     );
// };

// const TaskStatusBadge = ({ status }) => {
//     const colors = {
//         todo: 'bg-gray-100 text-gray-800',
//         'in-progress': 'bg-blue-100 text-blue-800',
//         completed: 'bg-green-100 text-green-800'
//     };

//     return (
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
//             {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
//         </span>
//     );
// };

import React, { useState, useEffect } from 'react'
import { useGroups } from './GroupContext'
import { api } from './api'
import { PlusCircle, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const vibrantBlue = '#3B82F6'
const vibrantPurple = '#8B5CF6'
const vibrantPink = '#EC4899'

const TaskPriorityBadge = ({ priority }) => {
    const colors = {
        high: 'bg-red-500 text-white',
        medium: 'bg-yellow-500 text-white',
        low: 'bg-green-500 text-white'
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    )
}

const TaskStatusBadge = ({ status }) => {
    const colors = {
        todo: 'bg-gray-500 text-white',
        'in-progress': 'bg-blue-500 text-white',
        completed: 'bg-green-500 text-white'
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
    )
}

const TaskCard = ({ task, onStatusChange, isAdmin }) => {
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && task.status !== 'completed';

    return (
        <motion.div
            className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-white">{task.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                        {isOverdue && (
                            <span className="flex items-center text-xs text-red-400 font-medium">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Overdue
                            </span>
                        )}
                    </div>

                    <div className="flex items-center text-sm text-gray-400 mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        Due: {dueDate.toLocaleDateString()}
                    </div>

                    <div className="text-sm text-gray-400">
                        Assigned to: {task.assignedTo.join(', ')}
                    </div>
                </div>

                {isAdmin && task.status !== 'completed' && (
                    <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task._id, e.target.value)}
                        className="ml-4 px-3 py-1 border border-gray-600 rounded-md text-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                )}
            </div>
        </motion.div>
    );
};

const CreateTaskModal = ({ isOpen, onClose, onSubmit, groupId, members }) => {
    const user = localStorage.getItem('userEmail');
    const [formData, setFormData] = useState({
        user: {

        },
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        assignedTo: []
    });

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-gray-800 rounded-lg p-6 w-full max-w-lg"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Create New Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit({ ...formData, groupId })
                }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Assign To</label>
                        <select
                            multiple
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.assignedTo}
                            onChange={(e) => setFormData({
                                ...formData,
                                assignedTo: Array.from(e.target.selectedOptions, option => option.value)
                            })}
                        >
                            {members.map(member => (
                                <option key={member.email} value={member.email}>
                                    {member.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 bg-gradient-to-r from-${vibrantBlue} via-${vibrantPurple} to-${vibrantPink} text-white rounded-md hover:opacity-90 transition-all duration-300`}
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const TaskGroup = ({ group, tasks, onStatusChange, onCreateTask }) => {
    const isAdmin = group.members.some(
        member => member.email === localStorage.getItem('userEmail') && member.role === 'admin'
    );

    return (
        <motion.div
            className="bg-gray-800 rounded-lg shadow-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{group.name}</h2>
                {isAdmin && (
                    <button
                        onClick={() => onCreateTask(group._id)}
                        className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Task
                    </button>
                )}
            </div>
            <div className="p-4">
                {tasks.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No tasks yet</p>
                ) : (
                    tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={onStatusChange}
                            isAdmin={isAdmin}
                        />
                    ))
                )}
            </div>
        </motion.div>
    );
};

const TaskPage = () => {
    const { groups } = useGroups();
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, [groups]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const groupTasks = {};

            await Promise.all(groups.map(async (group) => {
                const response = await api.get('/tasks', {
                    params: { groupId: group._id }
                });
                groupTasks[group._id] = response.data.tasks;
            }));

            setTasks(groupTasks);
        } catch (error) {
            setError('Failed to load tasks. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}`, { status: newStatus });
            await fetchTasks();
        } catch (error) {
            setError('Failed to update task status. Please try again.');
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            console.log(taskData)
            await api.post('/tasks', taskData);

            await fetchTasks();
            setCreateModalOpen(false);
        } catch (error) {
            setError('Failed to create task. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-center">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            {error && (
                <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-300">Error</h3>
                            <div className="mt-2 text-sm text-red-200">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {groups.map(group => (
                <TaskGroup
                    key={group._id}
                    group={group}
                    tasks={tasks[group._id] || []}
                    onStatusChange={handleStatusChange}
                    onCreateTask={(groupId) => {
                        setSelectedGroupId(groupId)
                        setCreateModalOpen(true)
                    }}
                />
            ))}

            <AnimatePresence>
                {createModalOpen && (
                    <CreateTaskModal
                        isOpen={createModalOpen}
                        onClose={() => setCreateModalOpen(false)}
                        onSubmit={handleCreateTask}
                        groupId={selectedGroupId}
                        members={groups.find(g => g._id === selectedGroupId)?.members || []}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskPage;