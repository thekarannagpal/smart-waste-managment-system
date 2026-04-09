import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const mockData = [
  { rank: 1, name: 'EcoWarrior99', points: 3450, badges: 12, trend: '+450' },
  { rank: 2, name: 'GreenThumb_Alex', points: 2890, badges: 9, trend: '+210' },
  { rank: 3, name: 'SarahSavesEarth', points: 2750, badges: 8, trend: '+150' },
  { rank: 4, name: 'PlanetProtector', points: 2100, badges: 5, trend: '+90' },
  { rank: 5, name: 'JohnDoe_Eco', points: 1850, badges: 4, trend: '+50' },
];

export default function Leaderboard() {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    fetch('http://localhost:5000/api/leaderboard')
      .then(res => res.json())
      .then(apiUsers => {
        if (Array.isArray(apiUsers)) {
          const formatted = apiUsers.map((u, i) => ({
            rank: i + 1,
            name: u.username || 'Anonymous',
            points: u.points || 0,
            badges: u.badges ? u.badges.length : 0,
            trend: '+10'
          }));
          
          while (formatted.length < 3) {
             formatted.push({ 
               rank: formatted.length + 1, 
               name: 'Waiting for player...', 
               points: 0, 
               badges: 0, 
               trend: '-' 
             });
          }
          setData(formatted);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <Trophy className="text-yellow-500 mr-3" size={32} />
          Eco Champions Leaderboard
        </h1>
        <p className="text-slate-500 mt-1">Top contributors making our city cleaner.</p>
      </header>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end py-12 gap-6 md:gap-10">
         {/* Second Place */}
         <div className="flex flex-col items-center group">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden shadow-lg group-hover:-translate-y-2 transition-transform duration-300">
                <span className="z-10">2</span>
              </div>
              <Medal className="absolute -bottom-3 -right-3 text-slate-400 drop-shadow-md" size={36} />
            </div>
            <p className="font-bold text-slate-800 text-lg">{data[1].name}</p>
            <p className="text-primary-600 font-extrabold">{data[1].points} pts</p>
         </div>

         {/* First Place */}
         <div className="flex flex-col items-center group">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-4xl font-black text-yellow-600 overflow-hidden shadow-2xl shadow-yellow-500/20 group-hover:-translate-y-4 transition-transform duration-500 delay-75">
                <span className="z-10">1</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300 to-yellow-100 opacity-50 mix-blend-overlay"></div>
              </div>
              <Trophy className="absolute -bottom-4 -right-2 text-yellow-500 drop-shadow-xl z-20" size={56} />
            </div>
            <p className="font-extrabold text-slate-900 text-xl">{data[0].name}</p>
            <p className="text-yellow-600 text-xl font-black flex items-center mt-1">
              <TrendingUp className="mr-1" size={16}/> 
              {data[0].points} pts
            </p>
         </div>

         {/* Third Place */}
         <div className="flex flex-col items-center group">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-600 flex items-center justify-center text-2xl font-bold text-amber-700 overflow-hidden shadow-lg group-hover:-translate-y-2 transition-transform duration-300 delay-150">
                <span className="z-10">3</span>
              </div>
              <Award className="absolute -bottom-3 -right-3 text-amber-600 drop-shadow-md" size={36} />
            </div>
            <p className="font-bold text-slate-800 text-lg">{data[2].name}</p>
            <p className="text-primary-600 font-extrabold">{data[2].points} pts</p>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-sm">
              <th className="py-4 px-6 rounded-tl-3xl">Rank</th>
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6 text-right">Badges</th>
              <th className="py-4 px-6 text-right rounded-tr-3xl">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(3).map((user, idx) => (
              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <span className="text-slate-400 font-mono text-lg font-bold">#{user.rank}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-semibold text-slate-800">{user.name}</span>
                </td>
                <td className="py-4 px-6 text-right font-medium text-slate-600">
                  {user.badges}
                </td>
                <td className="py-4 px-6 text-right">
                   <div className="inline-flex items-center justify-end font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full text-sm">
                      {user.points} pts
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
