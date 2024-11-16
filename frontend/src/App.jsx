import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { GroupProvider } from './GroupContext';
import Login from './Login';
import Signup from './Signup';
import ChatInterface from './ChatInterface';
import GroupManagement from './GroupManagement';
import GroupInvitations from './GroupInvitations';
import ProfileSettings from './ProfileSettings';
import TaskManagementPage from './TaskPage';
import TaskifyPlayfulLanding from './TaskifyMinimalLanding';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageSquare, Users, Mail, User, LogOut, CheckSquare } from 'lucide-react';
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};


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


const Navigation = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [

    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/groups", label: "Manage Groups", icon: Users },
    { href: "/invitations", label: "Invitations", icon: Mail },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (!user) return null;

  return (
    <header className="bg-gray-900 text-white py-4 px-4 sm:px-6 lg:px-8">
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
          {navItems.map((item) => (
            <AnimatedButton key={item.href} className="hover:text-blue-300 transition-colors">
              <a href={item.href} className="flex items-center">
                <item.icon className="mr-2" size={18} />
                {item.label}
              </a>
            </AnimatedButton>
          ))}
          <AnimatedButton
            className="text-red-400 hover:text-white transition-colors flex items-center"
            onClick={logout}
          >
            <LogOut className="mr-2" size={18} />
            Logout
          </AnimatedButton>
        </nav>
        <AnimatedButton
          className="md:hidden text-blue-400"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </AnimatedButton>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-gray-800 mt-4 rounded-lg overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col space-y-2 p-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="block py-2 hover:text-blue-300 transition-colors flex items-center">
                    <item.icon className="mr-2" size={18} />
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <button onClick={logout} className="w-full text-left py-2 text-red-400 hover:text-white transition-colors flex items-center">
                  <LogOut className="mr-2" size={18} />
                  Logout
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <GroupProvider>

          <Routes>
            <Route path='/' element={<TaskifyPlayfulLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <ChatInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <TaskManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <GroupManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invitations"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <GroupInvitations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

          </Routes>
        </GroupProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;