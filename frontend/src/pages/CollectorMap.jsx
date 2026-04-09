import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Statuses
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const redIcon = createIcon('red'); // Pending
const yellowIcon = createIcon('yellow'); // Assigned
const greenIcon = createIcon('green'); // Completed

export default function CollectorMap({ token }) {
  const [reports, setReports] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`);
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000); // Polling every 10s for real-time feel
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action, reportId) => {
    const isComplete = action === 'complete';
    if (isComplete && !proofImage) return alert('Please upload a proof image first');

    const formData = new FormData();
    if (isComplete) formData.append('image', proofImage);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/${reportId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: isComplete ? formData : undefined
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      
      alert(isComplete ? 'Task Completed!' : 'Task Assigned to you!');
      setSelectedTask(null);
      setProofImage(null);
      fetchReports();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading map...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <h1 className="text-3xl font-bold">Collector Map</h1>
      <div className="bg-white p-4 rounded-xl shadow-md border mb-4">
        <div className="flex gap-4 items-center mb-2">
          <span className="flex items-center"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" className="w-4 mr-2" /> Pending</span>
          <span className="flex items-center"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png" className="w-4 mr-2" /> My Tasks (Assigned)</span>
          <span className="flex items-center"><img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" className="w-4 mr-2" /> Completed</span>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
        <MapContainer center={[28.6139, 77.2090]} zoom={13} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((report) => {
            const icon = report.status === 'completed' ? greenIcon : report.status === 'assigned' ? yellowIcon : redIcon;
            return (
              <Marker
                key={report._id}
                position={[report.location.coordinates[1], report.location.coordinates[0]]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedTask(report);
                    setProofImage(null);
                  },
                }}
              >
                <Popup>
                  <div className="w-48">
                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${report.imageUrl}`} alt="Waste" className="w-full h-32 object-cover rounded-md mb-2" />
                    <h3 className="font-bold text-lg capitalize">{report.wasteType}</h3>
                    <p className="text-sm text-slate-500 mb-2">Status: {report.status}</p>
                    
                    {report.status === 'pending' && (
                      <button onClick={() => handleAction('assign', report._id)} className="w-full bg-primary-600 text-white rounded p-1 text-sm font-bold">Accept Task</button>
                    )}
                    
                    {report.status === 'assigned' && (
                      <div className="space-y-2">
                        <input type="file" accept="image/*" onChange={(e) => setProofImage(e.target.files[0])} className="text-xs" />
                        <button onClick={() => handleAction('complete', report._id)} className="w-full bg-green-600 text-white rounded p-1 text-sm font-bold">Mark Completed</button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
