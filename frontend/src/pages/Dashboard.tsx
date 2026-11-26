import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map as MapIcon, Brain, Shield, LogOut, Sun, Moon,
  Sparkles, Menu, X, TrendingUp, Activity, MapPin, Search, Filter,
  RefreshCw, Terminal, AlertTriangle, UserCircle, Trash2,
  Lock, BarChart3, Building2, TreePine, Droplets, FileSpreadsheet,
  ThumbsUp, MessageSquare, Lightbulb, Target, Clock, DollarSign,
  Thermometer, Eye, Layers, ArrowRight, Send, ChevronRight, Database,
  Plus, CheckCircle, XCircle, SortAsc, Globe, Tag, ChevronDown,
} from 'lucide-react';
import {
  districtService, jobService, predictionService,
  profileService, suggestionService, forecastService,
} from '../services/api';
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Chatbot } from '../components/Chatbot';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardProps {
  user: any;
  isGuest?: boolean;
  setUser: (u: any) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  district: string;
  category: string;
  author_email: string;
  upvotes: number;
  status: string;
  created_at: string;
}

const SUGGESTION_CATEGORIES = [
  'Urban Forestry', 'Cool Roofs', 'Water Bodies',
  'Green Infrastructure', 'Policy', 'Other',
];

// ─── Component ────────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ user, isGuest, setUser, onLogout, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const isAdmin = user.role === 'admin';

  // Core data
  const [districts, setDistricts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  // Hotspot map
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  // ML
  const [selectedModel, setSelectedModel] = useState('Random Forest Regressor');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  // Pipeline
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Profile
  const [profileName, setProfileName] = useState(user.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');



  // Digital Twin
  const [twinAlbedo, setTwinAlbedo] = useState(0.3);
  const [twinVegetation, setTwinVegetation] = useState(0.2);
  const [twinWater, setTwinWater] = useState(0.1);
  const [infraredMode, setInfraredMode] = useState(false);

  // XAI
  const [xaiNdbi, setXaiNdbi] = useState(0.5);
  const [xaiNdvi, setXaiNdvi] = useState(0.2);
  const [xaiSolar, setXaiSolar] = useState(0.6);
  const [xaiWater, setXaiWater] = useState(0.15);

  // Heat Risk Forecasting
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastSummary, setForecastSummary] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string>('');

  // ─── Suggestions State ──────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState('');
  const [sugSuccess, setSugSuccess] = useState('');

  // Form
  const [sugTitle, setSugTitle] = useState('');
  const [sugDesc, setSugDesc] = useState('');
  const [sugDistrict, setSugDistrict] = useState('Chennai');
  const [sugCategory, setSugCategory] = useState('Urban Forestry');
  const [sugSubmitting, setSugSubmitting] = useState(false);
  const [showSugForm, setShowSugForm] = useState(false);

  // Filters
  const [sugSearch, setSugSearch] = useState('');
  const [sugFilterCategory, setSugFilterCategory] = useState('');
  const [sugFilterDistrict, setSugFilterDistrict] = useState('');
  const [sugSort, setSugSort] = useState<'votes' | 'newest' | 'oldest'>('votes');

  // ─── Data Fetching ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoadingDistricts(true);
      const d = await districtService.getDistricts();
      setDistricts(d);
      if (d.length > 0 && !selectedDistrict) setSelectedDistrict(d[0]);
    } catch (e) { console.error(e); }
    finally { setLoadingDistricts(false); }
    try { const j = await jobService.getJobs(); setJobs(j); } catch (e) { console.error(e); }
  };

  const fetchSuggestions = useCallback(async () => {
    setSugLoading(true);
    try {
      const data = await suggestionService.getSuggestions({
        district: sugFilterDistrict || undefined,
        category: sugFilterCategory || undefined,
        search: sugSearch || undefined,
        sort: sugSort,
      });
      setSuggestions(data);
    } catch (e: any) {
      console.error('Failed to load suggestions:', e);
    } finally {
      setSugLoading(false);
    }
  }, [sugFilterDistrict, sugFilterCategory, sugSearch, sugSort]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (selectedDistrict)
      predictionService.getPredictions(selectedDistrict.id, selectedModel).then(setPredictions).catch(console.error);
  }, [selectedDistrict, selectedModel]);
  useEffect(() => {
    if (selectedDistrict) { setXaiNdbi(selectedDistrict.ndbi); setXaiNdvi(selectedDistrict.ndvi); }
  }, [selectedDistrict]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const loadForecast = useCallback(async (districtId?: string, days?: number) => {
    const targetId = districtId || selectedDistrict?.id;
    if (!targetId) return;
    const targetDays = days || forecastDays;
    setForecastLoading(true);
    setForecastError('');
    try {
      const data = await forecastService.getForecast(targetId, targetDays);
      setForecastData(data);
      const summary = await forecastService.getSummary(targetDays);
      setForecastSummary(summary);
    } catch (err: any) {
      console.error('Failed to load forecast:', err);
      setForecastError(err.message || 'Forecasting service unavailable.');
    } finally {
      setForecastLoading(false);
    }
  }, [selectedDistrict?.id, forecastDays]);

  useEffect(() => {
    if (selectedDistrict?.id) {
      loadForecast(selectedDistrict.id, forecastDays);
    }
  }, [selectedDistrict?.id, forecastDays, loadForecast]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleTriggerJob = async (jobType: string) => {
    if (!isAdmin) return;
    setIsSyncing(true);
    setSyncLogs(`[${new Date().toLocaleTimeString()}] Triggering ${jobType}...\n`);
    try {
      const r = await jobService.triggerJob(jobType);
      setSyncLogs(p => p + r.logs);
      const j = await jobService.getJobs(); setJobs(j);
      const d = await districtService.getDistricts(); setDistricts(d);
      if (selectedDistrict) { const u = d.find((x: any) => x.id === selectedDistrict.id); if (u) setSelectedDistrict(u); }
    } catch (e: any) { setSyncLogs(p => p + `[ERROR] ${e.message}\n`); }
    finally { setIsSyncing(false); }
  };

  const handleTrainModel = async () => {
    if (!isAdmin) return;
    setIsTraining(true); setTrainingProgress(10);
    setTrainingLogs([`[${new Date().toLocaleTimeString()}] Starting ${selectedModel}...`]);
    const iv = setInterval(() => { setTrainingProgress(p => { if (p >= 90) { clearInterval(iv); return 90; } return p + 15; }); }, 400);
    try {
      const r = await predictionService.trainModel(selectedModel);
      clearInterval(iv); setTrainingProgress(100); setTrainingLogs(r.logs);
      if (selectedDistrict) { const p = await predictionService.getPredictions(selectedDistrict.id, selectedModel); setPredictions(p); }
      setTimeout(() => { setIsTraining(false); setTrainingProgress(0); }, 1500);
    } catch (e: any) { clearInterval(iv); setIsTraining(false); setTrainingLogs(p => [...p, `[ERROR] ${e.message}`]); }
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!isAdmin || !confirm('Delete this district?')) return;
    try {
      await districtService.deleteDistrict(id);
      const d = await districtService.getDistricts(); setDistricts(d);
      if (selectedDistrict?.id === id) setSelectedDistrict(d[0] || null);
    } catch (e: any) { alert(e.message); }
  };



  const handleProfileSave = async () => {
    setProfileSaving(true); setProfileMsg('');
    try { const u = await profileService.updateProfile(profileName); setUser(u); setProfileMsg('Profile updated.'); }
    catch (e: any) { setProfileMsg(`Error: ${e.message}`); }
    finally { setProfileSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Permanently delete your account?')) return;
    try { await profileService.deleteAccount(); onLogout(); }
    catch (e: any) { alert(e.message); }
  };

  const downloadCSV = () => {
    let c = 'data:text/csv;charset=utf-8,District,LST,NDVI,NDBI,Heat Index,Risk\n';
    districts.forEach(d => { c += `"${d.name}",${d.lst},${d.ndvi},${d.ndbi},${d.heat_index},"${d.risk_level}"\n`; });
    const l = document.createElement('a'); l.setAttribute('href', encodeURI(c)); l.setAttribute('download', `TN_Heat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(l); l.click(); document.body.removeChild(l);
  };

  // ─── Suggestion Handlers ─────────────────────────────────────────────────────
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugDesc.trim()) return;
    setSugSubmitting(true); setSugError(''); setSugSuccess('');
    try {
      await suggestionService.createSuggestion({ title: sugTitle.trim(), description: sugDesc.trim(), district: sugDistrict, category: sugCategory });
      setSugTitle(''); setSugDesc(''); setSugSuccess('Your suggestion was submitted!');
      setShowSugForm(false);
      await fetchSuggestions();
      setTimeout(() => setSugSuccess(''), 4000);
    } catch (e: any) {
      setSugError(e.message || 'Submission failed. Please try again.');
    } finally {
      setSugSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (isGuest) return;
    try {
      await suggestionService.upvoteSuggestion(id);
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s));
    } catch (e: any) { console.error(e); }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm('Delete this suggestion?')) return;
    try {
      await suggestionService.deleteSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  // ─── Computed ────────────────────────────────────────────────────────────────
  const xaiBase = 28.0;
  const xaiNdbiContrib = xaiNdbi * 18;
  const xaiConcreteContrib = (1 - xaiNdvi) * 6;
  const xaiSolarContrib = xaiSolar * 7;
  const xaiNdviContrib = -(xaiNdvi * 12);
  const xaiWaterContrib = -(xaiWater * 8);
  const xaiPredicted = xaiBase + xaiNdbiContrib + xaiConcreteContrib + xaiSolarContrib + xaiNdviContrib + xaiWaterContrib;

  const twinBase = selectedDistrict ? selectedDistrict.lst : 35;
  const twinSim = Math.max(18, twinBase - (twinAlbedo * 8) - (twinVegetation * 12) - (twinWater * 5));
  const twinCool = twinBase - twinSim;
  const twinEnergySavings = Math.round(twinCool * 1200);
  const twinAqiImprovement = Math.round(twinVegetation * 35);

  const recommendations = selectedDistrict ? [
    { priority: selectedDistrict.ndbi > 0.5 ? 'Critical' : 'High', title: 'Cool Roof Albedo Painting', desc: `Apply high-reflectivity white coating to ${Math.round(selectedDistrict.ndbi * 80)}% of rooftops in ${selectedDistrict.name}.`, roi: `${(selectedDistrict.ndbi * 120).toFixed(0)}% energy savings`, timeline: '3-6 months', budget: `₹${(selectedDistrict.ndbi * 45).toFixed(0)}L`, cooling: `-${(selectedDistrict.ndbi * 5).toFixed(1)}°C`, icon: Building2, color: 'orange' },
    { priority: selectedDistrict.ndvi < 0.25 ? 'Critical' : 'Medium', title: 'Miyawaki Microforest Plantation', desc: `Plant dense Miyawaki forests across ${Math.round((1 - selectedDistrict.ndvi) * 50)} hectares of vacant land.`, roi: '180% carbon offset in 3yr', timeline: '12-18 months', budget: `₹${((1 - selectedDistrict.ndvi) * 30).toFixed(0)}L`, cooling: `-${((1 - selectedDistrict.ndvi) * 4).toFixed(1)}°C`, icon: TreePine, color: 'emerald' },
    { priority: 'High', title: 'Urban Water Body Restoration', desc: `Restore ${Math.round(selectedDistrict.heat_index / 10)} temple tanks and create rainwater harvesting channels.`, roi: '60% flood risk reduction', timeline: '6-12 months', budget: `₹${(selectedDistrict.heat_index * 0.8).toFixed(0)}L`, cooling: `-${(selectedDistrict.heat_index * 0.05).toFixed(1)}°C`, icon: Droplets, color: 'blue' },
    { priority: selectedDistrict.lst > 36 ? 'Critical' : 'Medium', title: 'Permeable Pavement Conversion', desc: `Replace ${Math.round(selectedDistrict.ndbi * 40)}km of asphalt roads with permeable cool pavements.`, roi: '45% surface runoff reduction', timeline: '12-24 months', budget: `₹${(selectedDistrict.ndbi * 60).toFixed(0)}L`, cooling: `-${(selectedDistrict.ndbi * 2.5).toFixed(1)}°C`, icon: Layers, color: 'purple' },
  ] : [];

  const filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) && (riskFilter === 'All' || d.risk_level === riskFilter));
  const avgLst = districts.length > 0 ? (districts.reduce((s, d) => s + d.lst, 0) / districts.length).toFixed(1) : '--';
  const extremeCount = districts.filter(d => d.risk_level === 'Extreme').length;

  // Suggestion stats
  const topCategory = suggestions.length > 0
    ? Object.entries(suggestions.reduce((acc: any, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {}))
        .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—'
    : '—';
  const topDistrict = suggestions.length > 0
    ? Object.entries(suggestions.reduce((acc: any, s) => { acc[s.district] = (acc[s.district] || 0) + 1; return acc; }, {}))
        .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—'
    : '—';

  // Forecast chart data
  const chartTimelineData = forecastData ? [
    ...(forecastData.historical_series || []).map((h: any) => ({
      date: h.date.slice(5),
      fullDate: h.date,
      observed_lst: h.observed_lst,
      air_temp_max: h.air_temp_max,
      humidity: h.humidity,
      solar_radiation: h.solar_radiation,
      risk_level: h.risk_level,
      isForecast: false,
    })),
    ...(forecastData.historical_series?.length > 0 && forecastData.forecast_series?.length > 0 ? [{
      date: forecastData.historical_series[forecastData.historical_series.length - 1].date.slice(5),
      fullDate: forecastData.historical_series[forecastData.historical_series.length - 1].date,
      observed_lst: forecastData.historical_series[forecastData.historical_series.length - 1].observed_lst,
      predicted_lst: forecastData.historical_series[forecastData.historical_series.length - 1].observed_lst,
      lst_lower: forecastData.historical_series[forecastData.historical_series.length - 1].observed_lst,
      lst_upper: forecastData.historical_series[forecastData.historical_series.length - 1].observed_lst,
      air_temp_max: forecastData.historical_series[forecastData.historical_series.length - 1].air_temp_max,
      humidity: forecastData.historical_series[forecastData.historical_series.length - 1].humidity,
      solar_radiation: forecastData.historical_series[forecastData.historical_series.length - 1].solar_radiation,
      isForecast: false,
    }] : []),
    ...(forecastData.forecast_series || []).map((f: any) => ({
      date: f.date.slice(5),
      fullDate: f.date,
      predicted_lst: f.predicted_lst,
      lst_lower: f.lst_lower,
      lst_upper: f.lst_upper,
      air_temp_max: f.air_temp_max,
      humidity: f.humidity,
      solar_radiation: f.solar_radiation,
      risk_level: f.risk_level,
      isForecast: true,
    }))
  ] : [];

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'Extreme': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      case 'Low': default: return '#22c55e';
    }
  };

  const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    isAdmin ? <>{children}</> :
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-[11px] text-slate-400 font-semibold"><Lock size={12} /> Admin required</div>;

  const navItems = [
    { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
    { id: 'forecast', name: 'Heat Forecasting', icon: TrendingUp },
    { id: 'map', name: 'Hotspot Heatmap', icon: MapIcon },
    { id: 'folium', name: 'Folium Map', icon: MapPin },

    { id: 'xai', name: 'Explainable AI', icon: BarChart3 },
    { id: 'twin', name: 'Digital Twin', icon: Building2 },
    { id: 'recommendations', name: 'Recommendations', icon: Target },
    { id: 'suggestions', name: 'Community Ideas', icon: Lightbulb },
    { id: 'profile', name: 'Profile', icon: UserCircle },
  ];

  const categoryColor: Record<string, string> = {
    'Urban Forestry': 'emerald', 'Cool Roofs': 'orange', 'Water Bodies': 'blue',
    'Green Infrastructure': 'teal', 'Policy': 'purple', 'Other': 'slate', 'General': 'slate',
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 text-slate-800 dark:text-slate-200">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 glass-panel border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl shadow-lg"><Sparkles className="w-4 h-4 text-white" /></div>
              <div><h1 className="font-bold text-base text-slate-900 dark:text-white">Thermacity</h1><p className="text-[9px] text-slate-500 font-medium">SaaS Platform</p></div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
          </div>
          <nav className="p-3 space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon; const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${active ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-500 border border-orange-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'}`}>
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-500' : 'text-slate-400'}`} /><span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-bold text-xs">{(user.full_name || user.email).charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.full_name || 'Analyst'}</p><p className="text-[9px] text-slate-400 uppercase">{user.role}</p></div>
          </div>
          {isGuest
            ? <button onClick={() => navigate('/login')} className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl text-xs font-bold">Sign In</button>
            : <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-red-500 hover:bg-red-500/5"><LogOut size={14} />Sign Out</button>}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 glass-panel flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={18} /></button>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">{navItems.find(i => i.id === activeTab)?.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-semibold text-emerald-500 uppercase">Live</span></div>
            {isAdmin && <span className="hidden sm:flex px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-bold uppercase">Admin</span>}
            <button onClick={toggleTheme} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform">{theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}</button>
          </div>
        </header>

        {isGuest && (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2 text-white flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2"><Sparkles size={13} /><span>Guest Preview — Sign in for full access</span></div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/login')} className="px-3 py-1 bg-white text-slate-950 rounded-lg font-bold text-[11px]">Sign In</button>
              <button onClick={() => navigate('/signup')} className="px-3 py-1 bg-white/20 text-white rounded-lg text-[11px]">Register</button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ═══════════════════════════════════════════════════════ OVERVIEW */}
          {activeTab === 'dashboard' && (<>
            <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-3 bg-white/10 border border-white/20 rounded-full px-3 py-1 w-fit text-xs font-semibold"><Sparkles className="w-3.5 h-3.5" /><span>SaaS Console</span></div>
                <h3 className="text-2xl font-bold mb-2">Welcome, {user.full_name || 'Analyst'}</h3>
                <p className="text-white/80 text-sm leading-relaxed">Explore Folium heatmaps, Explainable AI SHAP analysis, Digital Twin simulations, and intelligent cooling recommendations.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[{ l: 'Districts', v: districts.length, i: MapPin, c: 'blue' }, { l: 'Avg LST', v: `${avgLst}°C`, i: Thermometer, c: 'orange', s: `${extremeCount} extreme` }, { l: 'Pipeline', v: jobs.length > 0 ? jobs[0].status : 'Idle', i: Database, c: 'emerald' }, { l: 'Suggestions', v: suggestions.length, i: Lightbulb, c: 'purple' }].map((m, i) =>
                <div key={i} className="glass-card p-5 rounded-2xl flex items-center justify-between">
                  <div><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{m.l}</p><h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{m.v}</h4>{(m as any).s && <p className="text-[10px] text-red-500 mt-0.5">{(m as any).s}</p>}</div>
                  <div className={`p-3 bg-${m.c}-500/10 text-${m.c}-500 rounded-xl`}><m.i size={20} /></div>
                </div>
              )}
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-4">Quick Access Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[{ n: 'Heat Forecast', t: 'forecast', i: TrendingUp, c: 'red' }, { n: 'Folium Map', t: 'folium', i: MapPin, c: 'orange' }, { n: 'XAI SHAP', t: 'xai', i: BarChart3, c: 'purple' }, { n: 'Digital Twin', t: 'twin', i: Building2, c: 'blue' }, { n: 'Recommendations', t: 'recommendations', i: Target, c: 'emerald' }, { n: 'Community', t: 'suggestions', i: Lightbulb, c: 'pink' }].map((f, i) =>
                  <button key={i} onClick={() => setActiveTab(f.t)} className={`p-4 rounded-2xl bg-${f.c}-500/5 border border-${f.c}-500/10 hover:bg-${f.c}-500/10 transition-all text-center space-y-2`}>
                    <f.i className={`mx-auto text-${f.c}-500`} size={22} />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">{f.n}</span>
                  </button>
                )}
              </div>
            </div>
          </>)}

          {/* ═══════════════════════════════════════════════════════ HEAT FORECASTING */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Header and Controls */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="text-orange-500" size={22} />
                      Heat Risk Forecasting
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Multi-variable predictive modeling of Land Surface Temperature (LST) and heat risk trajectories across Tamil Nadu.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* District Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">District:</span>
                      <select
                        value={selectedDistrict?.id || ''}
                        onChange={(e) => {
                          const d = districts.find(x => x.id === e.target.value);
                          if (d) {
                            setSelectedDistrict(d);
                            loadForecast(d.id, forecastDays);
                          }
                        }}
                        className="py-2 px-3 text-xs rounded-xl glass-input bg-white/80 dark:bg-slate-900/80 font-bold text-slate-900 dark:text-white cursor-pointer"
                      >
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.lst}°C)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Horizon Selector */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {[3, 7, 14].map(days => (
                        <button
                          key={days}
                          onClick={() => {
                            setForecastDays(days);
                            if (selectedDistrict) loadForecast(selectedDistrict.id, days);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            forecastDays === days
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => selectedDistrict && loadForecast(selectedDistrict.id, forecastDays)}
                      disabled={forecastLoading}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                      title="Recalculate forecast"
                    >
                      <RefreshCw size={16} className={forecastLoading ? 'animate-spin text-orange-500' : 'text-slate-400'} />
                    </button>
                  </div>
                </div>

                {/* Error Banner if any */}
                {forecastError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
                    <AlertTriangle size={15} />
                    <span>{forecastError}</span>
                  </div>
                )}
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Observed LST */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Observed</p>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {forecastData?.current_observed_lst ?? selectedDistrict?.lst ?? '--'}°C
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        (forecastData?.current_risk_level || selectedDistrict?.risk_level) === 'Extreme'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {forecastData?.current_risk_level ?? selectedDistrict?.risk_level ?? 'Baseline'}
                      </span>
                      <span className="text-[10px] text-slate-400">Satellite baseline</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Thermometer size={24} />
                  </div>
                </div>

                {/* 2. Forecast Peak LST */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-orange-500">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{forecastDays}-Day Predicted Peak</p>
                    <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {forecastData?.peak_forecast_lst ?? '--'}°C
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold ${
                        (forecastData?.temp_delta ?? 0) >= 0 ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {(forecastData?.temp_delta ?? 0) >= 0 ? '+' : ''}{forecastData?.temp_delta ?? 0}°C shift
                      </span>
                      <span className="text-[10px] text-slate-400">vs baseline</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                </div>

                {/* 3. Heat Risk Classification */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-red-500">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projected Risk Level</p>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {forecastData?.forecast_risk_level ?? 'Calculating...'}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Threshold: Low (&lt;32°C), Mod (32-35°C), High (35-38°C), Extreme (&ge;38°C)
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                </div>

                {/* 4. Model & Confidence */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Confidence & Validation</p>
                    <h4 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                      {forecastData?.confidence_score ?? '--'}%
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[160px]">
                      {forecastData?.model_used || 'ML Model'} · MAE: {forecastData?.evaluation_metrics?.mae ?? '--'}°C
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                    <Brain size={24} />
                  </div>
                </div>
              </div>

              {/* Scientific Methodology Disclaimer */}
              <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <Shield className="text-blue-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                    Scientific Methodology & Climatological Distinction
                  </span>
                  <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                    Ambient air temperature (2m) and ground Land Surface Temperature (LST) are distinct physical phenomena. Ground surfaces heat significantly more due to solar radiation absorptance, impervious building density (NDBI), and low vegetation evapotranspiration (NDVI). Future values shown here are scientifically grounded, model-derived estimates synthesized from Open-Meteo meteorological vectors and trained regression equations.
                  </p>
                </div>
              </div>

              {/* Interactive Trend Chart */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="text-orange-500" size={18} />
                      Temperature Trajectory & Uncertainty Interval: {forecastData?.district_name || selectedDistrict?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Historical observed satellite LST vs. {forecastDays}-day forward forecast with 95% confidence bounds.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Observed LST</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Predicted LST</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500/20 border border-orange-500/40 rounded" />95% Uncertainty</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t-2 border-dashed border-cyan-400" />Air Temp (2m)</span>
                  </div>
                </div>

                {forecastLoading ? (
                  <div className="h-[360px] flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-400">Running ML inference & weather synthesis...</span>
                  </div>
                ) : chartTimelineData.length > 0 ? (
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartTimelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" unit="°C" />
                        <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Extreme (38°C)', fill: '#ef4444', fontSize: 9, position: 'right' }} />
                        <ReferenceLine y={35} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'High (35°C)', fill: '#f97316', fontSize: 9, position: 'right' }} />
                        <RechartsTooltip content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[210px] text-white">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                                  <span className="font-bold">{d.fullDate || label}</span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                    d.isForecast ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  }`}>
                                    {d.isForecast ? 'ML Forecast' : 'Observed'}
                                  </span>
                                </div>
                                {d.observed_lst !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Observed LST:</span>
                                    <span className="font-bold text-blue-400">{d.observed_lst}°C</span>
                                  </div>
                                )}
                                {d.predicted_lst !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Predicted LST:</span>
                                    <span className="font-bold text-orange-400">{d.predicted_lst}°C</span>
                                  </div>
                                )}
                                {d.lst_lower !== undefined && d.lst_upper !== undefined && d.isForecast && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">95% Range:</span>
                                    <span className="font-mono text-slate-300">[{d.lst_lower}°C – {d.lst_upper}°C]</span>
                                  </div>
                                )}
                                {d.air_temp_max !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Air Temp (2m):</span>
                                    <span className="font-semibold text-cyan-400">{d.air_temp_max}°C</span>
                                  </div>
                                )}
                                {d.humidity !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Relative Humidity:</span>
                                    <span className="font-semibold text-slate-300">{d.humidity}%</span>
                                  </div>
                                )}
                                {d.risk_level && (
                                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                                    <span className="text-slate-400">Heat Risk:</span>
                                    <span className={`font-bold ${
                                      d.risk_level === 'Extreme' ? 'text-red-400' :
                                      d.risk_level === 'High' ? 'text-orange-400' :
                                      d.risk_level === 'Moderate' ? 'text-yellow-400' : 'text-emerald-400'
                                    }`}>
                                      {d.risk_level}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }} />
                        {/* 95% Confidence Band */}
                        <Area type="monotone" dataKey="lst_upper" stroke="none" fill="#f97316" fillOpacity={0.12} />
                        <Area type="monotone" dataKey="lst_lower" stroke="none" fill="#f97316" fillOpacity={0.12} />
                        {/* Observed line */}
                        <Line type="monotone" dataKey="observed_lst" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                        {/* Forecast line */}
                        <Line type="monotone" dataKey="predicted_lst" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                        {/* Air Temp reference */}
                        <Line type="monotone" dataKey="air_temp_max" stroke="#06b6d4" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No forecast data available for {selectedDistrict?.name || 'this district'}.
                  </div>
                )}
              </div>

              {/* Daily Forecast Breakdown Cards */}
              {forecastData?.forecast_series && (
                <div className="glass-card p-6 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    {forecastDays}-Day Chronological Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {forecastData.forecast_series.map((f: any, idx: number) => {
                      const color = getRiskColor(f.risk_level);
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 space-y-2 text-center"
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase">
                            Day +{idx + 1}
                          </div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {f.date.slice(5)}
                          </div>
                          <div className="text-lg font-black text-slate-900 dark:text-white">
                            {f.predicted_lst}°C
                          </div>
                          <div className="text-[9px] font-mono text-slate-400">
                            [{f.lst_lower}° – {f.lst_upper}°]
                          </div>
                          <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center">
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${color}18`, color: color }}
                            >
                              {f.risk_level}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 space-y-0.5 pt-1">
                            <div>Air: {f.air_temp_max}°C</div>
                            <div>Humidity: {f.humidity}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* District Risk Rankings & Integrated Folium Map */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking Table */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        District Heat Risk Rankings
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {forecastSummary?.districts?.length || districts.length} districts ordered by predicted peak
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {(forecastSummary?.districts || districts).map((d: any, idx: number) => {
                      const isSelected = selectedDistrict?.id === d.id;
                      const peakTemp = d.forecast_peak_lst ?? d.lst;
                      const risk = d.forecast_risk ?? d.risk_level;
                      const color = getRiskColor(risk);

                      return (
                        <div
                          key={d.id || idx}
                          onClick={() => {
                            const found = districts.find(x => x.id === d.id);
                            if (found) {
                              setSelectedDistrict(found);
                              loadForecast(found.id, forecastDays);
                            }
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-orange-500/10 border-orange-500/50 shadow-sm'
                              : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}</span>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">{d.name}</span>
                              <span className="text-[10px] text-slate-400">Baseline: {d.current_lst ?? d.lst}°C</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold text-xs text-slate-900 dark:text-white">{peakTemp}°C</div>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block"
                              style={{ backgroundColor: `${color}18`, color: color }}
                            >
                              {risk}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Integrated Folium Map */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Spatial Thermal Projections Map
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Interactive GIS heat layers with mode switching (Current vs. 7-Day Forecast).
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[460px]">
                    <iframe
                      src="http://localhost:8000/api/v1/districts/map/folium?mode=forecast"
                      className="w-full h-full border-0"
                      title="Folium Thermal Forecast Map"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ FOLIUM */}
          {activeTab === 'folium' && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-2xl flex justify-between items-center">
                <div><h4 className="font-bold text-base text-slate-900 dark:text-white">Interactive Folium Thermal Map</h4><p className="text-xs text-slate-500">Live Leaflet.js heatmap with Tamil Nadu district thermal markers from Sentinel-2 satellite data.</p></div>
                <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={15} /></button>
              </div>
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800" style={{ height: '70vh' }}>
                <iframe src="http://localhost:8000/api/v1/districts/map/folium" className="w-full h-full border-0" title="Folium Heatmap" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ MAP */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-72"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search district..." className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white" /></div>
                <div className="flex items-center gap-3">
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="py-2 px-3 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 cursor-pointer">{['All', 'Low', 'Moderate', 'High', 'Extreme'].map(r => <option key={r} value={r}>{r === 'All' ? 'All Risks' : r}</option>)}</select>
                  <button onClick={fetchData} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={15} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Hotspots ({filteredDistricts.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredDistricts.map(d => (
                      <div key={d.id} onClick={() => setSelectedDistrict(d)} className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${selectedDistrict?.id === d.id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                        {isAdmin && <button onClick={e => { e.stopPropagation(); handleDeleteDistrict(d.id); }} className="absolute top-2 right-2 p-1 rounded-lg text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                        <div className="flex justify-between items-start"><span className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${d.risk_level === 'Extreme' ? 'bg-red-500/10 text-red-500' : d.risk_level === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{d.risk_level}</span></div>
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
                  <div className="glass-card p-6 rounded-2xl space-y-5 h-fit">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Selected</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><MapPin className="text-orange-500" size={18} />{selectedDistrict.name}</h4>
                    <div className="p-5 rounded-2xl bg-gradient-to-tr from-orange-500/5 to-red-500/5 border border-orange-500/20 text-center">
                      <span className="text-xs text-slate-400 uppercase block">LST</span>
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 block">{selectedDistrict.lst}°C</span>
                      <span className="text-[11px] text-slate-400 block mt-1">Heat Index: {selectedDistrict.heat_index}</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs ${selectedDistrict.risk_level === 'Extreme' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-blue-500/5 border-blue-500/20 text-blue-500'}`}><AlertTriangle size={14} className="inline mr-1" />{selectedDistrict.risk_level} Heat Alert</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ XAI */}
          {activeTab === 'xai' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl space-y-5">
                <div><h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="text-orange-500" size={18} />SHAP Explainable AI Engine</h4><p className="text-xs text-slate-500 mt-1">Adjust input parameters to see how each feature impacts the predicted Land Surface Temperature.</p></div>
                <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl font-mono text-sm text-center space-y-1 border border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">SHAP Additive Model</p>
                  <p className="text-slate-900 dark:text-white font-bold">LST = Base({xaiBase}°C) + Σφᵢ(xᵢ)</p>
                  <p className="text-orange-500 font-extrabold text-xl">{xaiPredicted.toFixed(1)}°C</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ l: 'NDBI (Built-up)', v: xaiNdbi, s: setXaiNdbi, c: '#ef4444', contrib: xaiNdbiContrib }, { l: 'NDVI (Vegetation)', v: xaiNdvi, s: setXaiNdvi, c: '#22c55e', contrib: xaiNdviContrib }, { l: 'Solar Thermal Load', v: xaiSolar, s: setXaiSolar, c: '#eab308', contrib: xaiSolarContrib }, { l: 'Water Proximity', v: xaiWater, s: setXaiWater, c: '#3b82f6', contrib: xaiWaterContrib }].map((f, i) => (
                    <div key={i} className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                      <div className="flex justify-between text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300">{f.l}</span><span className="font-bold" style={{ color: f.c }}>{f.contrib > 0 ? '+' : ''}{f.contrib.toFixed(1)}°C</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={f.v} onChange={e => f.s(parseFloat(e.target.value))} className="w-full h-2 rounded-full" style={{ accentColor: f.c }} />
                      <div className="flex justify-between text-[10px] text-slate-400"><span>0.00</span><span className="font-bold">{f.v.toFixed(2)}</span><span>1.00</span></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">SHAP Waterfall</h5>
                  {[{ n: 'Urban Built-up (NDBI)', v: xaiNdbiContrib, c: '#ef4444' }, { n: 'Concrete Surface', v: xaiConcreteContrib, c: '#f97316' }, { n: 'Solar Load', v: xaiSolarContrib, c: '#eab308' }, { n: 'Vegetation (NDVI)', v: xaiNdviContrib, c: '#22c55e' }, { n: 'Water Proximity', v: xaiWaterContrib, c: '#3b82f6' }].sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).map((f, i) => {
                    const mx = Math.max(...[xaiNdbiContrib, xaiConcreteContrib, xaiSolarContrib, Math.abs(xaiNdviContrib), Math.abs(xaiWaterContrib)]);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 w-40 text-right shrink-0">{f.n}</span>
                        <div className="flex-1 h-5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(Math.abs(f.v) / mx) * 100}%`, backgroundColor: f.c, opacity: 0.75 }} /></div>
                        <span className="text-[11px] font-mono font-bold w-14 text-right" style={{ color: f.c }}>{f.v > 0 ? '+' : ''}{f.v.toFixed(1)}°C</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ DIGITAL TWIN */}
          {activeTab === 'twin' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl space-y-5">
                  <div className="flex justify-between items-start">
                    <div><h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><Building2 className="text-orange-500" size={18} />SaaS Digital Twin Console</h4><p className="text-xs text-slate-500 mt-1">{selectedDistrict?.name || 'District'} thermal simulation</p></div>
                    <button onClick={() => setInfraredMode(!infraredMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${infraredMode ? 'bg-red-500 text-white' : 'border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Eye size={13} />{infraredMode ? 'IR Mode ON' : 'IR Mode'}</button>
                  </div>
                  {[{ l: 'Cool Roof Albedo', v: twinAlbedo, s: setTwinAlbedo, c: 'orange', i: Sun, d: 'Reflective coating on rooftops' }, { l: 'Miyawaki Vegetation', v: twinVegetation, s: setTwinVegetation, c: 'emerald', i: TreePine, d: 'Dense microforest canopy' }, { l: 'Water Restoration', v: twinWater, s: setTwinWater, c: 'blue', i: Droplets, d: 'Temple tanks & marshlands' }].map((ctrl, i) =>
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><ctrl.i size={13} className={`text-${ctrl.c}-500`} />{ctrl.l}</span><span className="font-bold">{(ctrl.v * 100).toFixed(0)}%</span></div>
                      <input type="range" min="0" max="1" step="0.05" value={ctrl.v} onChange={e => ctrl.s(parseFloat(e.target.value))} className={`w-full accent-${ctrl.c}-500 h-2 rounded-full`} />
                      <p className="text-[10px] text-slate-400 mt-0.5">{ctrl.d}</p>
                    </div>
                  )}
                </div>
                <div className="glass-card p-6 rounded-2xl space-y-5">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">Side-by-Side Comparison</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative" style={{ height: 200 }}>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded-lg z-10">BASELINE</div>
                      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ background: infraredMode ? 'linear-gradient(135deg,#1a0a2e,#3d0a5c)' : 'linear-gradient(to bottom,#e0f2fe,#f1f5f9)' }}>
                        {[{ x: 15, w: 35, h: 80 }, { x: 60, w: 25, h: 110 }, { x: 95, w: 40, h: 70 }, { x: 145, w: 30, h: 95 }].map((b, i) => <g key={i}><rect x={b.x} y={180 - b.h} width={b.w} height={b.h} fill={infraredMode ? `hsl(${Math.max(0, 40 - twinBase * 0.8)},100%,50%)` : '#ef4444'} opacity={infraredMode ? 0.9 : 0.5} rx="2" /><rect x={b.x} y={180 - b.h} width={b.w} height={6} fill={infraredMode ? '#ff0040' : '#dc2626'} rx="1" /></g>)}
                        <rect x="0" y="180" width="200" height="20" fill={infraredMode ? '#1e0538' : '#e2e8f0'} opacity="0.4" />
                      </svg>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-emerald-500/30 relative" style={{ height: 200 }}>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/80 text-white text-[9px] font-bold rounded-lg z-10">SIMULATED</div>
                      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ background: infraredMode ? 'linear-gradient(135deg,#0a1e2e,#0a2e5c)' : 'linear-gradient(to bottom,#dcfce7,#f0fdf4)' }}>
                        {[{ x: 15, w: 35, h: 80 }, { x: 60, w: 25, h: 110 }, { x: 95, w: 40, h: 70 }, { x: 145, w: 30, h: 95 }].map((b, i) => { const heatColor = infraredMode ? `hsl(${Math.max(0, 200 - twinSim * 3)},80%,50%)` : (twinSim > 30 ? '#f97316' : '#22c55e'); return (<g key={i}><rect x={b.x} y={180 - b.h} width={b.w} height={b.h} fill={heatColor} opacity={infraredMode ? 0.8 : 0.4} rx="2" /><rect x={b.x} y={180 - b.h} width={b.w} height={6} fill={twinAlbedo > 0.4 ? '#f1f5f9' : heatColor} rx="1" /></g>); })}
                        {twinVegetation > 0.1 && [30, 90, 155].map((tx, i) => <g key={i} opacity={Math.min(1, twinVegetation * 3)}><rect x={tx - 2} y={158} width={4} height={22} fill="#92400e" /><circle cx={tx} cy={152} r={12} fill="#22c55e" opacity="0.7" /></g>)}
                        {twinWater > 0.1 && <ellipse cx="100" cy="192" rx={50 * twinWater + 15} ry={8} fill="#60a5fa" opacity={0.4 + twinWater * 0.4} />}
                        <rect x="0" y="180" width="200" height="20" fill={twinVegetation > 0.4 ? '#86efac' : '#bbf7d0'} opacity="0.3" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">{[{ l: 'Base LST', v: `${twinBase.toFixed(1)}°C`, c: 'text-red-500' }, { l: 'Simulated', v: `${twinSim.toFixed(1)}°C`, c: 'text-emerald-500' }, { l: 'Energy Savings', v: `₹${twinEnergySavings}/yr`, c: 'text-blue-500' }, { l: 'AQI Gain', v: `+${twinAqiImprovement}`, c: 'text-purple-500' }].map((m, i) => <div key={i} className="p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl text-center"><span className="text-[9px] text-slate-400 uppercase block">{m.l}</span><span className={`text-sm font-extrabold ${m.c}`}>{m.v}</span></div>)}</div>
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"><ChevronRight size={14} className="shrink-0 mt-0.5" /><span>Net cooling of <strong>-{twinCool.toFixed(1)}°C</strong> for {selectedDistrict?.name || 'district'} with projected annual energy savings of <strong>₹{twinEnergySavings}</strong>.</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl"><h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><Target className="text-orange-500" size={18} />Intelligent Cooling Recommendations: {selectedDistrict?.name || 'Select District'}</h4><p className="text-xs text-slate-500 mt-1">AI-generated priority-scored interventions with ROI projections and implementation timelines.</p></div>
              {selectedDistrict
                ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{recommendations.map((r, i) => { const Icon = r.icon; return (<div key={i} className="glass-card p-5 rounded-2xl space-y-3 border-l-4" style={{ borderLeftColor: r.priority === 'Critical' ? '#ef4444' : r.priority === 'High' ? '#f97316' : '#eab308' }}><div className="flex justify-between items-start"><div className="flex items-center gap-2"><div className={`p-2 bg-${r.color}-500/10 rounded-xl`}><Icon size={18} className={`text-${r.color}-500`} /></div><div><h5 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h5><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.priority === 'Critical' ? 'bg-red-500/10 text-red-500' : r.priority === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{r.priority} Priority</span></div></div></div><p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p><div className="grid grid-cols-2 gap-2 text-[11px]">{[{ l: 'Cooling', v: r.cooling, i: Thermometer }, { l: 'ROI', v: r.roi, i: DollarSign }, { l: 'Timeline', v: r.timeline, i: Clock }, { l: 'Budget', v: r.budget, i: Target }].map((m, j) => <div key={j} className="flex items-center gap-1.5 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-lg"><m.i size={12} className="text-slate-400 shrink-0" /><div><span className="text-slate-400 block text-[9px]">{m.l}</span><span className="font-bold text-slate-900 dark:text-white">{m.v}</span></div></div>)}</div></div>); })}</div>
                : <div className="text-center text-slate-400 py-10">Select a district from the Heatmap tab.</div>}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ COMMUNITY IDEAS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-5">

              {/* Header + Stats */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="text-orange-500" size={20} />Community Cooling Suggestions
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Share and vote on urban heat mitigation ideas for Tamil Nadu districts.</p>
                  </div>
                  {!isGuest && (
                    <button
                      onClick={() => setShowSugForm(f => !f)}
                      id="new-suggestion-btn"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] shrink-0"
                    >
                      {showSugForm ? <><X size={14} />Cancel</> : <><Plus size={14} />New Suggestion</>}
                    </button>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: 'Total Ideas', value: suggestions.length, icon: Lightbulb, color: 'orange' },
                    { label: 'Top Category', value: topCategory, icon: Tag, color: 'purple' },
                    { label: 'Most Active', value: topDistrict, icon: Globe, color: 'blue' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl">
                      <div className={`p-2 bg-${stat.color}-500/10 rounded-lg`}>
                        <stat.icon size={14} className={`text-${stat.color}-500`} />
                      </div>
                      <div><p className="text-[9px] text-slate-400 uppercase font-semibold">{stat.label}</p><p className="text-sm font-bold text-slate-900 dark:text-white truncate">{stat.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Submission Form ── */}
              {showSugForm && !isGuest && (
                <div className="glass-card p-6 rounded-2xl border border-orange-500/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Send size={14} className="text-orange-500" />Share Your Cooling Idea
                  </h5>

                  {sugError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
                      <XCircle size={14} />{sugError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitSuggestion} className="space-y-3" id="suggestion-form">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Title <span className="text-red-400">*</span></label>
                        <input
                          id="sug-title"
                          type="text"
                          value={sugTitle}
                          onChange={e => setSugTitle(e.target.value)}
                          placeholder="e.g. Miyawaki Forest on OMR Corridor"
                          maxLength={255}
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <p className="text-[9px] text-slate-400 mt-0.5 text-right">{sugTitle.length}/255</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">District</label>
                        <select id="sug-district" value={sugDistrict} onChange={e => setSugDistrict(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {districts.length > 0 ? districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>) : <option value="Chennai">Chennai</option>}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Description <span className="text-red-400">*</span></label>
                      <textarea
                        id="sug-description"
                        value={sugDesc}
                        onChange={e => setSugDesc(e.target.value)}
                        placeholder="Describe your cooling idea in detail — location, scale, expected impact..."
                        rows={4}
                        maxLength={2000}
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5 text-right">{sugDesc.length}/2000</p>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                        <select id="sug-category" value={sugCategory} onChange={e => setSugCategory(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {SUGGESTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <button
                        id="sug-submit-btn"
                        type="submit"
                        disabled={sugSubmitting || !sugTitle.trim() || !sugDesc.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:pointer-events-none transition-all"
                      >
                        {sugSubmitting ? <><Activity size={13} className="animate-spin" />Submitting...</> : <><Send size={13} />Submit</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Success toast */}
              {sugSuccess && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                  <CheckCircle size={16} />{sugSuccess}
                </div>
              )}

              {/* ── Filter Bar ── */}
              <div className="glass-card p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="sug-search"
                    type="text"
                    value={sugSearch}
                    onChange={e => setSugSearch(e.target.value)}
                    placeholder="Search suggestions..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
                {/* Category filter */}
                <select
                  id="sug-filter-category"
                  value={sugFilterCategory}
                  onChange={e => setSugFilterCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {SUGGESTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* District filter */}
                <select
                  id="sug-filter-district"
                  value={sugFilterDistrict}
                  onChange={e => setSugFilterDistrict(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                {/* Sort */}
                <select
                  id="sug-sort"
                  value={sugSort}
                  onChange={e => setSugSort(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="votes">Most Voted</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                {/* Clear filters */}
                {(sugSearch || sugFilterCategory || sugFilterDistrict || sugSort !== 'votes') && (
                  <button
                    onClick={() => { setSugSearch(''); setSugFilterCategory(''); setSugFilterDistrict(''); setSugSort('votes'); }}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all"
                  >
                    <X size={12} />Clear
                  </button>
                )}
              </div>

              {/* ── Suggestions List ── */}
              {sugLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Activity size={20} className="animate-spin text-orange-500" />
                  <span className="text-sm font-medium">Loading suggestions...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Lightbulb size={28} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white">No suggestions yet</h5>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {sugSearch || sugFilterCategory || sugFilterDistrict
                      ? 'No results match your filters. Try clearing them.'
                      : 'Be the first to share a community cooling idea for Tamil Nadu!'}
                  </p>
                  {!isGuest && (sugSearch || sugFilterCategory || sugFilterDistrict) && (
                    <button onClick={() => { setSugSearch(''); setSugFilterCategory(''); setSugFilterDistrict(''); }} className="text-xs text-orange-500 hover:underline">Clear filters</button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(s => {
                    const catColor = categoryColor[s.category] || 'slate';
                    const isOwn = !isGuest && user.email === s.author_email;
                    const canDelete = isOwn || isAdmin;
                    return (
                      <div key={s.id} id={`suggestion-${s.id}`} className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex gap-4 group transition-all hover:border-orange-500/20 hover:shadow-md">
                        {/* Upvote */}
                        <div className="flex flex-col items-center shrink-0">
                          <button
                            id={`upvote-${s.id}`}
                            onClick={() => handleUpvote(s.id)}
                            title={isGuest ? 'Sign in to upvote' : 'Upvote this idea'}
                            disabled={isGuest}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${isGuest ? 'opacity-40 cursor-not-allowed' : 'hover:bg-orange-500/10 hover:scale-105 cursor-pointer'} bg-slate-100 dark:bg-slate-800`}
                          >
                            <ThumbsUp size={15} className="text-orange-500" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{s.upvotes}</span>
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white">{s.title}</h5>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-${catColor}-500/10 text-${catColor}-500 border border-${catColor}-500/20`}>
                                {s.category}
                              </span>
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                                <MapPin size={8} />{s.district}
                              </span>
                            </div>
                            {canDelete && (
                              <button
                                id={`delete-sug-${s.id}`}
                                onClick={() => handleDeleteSuggestion(s.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete suggestion"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <UserCircle size={10} />{s.author_email.split('@')[0]}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {isOwn && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">Your post</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {/* ═══════════════════════════════════════════════════════ PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto glass-card p-8 rounded-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">{(user.full_name || user.email).charAt(0).toUpperCase()}</div>
                <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.full_name || 'Analyst'}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isAdmin ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{user.role}</span> <span className="text-xs text-slate-400 ml-2">{user.email}</span></div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-4 py-2 rounded-xl glass-input bg-white dark:bg-slate-900 text-sm" />
                <button onClick={handleProfileSave} disabled={profileSaving} className="px-5 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">{profileSaving ? 'Saving...' : 'Save'}</button>
                {profileMsg && <p className="text-xs text-emerald-500">{profileMsg}</p>}
              </div>
              <div className="border-t border-red-500/20 pt-6">
                <h4 className="text-sm font-bold text-red-500 mb-2">Danger Zone</h4>
                <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold"><Trash2 size={14} />Delete Account</button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Job log modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3"><h4 className="font-bold text-slate-900 dark:text-white">Job #{selectedJob.id} Log</h4><button onClick={() => setSelectedJob(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></div>
            <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] h-64 overflow-y-auto whitespace-pre-wrap">{selectedJob.logs}</div>
            <button onClick={() => setSelectedJob(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl">Close</button>
          </div>
        </div>
      )}
      {!isGuest && <Chatbot currentDistrict={selectedDistrict?.name} activeTab={activeTab} />}
    </div>
  );
};

export default Dashboard;
