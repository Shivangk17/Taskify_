'use client';

import React, { useState, useEffect } from 'react';
import {
    Menu,
    X,
    CheckCircle,
    ArrowRight,
    LogIn,
    UserPlus,
    Zap,
    Users,
    Calendar,
    BarChart
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const AnimatedFeature = ({ icon: Icon, title, description }) => (
    <motion.div
        className="flex items-start"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Icon className="text-blue-400 mr-4 mt-1 flex-shrink-0" size={24} />
        <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    </motion.div>
);

const AnimatedPricingTier = ({ plan, price, features }) => (
    <motion.div
        className="border border-gray-800 p-8 rounded-lg text-center transition-all duration-300 hover:border-blue-400"
        whileHover={{ scale: 1.05, boxShadow: '0px 0px 8px rgba(59, 130, 246, 0.5)' }}
    >
        <h3 className="text-2xl font-bold mb-4">{plan}</h3>
        <div className="text-4xl font-bold mb-6 text-blue-400">
            {price}
            {price !== "Custom" && <span className="text-xl font-normal text-gray-400">/mo</span>}
        </div>
        <ul className="mb-8 space-y-4">
            {features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center justify-center">
                    <CheckCircle size={16} className="mr-2 text-blue-400" />
                    <span className="text-gray-400">{feature}</span>
                </li>
            ))}
        </ul>
        <AnimatedButton
            className={`w-full bg-gray-800 text-white px-6 py-2 rounded-full font-semibold hover:bg-${vibrantBlue} transition-all duration-300`}
        >
            Choose Plan
        </AnimatedButton>
    </motion.div>
);

const TypewriterEffect = ({ text }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prevText => prevText + text[currentIndex]);
                setCurrentIndex(prevIndex => prevIndex + 1);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, text]);

    return <span>{displayText}</span>;
};

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

export default function TaskifyPlayfulLanding() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(null);
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans">
            <header className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.div
                        className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Taskify
                    </motion.div>
                    <nav className="hidden md:flex items-center space-x-8">
                        <AnimatedButton className="hover:text-blue-300 transition-colors">
                            <a href="#features">Features</a>
                        </AnimatedButton>
                        <AnimatedButton className="hover:text-blue-300 transition-colors">
                            <a href="#pricing">Pricing</a>
                        </AnimatedButton>
                        <AnimatedButton className="hover:text-blue-300 transition-colors">
                            <a href="#contact">Contact</a>
                        </AnimatedButton>
                        <AnimatedButton
                            className="text-blue-400 hover:text-white transition-colors flex items-center"
                            onClick={() => navigate('/login')}
                        >
                            <LogIn className="mr-2" size={18} />
                            Login
                        </AnimatedButton>
                        <AnimatedButton
                            className={`bg-${vibrantBlue} text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors flex items-center`}
                            onClick={() => navigate('/signup')}
                        >
                            <UserPlus className="mr-2" size={18} />
                            Sign Up
                        </AnimatedButton>
                    </nav>
                    <AnimatedButton
                        className="md:hidden text-blue-400"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </AnimatedButton>
                </div>
            </header>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden bg-gray-900 text-white p-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ul className="flex flex-col space-y-4">
                            <li><a href="#features" className="block py-2 hover:text-blue-300 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="block py-2 hover:text-blue-300 transition-colors">Pricing</a></li>
                            <li><a href="#contact" className="block py-2 hover:text-blue-300 transition-colors">Contact</a></li>
                            <li><button onClick={() => setShowAuthModal('login')} className="w-full text-left py-2 text-blue-400 hover:text-white transition-colors flex items-center">
                                <LogIn className="mr-2" size={18} />
                                Login
                            </button></li>
                            <li><button onClick={() => setShowAuthModal('signup')} className="w-full text-left py-2 text-blue-400 hover:text-white transition-colors flex items-center">
                                <UserPlus className="mr-2" size={18} />
                                Sign Up
                            </button></li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            <main>
                <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <motion.h1
                            className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Simplify Your Workflow with{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                                Taskify
                            </span>
                        </motion.h1>
                        <motion.p
                            className="text-xl mb-10 text-gray-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <TypewriterEffect text="Organize, collaborate, and achieve more. Your tasks, streamlined." />
                        </motion.p>
                        <AnimatedButton
                            className={`inline-flex items-center justify-center bg-gradient-to-r from-${vibrantBlue} via-${vibrantPurple} to-${vibrantPink} text-white px-8 py-3 rounded-full font-semibold text-lg hover:opacity-90 transition-all duration-300`}
                        >
                            Get Started <ArrowRight className="ml-2" />
                        </AnimatedButton>
                    </div>
                    <div className="absolute top-20 left-20 hidden md:block z-0">
                        <FloatingIcon icon={Zap} delay={0} />
                    </div>
                    <div className="absolute bottom-20 right-20 hidden md:block z-0">
                        <FloatingIcon icon={Users} delay={0.2} />
                    </div>
                    <div className="absolute top-1/2 left-10 hidden md:block z-0">
                        <FloatingIcon icon={Calendar} delay={0.4} />
                    </div>
                    <div className="absolute bottom-1/4 right-1/4 hidden md:block z-0">
                        <FloatingIcon icon={BarChart} delay={0.6} />
                    </div>
                </section>

                <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Features</h2>
                        <p className="text-xl text-gray-400">Empower your team with these powerful tools</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto">
                        <AnimatedFeature
                            icon={Users}
                            title="Collaborative Team Management"
                            description="Bring your team together and work as one, from anywhere."
                        />
                        <AnimatedFeature
                            icon={Calendar}
                            title="Integrated Calendar"
                            description="Keep track of deadlines, events, and milestones all in one place."
                        />
                        <AnimatedFeature
                            icon={BarChart}
                            title="Data-Driven Insights"
                            description="Make informed decisions with insightful analytics."
                        />
                        <AnimatedFeature
                            icon={Zap}
                            title="Lightning-Fast Task Updates"
                            description="Stay up-to-date with real-time notifications and status updates."
                        />
                    </div>
                </section>

                <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gray-900">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Pricing</h2>
                        <p className="text-xl text-gray-400">Choose the right plan for your team</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <AnimatedPricingTier
                            plan="Basic"
                            price="$10"
                            features={['10 Projects', 'Basic Analytics', 'Email Support']}
                        />
                        <AnimatedPricingTier
                            plan="Pro"
                            price="$20"
                            features={['Unlimited Projects', 'Advanced Analytics', 'Priority Support']}
                        />
                        <AnimatedPricingTier
                            plan="Enterprise"
                            price="Custom"
                            features={['Dedicated Support', 'Custom Integrations', 'Onboarding Training']}
                        />
                    </div>
                </section>
            </main>

            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setShowAuthModal(null)}
                    >
                        <motion.div
                            className="bg-gray-800 rounded-lg p-8 text-white w-96"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-semibold mb-6">
                                {showAuthModal === 'login' ? 'Login to Taskify' : 'Sign Up for Taskify'}
                            </h3>
                            <AnimatePresence>
                                {showAuthModal && (
                                    <motion.div
                                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => setShowAuthModal(null)}
                                    >
                                        <motion.div
                                            className="bg-gray-900 rounded-lg p-8 text-white w-full max-w-md mx-4"
                                            initial={{ y: -50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -50, opacity: 0 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-2xl font-semibold">
                                                    {showAuthModal === 'login' ? 'Login to Taskify' : 'Sign Up for Taskify'}
                                                </h3>
                                                <button
                                                    onClick={() => setShowAuthModal(null)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            {showAuthModal === 'login' ? (
                                                <form className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1" htmlFor="email">
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            className="w-full px-4 py-2 bg-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                                                            name="password"
                                                            className="w-full px-4 py-2 bg-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            placeholder="Enter your password"
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className={`w-full bg-${vibrantBlue} text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-600 transition-all duration-300`}
                                                    >
                                                        Login
                                                    </button>
                                                </form>
                                            ) : (
                                                <form className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1" htmlFor="email">
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            className="w-full px-4 py-2 bg-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                                                            name="password"
                                                            className="w-full px-4 py-2 bg-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            placeholder="Enter your password"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                                                            Confirm Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            id="confirmPassword"
                                                            name="confirmPassword"
                                                            className="w-full px-4 py-2 bg-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            placeholder="Confirm your password"
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className={`w-full bg-${vibrantBlue} text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-600 transition-all duration-300`}
                                                    >
                                                        Sign Up
                                                    </button>
                                                </form>
                                            )}

                                            <div className="mt-4 text-center text-sm text-gray-400">
                                                {showAuthModal === 'login' ? (
                                                    <>
                                                        Don't have an account?{' '}
                                                        <button
                                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                                            onClick={() => setShowAuthModal('signup')}
                                                        >
                                                            Sign up
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        Already have an account?{' '}
                                                        <button
                                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                                            onClick={() => setShowAuthModal('login')}
                                                        >
                                                            Login
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatedButton
                                className={`w-full bg-${vibrantBlue} text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition-all duration-300 mt-6`}
                                onClick={() => setShowAuthModal(null)}
                            >
                                Close
                            </AnimatedButton>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-center">
                <p className="text-gray-400">&copy; 2023 Taskify. All rights reserved.</p>
            </footer>
        </div>
    );
}
