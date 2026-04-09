import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Users, CheckCircle, Map as MapIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for leaflet markers in react
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;



function MapBoundsFitter({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (reports && reports.length > 0) {
      const bounds = L.latLngBounds(reports.map(r => [r.location.coordinates[1], r.location.coordinates[0]]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [reports, map]);
  return null;
}

export default function Dashboard() {
  const [reports, setReports] = useState([]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    
    reports.forEach(r => {
      if (r.createdAt) {
         const d = new Date(r.createdAt);
         const dayName = days[d.getDay()];
         counts[dayName] += 1;
      } else {
         // Default to today if mocked data missing createdAt
         counts[days[new Date().getDay()]] += 1;
      }
    });

    return [
      { name: 'Mon', reports: counts['Mon'] },
      { name: 'Tue', reports: counts['Tue'] },
      { name: 'Wed', reports: counts['Wed'] },
      { name: 'Thu', reports: counts['Thu'] },
      { name: 'Fri', reports: counts['Fri'] },
      { name: 'Sat', reports: counts['Sat'] },
      { name: 'Sun', reports: counts['Sun'] },
    ];
  }, [reports]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setReports(data);
      })
      .catch(err => console.error(err));
  }, []);

  const position = [20.5937, 78.9629]; // Default map center (India)
  
  const totalReports = reports.length;
  const cleanedLocs = reports.filter(r => r.status === 'cleaned').length;
  
  const contributors = new Set(reports.map(r => r.userId || r._id)).size; // fallback to report id if anonymous
  const activeHotspots = reports.length > 2 ? Math.floor(reports.length / 2) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-1">Real-time waste monitoring and analytics</p>
        </div>
        <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
          <span>System Live</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Reports', value: totalReports.toString(), desc: 'Live DB count', icon: <AlertTriangle className="text-amber-500" />, bg: "bg-amber-50" },
          { title: 'Cleaned Locations', value: cleanedLocs.toString(), desc: 'Resolved reports', icon: <CheckCircle className="text-primary-500" />, bg: "bg-primary-50" },
          { title: 'Active Hotspots', value: activeHotspots.toString(), desc: 'Requires attention', icon: <TrendingUp className="text-rose-500" />, bg: "bg-rose-50" },
          { title: 'Contributors', value: contributors.toString(), desc: 'Active citizens', icon: <Users className="text-indigo-500" />, bg: "bg-indigo-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${kpi.bg}`}>
              {kpi.icon}
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{kpi.title}</h3>
            <p className="text-3xl font-bold text-slate-800 mt-1">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-2">{kpi.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-[500px] flex flex-col relative overflow-hidden">
          <h2 className="text-xl font-bold mb-4 font-sans flex items-center">
            <MapIcon size={20} className="mr-2 text-primary-500" />
            Live Hotspot Map
          </h2>
          <div className="flex-1 rounded-2xl overflow-hidden relative">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBoundsFitter reports={reports} />
              
              {reports.map((report, idx) => (
                <Marker key={report._id || idx} position={[report.location.coordinates[1], report.location.coordinates[0]]}>
                  <Popup>
                    <strong>{report.wasteType}</strong><br/>
                    Conf: {(report.confidence > 1 ? report.confidence : report.confidence * 100).toFixed(1)}%<br/>
                    Status: {report.status}
                  </Popup>
                </Marker>
              ))}
              
              {reports.length === 0 && (
                <Marker position={position}>
                  <Popup>Waiting for local reports...</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h2 className="text-xl font-bold mb-6 font-sans">Reporting Trends</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="reports" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
