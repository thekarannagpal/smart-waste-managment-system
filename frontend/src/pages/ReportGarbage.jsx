import React, { useState } from 'react';
import { UploadCloud, MapPin, CheckCircle, Navigation, Loader2, Trophy } from 'lucide-react';

export default function ReportGarbage({ token }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const getLocation = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLoc(false);
        },
        (error) => {
          alert('Error getting location! Please enable location services.');
          setLoadingLoc(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLoadingLoc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !location) {
      setErrorMsg("Please upload an image and provide location");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setResult({
        wasteType: data.wasteType,
        confidence: Math.round(data.confidence * 100),
        points: data.pointsAwarded
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report Waste</h1>
        <p className="text-slate-500 mt-1">Upload a photo, let AI identify it, and earn reward points!</p>
      </header>

      {!result ? (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-8">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">1. Upload Image</label>
            <div className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl hover:border-primary-400 hover:bg-primary-50 transition-colors duration-300 relative overflow-hidden group">
              <div className="space-y-2 text-center z-10">
                {preview ? (
                  <img src={preview} alt="Preview" className="mx-auto h-48 rounded-lg object-cover shadow-sm" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-primary-500 transition-colors" />
                )}
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                    <span>{preview ? 'Change image' : 'Upload a file'}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                  {!preview && <p className="pl-1">or drag and drop</p>}
                </div>
                {!preview && <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <label className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
               <span>2. Location details</span>
               {location && <span className="text-xs text-primary-600 flex items-center"><CheckCircle size={14} className="mr-1" />Location fixed</span>}
             </label>
             <button
               type="button"
               onClick={getLocation}
               className={`w-full flex items-center justify-center space-x-2 py-4 px-6 border rounded-2xl text-sm font-medium transition-all ${
                 location 
                   ? 'border-primary-200 bg-primary-50 text-primary-700' 
                   : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
               }`}
             >
               {loadingLoc ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} className={location ? "text-primary-500" : "text-slate-400"} />}
               <span>{location ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : 'Fetch GPS Location'}</span>
             </button>
          </div>

          <button
            type="submit"
            disabled={submitting || !image || !location}
            className={`w-full py-4 px-6 border border-transparent rounded-2xl shadow-lg text-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 outline-none transition-all duration-300 ${
              (submitting || !image || !location) ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:shadow-primary-500/30 hover:-translate-y-1'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={24} />
                AI Scanning Image...
              </span>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>
      ) : (
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-10 text-white shadow-xl shadow-green-500/20 text-center animate-in zoom-in-95 duration-500 border border-green-400">
           <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
             <CheckCircle size={48} className="text-white drop-shadow-md" />
           </div>
           <h2 className="text-3xl font-bold mb-2">Report Validated!</h2>
           <p className="text-green-100 text-lg mb-8">YOLOv8 AI successfully analyzed your submission.</p>
           
           <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">Detected Object</p>
                <p className="font-bold text-2xl">{result.wasteType}</p>
              </div>
              <div className="bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">AI Confidence</p>
                <p className="font-bold text-2xl">{result.confidence}%</p>
              </div>
           </div>

           <div className="inline-flex items-center space-x-2 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold shadow-lg">
              <Trophy size={20} />
              <span>+{result.points} Eco Points Earned!</span>
           </div>

           <button 
             onClick={() => setResult(null)}
             className="mt-10 mx-auto block text-sm font-medium text-white/80 hover:text-white hover:underline transition-all"
           >
             Report another area
           </button>
        </div>
      )}
    </div>
  );
}
