import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Camera, Trophy, Map as MapIcon, LogOut, LogIn, Menu, X } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ReportGarbage from './pages/ReportGarbage';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import CollectorMap from './pages/CollectorMap';

const Sidebar = ({ user, handleLogout, isOpen, onClose }) => {
  const location = useLocation();
  const [myPoints, setMyPoints] = useState(user?.points || 0);

  useEffect(() => {
    if (!user) return;
    const fetchPoints = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leaderboard`);
        const data = await response.json();
        const me = data.find(u => u.username === user.username);
        if (me) setMyPoints(me.points);
      } catch (error) {
        console.error('Failed to fetch points:', error);
      }
    };
    fetchPoints();
  }, [location.pathname, user]);

  let navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
  ];

  if (!user || user.role === 'reporter') {
    navItems.splice(1, 0, { name: 'Report Waste', path: '/report', icon: <Camera size={20} /> });
  } else if (user && user.role === 'collector') {
    navItems = [
      { name: 'Collector Map', path: '/map', icon: <MapIcon size={20} /> },
      { name: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar / Drawer */}
      <aside
        className={`w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
              <MapIcon size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold font-sans tracking-tight">EcoSmart</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4 text-sm text-slate-400 border-b border-slate-700">
          {user ? (
            <>
              Welcome, <br />
              <span className="text-white font-bold text-lg capitalize">{user.username}</span>
              <div className="mt-1 flex text-xs">
                <span className="bg-slate-700 px-2 py-1 rounded-md uppercase tracking-wider">{user.role}</span>
              </div>
            </>
          ) : (
            <>
              Welcome, <br />
              <span className="text-white font-bold text-lg">Guest</span>
              <div className="mt-1 flex text-xs">
                <span className="bg-slate-700 px-2 py-1 rounded-md text-slate-300">Unregistered</span>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 m-4 bg-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 mb-2">My Impact</p>
            <div className="flex items-center space-x-2">
              <Trophy size={16} className="text-yellow-400" />
              <span className="font-bold text-lg">
                {myPoints.toLocaleString()} <span className="text-sm font-normal text-slate-400">pts</span>
              </span>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-700">
          {user ? (
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex items-center text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2"
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center text-primary-400 hover:text-primary-300 transition-colors w-full px-2 py-2"
            >
              <LogIn size={20} className="mr-3" />
              <span className="font-medium">Login to Report</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                <MapIcon size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">EcoSmart</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium capitalize border border-slate-700">
                {user.username} ({user.role})
              </span>
            ) : (
              <Link
                to="/login"
                className="text-xs bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Sidebar & Main Container */}
        <div className="flex relative">
          <Sidebar
            user={user}
            handleLogout={handleLogout}
            isOpen={isMobileOpen}
            onClose={() => setIsMobileOpen(false)}
          />
          <main className="flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)] lg:min-h-screen relative z-10 w-full overflow-x-hidden">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={user?.role === 'collector' ? <Navigate to="/map" /> : <Dashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={!user ? <Auth setAuthToken={setToken} setUser={setUser} /> : <Navigate to="/" />} />

              {/* Protected Routes */}
              <Route path="/report" element={user ? <ReportGarbage token={token} /> : <Navigate to="/login" />} />
              <Route path="/map" element={user?.role === 'collector' ? <CollectorMap token={token} /> : <Navigate to="/" />} />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

