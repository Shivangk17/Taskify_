import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { motion, useAnimation } from 'framer-motion';
import { LogIn, Zap, Users, Calendar, BarChart } from 'lucide-react';






const vibrantBlue = '#3B82F6';
const vibrantPurple = '#8B5CF6';
const vibrantPink = '#EC4899';

const AnimatedButton = ({ children, className, onClick }) => (
    <motion.button
        className={className}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
    >
        {children}
    </motion.button>
);

const FloatingIcon = ({ icon: Icon, delay }) => {
    const controls = useAnimation();

    useEffect(() => {
        controls.start({
            y: [0, -10, 0],
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: delay,
            },
        });
    }, [controls, delay]);

    return (
        <motion.div animate={controls}>
            <Icon size={32} className="text-blue-400" />
        </motion.div>
    );
};








const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/tasks');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans flex items-center justify-center px-4 relative overflow-hidden">
            <motion.div
                className="bg-gray-800 rounded-lg p-8 w-full max-w-md relative z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl font-bold mb-6 text-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                        Login to Taskify
                    </span>
                </h2>
                {error && (
                    <motion.div
                        className="bg-red-500 text-white p-3 rounded-md mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <AnimatedButton
                        className={`w-full bg-gradient-to-r from-${vibrantBlue} via-${vibrantPurple} to-${vibrantPink} text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-center`}
                        onClick={handleSubmit}
                    >
                        <LogIn className="mr-2" size={18} />
                        Login
                    </AnimatedButton>
                </form>
            </motion.div>

            {/* Floating Icons */}
            <div className="absolute top-20 left-20 hidden md:block">
                <FloatingIcon icon={Zap} delay={0} />
            </div>
            <div className="absolute bottom-20 right-20 hidden md:block">
                <FloatingIcon icon={Users} delay={0.2} />
            </div>
            <div className="absolute top-1/2 left-10 hidden md:block">
                <FloatingIcon icon={Calendar} delay={0.4} />
            </div>
            <div className="absolute bottom-1/4 right-1/4 hidden md:block">
                <FloatingIcon icon={BarChart} delay={0.6} />
            </div>
        </div>
    );
};

export default Login;