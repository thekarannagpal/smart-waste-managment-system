import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Camera, Trophy, Map as MapIcon, LogOut, LogIn } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ReportGarbage from './pages/ReportGarbage';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import CollectorMap from './pages/CollectorMap';

const Sidebar = ({ user, handleLogout }) => {
  const location = useLocation();
  const [myPoints, setMyPoints] = useState(user?.points || 0);

  useEffect(() => {
    if (!user) return;
    const fetchPoints = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard');
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
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
          <MapIcon size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold font-sans tracking-tight">EcoSmart</h1>
      </div>

      <div className="px-6 py-4 text-sm text-slate-400 border-b border-slate-700">
        {user ? (
          <>
            Welcome, <br /><span className="text-white font-bold text-lg capitalize">{user.username}</span>
            <div className="mt-1 flex text-xs">
              <span className="bg-slate-700 px-2 py-1 rounded-md uppercase tracking-wider">{user.role}</span>
            </div>
          </>
        ) : (
          <>
            Welcome, <br /><span className="text-white font-bold text-lg">Guest</span>
            <div className="mt-1 flex text-xs">
              <span className="bg-slate-700 px-2 py-1 rounded-md text-slate-300">Unregistered</span>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
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
            <span className="font-bold text-lg">{myPoints.toLocaleString()} <span className="text-sm font-normal text-slate-400">pts</span></span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-slate-700">
        {user ? (
          <button onClick={handleLogout} className="flex items-center text-slate-400 hover:text-red-400 transition-colors w-full px-2">
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        ) : (
          <Link to="/login" className="flex items-center text-primary-400 hover:text-primary-300 transition-colors w-full px-2">
            <LogIn size={20} className="mr-3" />
            <span className="font-medium">Login to Report</span>
          </Link>
        )}
      </div>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar user={user} handleLogout={handleLogout} />
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative z-10">
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
    </Router>
  );
}

export default App;
