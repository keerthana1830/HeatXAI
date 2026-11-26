import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Activity,
  Database,
  CloudSun,
  Map as MapIcon,
  BarChart3,
  Building2,
  TrendingUp,
  Sun,
  Moon,
  Search,
  RefreshCw,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { districtService } from '../services/api';

interface ProjectDashboardProps {
  user: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ user, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Data State
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  // Digital Twin State
  const [twinAlbedo, setTwinAlbedo] = useState(0.3);
  const [twinVegetation, setTwinVegetation] = useState(0.2);
  const [twinWater, setTwinWater] = useState(0.1);

  const fetchData = async () => {
    try {
      const distData = await districtService.getDistricts();
      setDistricts(distData);
      if (distData.length > 0 && !selectedDistrict) {
        setSelectedDistrict(distData[0]);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Digital Twin computations
  const twinBaseLST = selectedDistrict ? selectedDistrict.lst : 35;
  const twinSimulatedLST = Math.max(18, twinBaseLST - (twinAlbedo * 8) - (twinVegetation * 12) - (twinWater * 5));
  const twinCoolingEffect = twinBaseLST - twinSimulatedLST;

  // XAI SHAP mock feature contributions
  const shapFeatures = selectedDistrict ? [
    { name: 'Urban Built-up (NDBI)', value: selectedDistrict.ndbi * 15, color: '#ef4444' },
    { name: 'Concrete Surface Ratio', value: (1 - selectedDistrict.ndvi) * 8, color: '#f97316' },
    { name: 'Solar Thermal Load', value: 4.2, color: '#eab308' },
    { name: 'Vegetation Cover (NDVI)', value: -selectedDistrict.ndvi * 10, color: '#22c55e' },
    { name: 'Water Canopy Proximity', value: -2.1, color: '#3b82f6' },
  ] : [];

  const avgLst = districts.length > 0 ? (districts.reduce((s, d) => s + d.lst, 0) / districts.length).toFixed(1) : '--';
  const extremeCount = districts.filter(d => d.risk_level === 'Extreme').length;
  const filteredDistricts = districts.filter(d => {
    return d.name.toLowerCase().includes(searchQuery.toLowerCase()) && (riskFilter === 'All' || d.risk_level === riskFilter);
  });

  const tabs = [
    { id: 'overview', name: 'Project Overview', icon: Activity },
    { id: 'map', name: 'Hotspot Heatmap', icon: MapIcon },
    { id: 'twin', name: 'Digital Twin', icon: Building2 },
    { id: 'xai', name: 'Explainable AI', icon: BarChart3 },
    { id: 'analytics', name: 'Macro Analytics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Top Project Navigation Bar */}
      <header className="h-20 px-8 border-b border-slate-200 dark:border-slate-800 glass-panel flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">Thermacity</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase">Project Platform</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">TAMIL NADU URBAN HEAT INTELLIGENCE SYSTEM</p>
          </div>
        </div>

        {/* Center Tab Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:scale-105 transition-transform">
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
          
          {user && user.role !== 'guest' ? (
            <button
              onClick={() => navigate('/user-dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold text-xs rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <UserCheck size={14} />
              <span>User Workspace</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/login')} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="hidden sm:block px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Banner */}
            <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white shadow-xl">
              <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3.5 py-1 w-fit text-xs font-semibold">
                  <Sparkles size={14} />
                  <span>Public Spatial Intelligence Engine</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">Tamil Nadu Urban Heat Platform</h2>
                <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
                  Thermacity provides satellite-derived Land Surface Temperature (LST) metrics, concrete built-up indices (NDBI), and Explainable AI (XAI) cooling models across Tamil Nadu's 38 municipal districts.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab('map')} className="px-5 py-2.5 bg-white text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2">
                    <span>Explore District Heatmaps</span>
                    <ArrowRight size={14} />
                  </button>
                  <button onClick={() => setActiveTab('twin')} className="px-5 py-2.5 bg-white/20 border border-white/30 text-white font-semibold text-xs rounded-xl hover:bg-white/30 transition-all">
                    Launch Digital Twin Simulator
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Macro Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Districts</p>
                  <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{districts.length}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Satellite coverage active</p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><MapPin size={24} /></div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regional Mean LST</p>
                  <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{avgLst} °C</h4>
                  <p className="text-[10px] text-red-500 font-semibold mt-1">{extremeCount} extreme heat alerts</p>
                </div>
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl"><Activity size={24} /></div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Satellite Telemetry</p>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Sentinel-2 & Landsat 8</h4>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1">Copernicus API Connected</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Database size={24} /></div>
              </div>

              <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weather Model</p>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">ECMWF ERA5</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Reanalysis grid synced</p>
                </div>
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl"><CloudSun size={24} /></div>
              </div>
            </div>

            {/* Quick District Grid Preview */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">District Thermal Vulnerability Summary</h3>
                  <p className="text-xs text-slate-500">Live surface temperatures recorded across regional Tamil Nadu zones</p>
                </div>
                <button onClick={() => setActiveTab('map')} className="text-xs text-orange-500 font-bold hover:underline">View All Hotspots →</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {districts.slice(0, 8).map(d => (
                  <div key={d.id} className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        d.risk_level === 'Extreme' ? 'bg-red-500/10 text-red-500' :
                        d.risk_level === 'High' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>{d.risk_level}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{d.lst}°C</span>
                      <span className="text-[10px] text-slate-400">NDBI: {d.ndbi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Filter district name..." className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white" />
              </div>
              <div className="flex items-center gap-3">
                <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} className="py-2 px-3 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white cursor-pointer">
                  {['All','Low','Moderate','High','Extreme'].map(r=><option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : `${r} Risk`}</option>)}
                </select>
                <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={15} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Regional District Hotspots</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredDistricts.map(d => (
                    <div key={d.id} onClick={()=>setSelectedDistrict(d)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedDistrict?.id===d.id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 dark:text-white">{d.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${d.risk_level==='Extreme'?'bg-red-500/10 text-red-500':d.risk_level==='High'?'bg-orange-500/10 text-orange-500':'bg-emerald-500/10 text-emerald-500'}`}>{d.risk_level}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                        <div><span className="text-slate-400 block">LST</span><span className="font-bold">{d.lst}°C</span></div>
                        <div><span className="text-slate-400 block">NDVI</span><span className="font-bold">{d.ndvi}</span></div>
                        <div><span className="text-slate-400 block">NDBI</span><span className="font-bold">{d.ndbi}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDistrict && (
                <div className="glass-card p-6 rounded-3xl space-y-6 h-fit">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">District Details</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2"><MapPin className="text-orange-500" size={18}/>{selectedDistrict.name}</h4>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-tr from-orange-500/5 to-red-500/5 border border-orange-500/20 text-center">
                    <span className="text-xs text-slate-400 uppercase block">Land Surface Temp</span>
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 block">{selectedDistrict.lst} °C</span>
                    <span className="text-[11px] text-slate-400 block mt-1">Heat Index: {selectedDistrict.heat_index}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DIGITAL TWIN */}
        {activeTab === 'twin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 className="text-orange-500" size={18}/>Digital Twin Thermal Controls</h4>
                <p className="text-xs text-slate-500 mt-1">Simulate real-time cooling parameters for <strong>{selectedDistrict?.name || 'district'}</strong>.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-600 dark:text-slate-300">Cool Roof Albedo</span><span className="font-bold">{(twinAlbedo*100).toFixed(0)}%</span></div>
                  <input type="range" min="0" max="1" step="0.05" value={twinAlbedo} onChange={e=>setTwinAlbedo(parseFloat(e.target.value))} className="w-full accent-orange-500 h-2 rounded-full"/>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-600 dark:text-slate-300">Miyawaki Vegetation</span><span className="font-bold">{(twinVegetation*100).toFixed(0)}%</span></div>
                  <input type="range" min="0" max="1" step="0.05" value={twinVegetation} onChange={e=>setTwinVegetation(parseFloat(e.target.value))} className="w-full accent-emerald-500 h-2 rounded-full"/>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-slate-600 dark:text-slate-300">Water Body Restoration</span><span className="font-bold">{(twinWater*100).toFixed(0)}%</span></div>
                  <input type="range" min="0" max="1" step="0.05" value={twinWater} onChange={e=>setTwinWater(parseFloat(e.target.value))} className="w-full accent-blue-500 h-2 rounded-full"/>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-6">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Simulated Temperature Response</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center"><span className="text-[10px] text-slate-400 block uppercase">Base</span><span className="text-lg font-extrabold text-red-500">{twinBaseLST.toFixed(1)}°C</span></div>
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center"><span className="text-[10px] text-slate-400 block uppercase">Simulated</span><span className="text-lg font-extrabold text-emerald-500">{twinSimulatedLST.toFixed(1)}°C</span></div>
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-center"><span className="text-[10px] text-emerald-500 block uppercase">Cooling</span><span className="text-lg font-extrabold text-emerald-500">-{twinCoolingEffect.toFixed(1)}°C</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPLAINABLE AI */}
        {activeTab === 'xai' && (
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="text-orange-500" size={18}/>SHAP Explainable AI Waterfall</h4>
              <p className="text-xs text-slate-500 mt-1">Feature impact decomposition for <strong>{selectedDistrict?.name || 'district'}</strong> LST forecast.</p>
            </div>
            {selectedDistrict && (
              <div className="space-y-3 pt-2">
                {shapFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs">
                    <span className="w-44 text-right font-semibold text-slate-600 dark:text-slate-300">{feat.name}</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.abs(feat.value) * 5)}%`, backgroundColor: feat.color }} />
                    </div>
                    <span className="w-14 font-mono font-bold" style={{ color: feat.color }}>{feat.value > 0 ? '+' : ''}{feat.value.toFixed(1)}°C</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MACRO ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp className="text-orange-500" size={18}/>Regional Historical Temperature Trend (2018–2026)</h4>
            <div className="w-full h-64 border-b border-l border-slate-200 dark:border-slate-800 relative py-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200">
                <polyline fill="none" stroke="#f97316" strokeWidth="3.5" points="0,170 125,160 250,150 375,142 500,132 625,124 750,110 875,98 1000,85" />
                {[
                  { yr: "2018", t: "33.2°C", x: 0, y: 170 },
                  { yr: "2022", t: "34.8°C", x: 500, y: 132 },
                  { yr: "2026", t: "36.8°C", x: 1000, y: 85 }
                ].map((item, i) => (
                  <g key={i}>
                    <circle cx={item.x} cy={item.y} r="5" className="fill-orange-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                    <text x={item.x} y={item.y - 12} textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">{item.t}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
