const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // In production, specify your frontend domain
        methods: ["GET", "POST"]
    }
});

// JWT Secret Key (in production, store this in environment variables)
const JWT_SECRET = 'your-secret-key';

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors())
// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Store active users' socket connections
const activeUsers = new Map(); // email -> socket.id

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Group Schema
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    creator: {
        type: String,
        required: true
    },
    members: [{
        email: String,
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'active'],
            default: 'pending'
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Task Schema
const taskSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    assignedTo: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        required: true,
        enum: ['todo', 'in-progress', 'completed'],
        default: 'todo'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Message Schema
const messageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});
const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Message = mongoose.model('Message', messageSchema);
const Task = mongoose.model('Task', taskSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Please login again',
                error: 'Token has expired'
            });
        }
        return res.status(401).json({
            message: 'Invalid token',
            error: 'Token validation failed'
        });
    }
};

// Helper middleware to check if user is group admin
const isGroupAdmin = async (req, res, next) => {
    try {
        // Get groupId from either params or body
        const groupId = req.params.groupId || req.body.groupId;

        if (!groupId) {
            return res.status(400).json({ message: 'Group ID is required' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const member = group.members.find(m => m.email === req.user.email);
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.group = group;
        next();
    } catch (error) {
        console.error('isGroupAdmin middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Socket.IO middleware for authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    const userEmail = socket.user.email;
    activeUsers.set(userEmail, socket.id);

    console.log(`User connected: ${userEmail}`);

    // Join socket rooms for all user's active groups
    Group.find({
        'members.email': userEmail,
        'members.status': 'active'
    }).then(groups => {
        groups.forEach(group => {
            socket.join(group._id.toString());
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        activeUsers.delete(userEmail);
        console.log(`User disconnected: ${userEmail}`);
    });

    // Handle joining a new group
    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
    });

    // Handle leaving a group
    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
    });

    // Handle new message
    socket.on('sendMessage', async ({ groupId, content }) => {
        try {
            const group = await Group.findById(groupId);
            if (!group) {
                socket.emit('error', { message: 'Group not found' });
                return;
            }

            const member = group.members.find(
                m => m.email === userEmail && m.status === 'active'
            );

            if (!member) {
                socket.emit('error', { message: 'Not a member of this group' });
                return;
            }

            const message = new Message({
                groupId,
                sender: userEmail,
                content
            });

            await message.save();

            // Broadcast message to all group members
            io.to(groupId).emit('newMessage', {
                groupId,
                message: {
                    _id: message._id,
                    sender: message.sender,
                    content: message.content,
                    timestamp: message.timestamp
                }
            });
        } catch (error) {
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ groupId, isTyping }) => {
        socket.to(groupId).emit('userTyping', {
            groupId,
            user: userEmail,
            isTyping
        });
    });
});

// Auth Routes

// Signup
app.post('/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                message: 'Please provide all required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Invalid email format'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            name
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Return user data (excluding password)
        const userData = {
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            status: user.status
        };

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }

        // Update user status
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Return user data (excluding password)
        const userData = {
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            status: user.status
        };

        // Notify other users about online status
        io.emit('userStatus', {
            email: user.email,
            status: 'online'
        });

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Logout
app.post('/auth/logout', verifyToken, async (req, res) => {
    try {
        // Update user status
        const user = await User.findOne({ email: req.user.email });
        if (user) {
            user.status = 'offline';
            user.lastSeen = new Date();
            await user.save();

            // Notify other users about offline status
            io.emit('userStatus', {
                email: user.email,
                status: 'offline'
            });
        }

        // Disconnect socket if exists
        const socketId = activeUsers.get(req.user.email);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.disconnect(true);
            }
            activeUsers.delete(req.user.email);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Group Routes

// Create group
app.post('/groups', verifyToken, async (req, res) => {
    try {
        const { name, invitedUsers } = req.body;

        const group = new Group({
            name,
            creator: req.user.email,
            members: [
                { email: req.user.email, status: 'active', role: 'admin' },
                ...invitedUsers.map(email => ({
                    email,
                    status: 'pending',
                    role: 'member'
                }))
            ]
        });

        await group.save();

        // Join creator to socket room
        const creatorSocket = io.sockets.sockets.get(activeUsers.get(req.user.email));
        if (creatorSocket) {
            creatorSocket.join(group._id.toString());
        }

        res.status(201).json({
            message: 'Group created successfully',
            group
        });
    } catch (error) {
        console.error('Group creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's groups
app.get('/groups', verifyToken, async (req, res) => {
    try {
        const groups = await Group.find({
            'members.email': req.user.email,
            'members.status': 'active'
        });

        res.json({ groups });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept group invitation
app.post('/groups/:groupId/accept', verifyToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const memberIndex = group.members.findIndex(
            member => member.email === req.user.email
        );

        if (memberIndex === -1) {
            return res.status(403).json({ message: 'You are not invited to this group' });
        }

        if (group.members[memberIndex].status === 'active') {
            return res.status(400).json({ message: 'You are already a member' });
        }

        group.members[memberIndex].status = 'active';
        await group.save();

        // Join socket room
        const userSocket = io.sockets.sockets.get(activeUsers.get(req.user.email));
        if (userSocket) {
            userSocket.join(group._id.toString());
        }

        res.json({
            message: 'Successfully joined the group',
            group
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave group
app.post('/groups/:groupId/leave', verifyToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const memberIndex = group.members.findIndex(
            member => member.email === req.user.email
        );

        if (memberIndex === -1 || group.members[memberIndex].status !== 'active') {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // Remove member from group
        group.members.splice(memberIndex, 1);
        await group.save();

        // Leave socket room
        const userSocket = io.sockets.sockets.get(activeUsers.get(req.user.email));
        if (userSocket) {
            userSocket.leave(group._id.toString());
        }

        // Notify other members
        io.to(group._id.toString()).emit('memberLeft', {
            groupId: group._id,
            email: req.user.email
        });

        res.json({ message: 'Successfully left the group' });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Invite users to group
app.post('/groups/:groupId/invite', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const { users } = req.body;
        const group = req.group; // From isGroupAdmin middleware

        // Filter out users who are already members
        const existingEmails = new Set(group.members.map(m => m.email));
        const newUsers = users.filter(email => !existingEmails.has(email));

        // Add new users as pending members
        group.members.push(...newUsers.map(email => ({
            email,
            status: 'pending',
            role: 'member'
        })));

        await group.save();

        // Notify invited users if they're online
        newUsers.forEach(email => {
            const socketId = activeUsers.get(email);
            if (socketId) {
                io.to(socketId).emit('groupInvitation', {
                    groupId: group._id,
                    groupName: group.name,
                    invitedBy: req.user.email
                });
            }
        });

        res.json({
            message: 'Invitations sent successfully',
            group
        });
    } catch (error) {
        console.error('Invite users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove user from group
app.post('/groups/:groupId/remove/:userEmail', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const group = req.group; // From isGroupAdmin middleware
        const userToRemove = req.params.userEmail;

        const memberIndex = group.members.findIndex(
            member => member.email === userToRemove
        );

        if (memberIndex === -1) {
            return res.status(404).json({ message: 'User not found in group' });
        }

        // Prevent removing the last admin
        if (group.members[memberIndex].role === 'admin' &&
            group.members.filter(m => m.role === 'admin').length === 1) {
            return res.status(400).json({
                message: 'Cannot remove the last admin'
            });
        }

        // Remove member
        group.members.splice(memberIndex, 1);
        await group.save();

        // Remove user from socket room if online
        const socketId = activeUsers.get(userToRemove);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(group._id.toString());
            }
        }

        // Notify group members
        io.to(group._id.toString()).emit('memberRemoved', {
            groupId: group._id,
            email: userToRemove
        });

        res.json({
            message: 'User removed successfully',
            group
        });
    } catch (error) {
        console.error('Remove user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Task Routes

// Create task
app.post('/tasks', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const { groupId, title, description, dueDate, priority, assignedTo } = req.body;
        console.log('heree')
        // Check if user is a member of the group
        const group = await Group.findById(groupId);
        if (!group || !group.members.some(m => m.email === req.user.email && m.status === 'active')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const task = new Task({
            groupId,
            title,
            description,
            dueDate,
            priority,
            assignedTo,
            status: 'todo'
        });

        await task.save();

        // Notify assigned users about the new task
        assignedTo.forEach(email => {
            const socketId = activeUsers.get(email);
            if (socketId) {
                io.to(socketId).emit('newTask', {
                    groupId,
                    task: {
                        _id: task._id,
                        title: task.title,
                        description: task.description,
                        dueDate: task.dueDate,
                        priority: task.priority,
                        assignedTo: task.assignedTo,
                        status: task.status
                    }
                });
            }
        });

        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tasks
app.get('/tasks', verifyToken, async (req, res) => {
    try {
        const { groupId, assignedTo, status } = req.query;
        const query = { groupId };

        if (assignedTo) {
            query.assignedTo = { $in: [assignedTo] };
        }

        if (status) {
            query.status = status;
        }

        const tasks = await Task.find(query);
        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task details
app.get('/tasks/:taskId', verifyToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is a member of the group
        const group = await Group.findById(task.groupId);
        if (!group || !group.members.some(m => m.email === req.user.email && m.status === 'active')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task
app.patch('/tasks/:taskId', verifyToken, async (req, res) => {
    try {
        const { title, description, dueDate, priority, assignedTo, status } = req.body;
        const updates = {};

        if (title) updates.title = title;
        if (description) updates.description = description;
        if (dueDate) updates.dueDate = dueDate;
        if (priority) updates.priority = priority;
        if (assignedTo) updates.assignedTo = assignedTo;
        if (status) updates.status = status;

        updates.updatedAt = new Date();

        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            { $set: updates },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Notify assigned users about the task update
        io.to(task.groupId.toString()).emit('taskUpdated', {
            taskId: task._id,
            updates
        });

        res.json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign task
app.post('/tasks/:taskId/assign', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.assignedTo = [...new Set([...task.assignedTo, ...assignedTo])];
        await task.save();

        // Notify newly assigned users
        assignedTo.forEach(email => {
            const socketId = activeUsers.get(email);
            if (socketId) {
                io.to(socketId).emit('taskAssigned', {
                    taskId: task._id,
                    title: task.title,
                    groupId: task.groupId
                });
            }
        });

        res.json({
            message: 'Task assigned successfully',
            task
        });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Complete task
app.post('/tasks/:taskId/complete', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            { $set: { status: 'completed', updatedAt: new Date() } },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Notify group members about the completed task
        io.to(task.groupId.toString()).emit('taskCompleted', {
            taskId: task._id,
            title: task.title
        });

        res.json({
            message: 'Task completed successfully',
            task
        });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});// Message Routes

// Get group messages
app.get('/groups/:groupId/messages', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { before, limit = 50 } = req.query;

        // Check if user is member of the group
        const group = await Group.findOne({
            _id: groupId,
            'members.email': req.user.email,
            'members.status': 'active'
        });

        if (!group) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Build query
        const query = { groupId };
        if (before) {
            query.timestamp = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User Routes

// Get user profile
app.get('/users/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email })
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
app.patch('/users/profile', verifyToken, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (avatar) updates.avatar = avatar;

        const user = await User.findOneAndUpdate(
            { email: req.user.email },
            { $set: updates },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's pending group invitations
app.get('/users/invitations', verifyToken, async (req, res) => {
    try {
        const groups = await Group.find({
            'members.email': req.user.email,
            'members.status': 'pending'
        });

        res.json({ invitations: groups });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});