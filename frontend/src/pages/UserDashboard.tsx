import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  LogOut,
  Trash2,
  Lock,
  Plus,
  Terminal,
  UserCircle,
  Building2,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { districtService, jobService, profileService } from '../services/api';

interface UserDashboardProps {
  user: any;
  setUser: (u: any) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, setUser, onLogout, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cooling-projects');
  const isAdmin = user.role === 'admin';

  // Data & Upload State
  const [jobs, setJobs] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);


  // Profile State
  const [profileName, setProfileName] = useState(user.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Local user project list
  const [projects, setProjects] = useState<any[]>([
    { id: 1, name: 'Chennai Central Albedo Roof Painting', district: 'Chennai', targetCooling: '-3.5°C', status: 'In Progress', budget: '$45,000' },
    { id: 2, name: 'Madurai North Miyawaki Forest Cover', district: 'Madurai', targetCooling: '-4.2°C', status: 'Approved', budget: '$60,000' },
    { id: 3, name: 'Vellore Urban Marshland Restoration', district: 'Vellore', targetCooling: '-2.8°C', status: 'Draft', budget: '$30,000' }
  ]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDistrict, setNewProjectDistrict] = useState('Chennai');
  const [newProjectCooling] = useState('-3.0°C');

  useEffect(() => {
    jobService.getJobs().then(setJobs).catch(console.error);
    districtService.getDistricts().then(setDistricts).catch(console.error);
  }, []);



  const handleProfileSave = async () => {
    setProfileSaving(true); setProfileMsg('');
    try {
      const updated = await profileService.updateProfile(profileName);
      setUser(updated); setProfileMsg('Profile updated successfully.');
    } catch (err: any) { setProfileMsg(`Error: ${err.message}`);
    } finally { setProfileSaving(false); }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    const newP = {
      id: Date.now(),
      name: newProjectName,
      district: newProjectDistrict,
      targetCooling: newProjectCooling,
      status: 'Draft',
      budget: '$25,000'
    };
    setProjects(prev => [newP, ...prev]);
    setNewProjectName('');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const navigationItems = [

    { id: 'cooling-projects', name: 'My Cooling Projects', icon: Building2 },
    { id: 'pipeline-console', name: 'Pipeline Console', icon: Terminal },
    { id: 'profile', name: 'Profile & Security', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Top Header */}
      <header className="h-20 px-8 border-b border-slate-200 dark:border-slate-800 glass-panel flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/project-dashboard')} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-slate-500" title="Back to Project Platform">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl shadow-md">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 dark:text-white">Analyst Workspace</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isAdmin ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>{user.role}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tab links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          {navigationItems.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:scale-105 transition-transform">
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-semibold text-xs rounded-xl hover:bg-red-500/20 transition-all">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Workspace Content */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Welcome Summary Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Welcome back, {user.full_name || 'Analyst'}</h2>
            <p className="text-xs text-slate-400">Manage your uploaded thermal datasets, mitigation project proposals, and account credentials.</p>
          </div>

        </div>

        {/* TAB: COOLING PROJECTS */}
        {activeTab === 'cooling-projects' && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Personal Cooling Action Projects</h3>
                  <p className="text-xs text-slate-500">Track and manage your district-level thermal mitigation proposals.</p>
                </div>
              </div>

              {/* Form to create new project */}
              <form onSubmit={handleCreateProject} className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name</label>
                  <input type="text" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} placeholder="e.g. Salem Cool Roofs Initiative" className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">District</label>
                  <select value={newProjectDistrict} onChange={e=>setNewProjectDistrict(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-white dark:bg-slate-900">
                    {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="py-2 px-4 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-1.5">
                  <Plus size={14} />
                  <span>Create Project</span>
                </button>
              </form>

              {/* Project list */}
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status==='Approved'?'bg-emerald-500/10 text-emerald-500':p.status==='In Progress'?'bg-orange-500/10 text-orange-500':'bg-slate-500/10 text-slate-400'}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-slate-400">Target District: <strong>{p.district}</strong> | Estimated Cooling: <strong className="text-emerald-500">{p.targetCooling}</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold">{p.budget}</span>
                      <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PIPELINE CONSOLE */}
        {activeTab === 'pipeline-console' && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Ingestion Pipeline Telemetry</h3>
              <p className="text-xs text-slate-500">Monitor past background ingestion jobs. (Admin privileges required for new triggers).</p>
              
              {!isAdmin && (
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center gap-2 text-xs text-slate-400">
                  <Lock size={14} /> Triggering remote satellite pipelines requires Admin role.
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Job ID</th><th className="pb-3">Type</th><th className="pb-3">Date</th><th className="pb-3">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    {jobs.map(j => (
                      <tr key={j.id} className="hover:bg-slate-100/30">
                        <td className="py-3 font-mono">#JOB-{j.id}</td><td className="py-3 font-semibold">{j.job_type}</td>
                        <td className="py-3">{new Date(j.created_at).toLocaleDateString()}</td>
                        <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">{j.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto glass-card p-8 rounded-3xl space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Profile Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                <input type="text" value={profileName} onChange={e=>setProfileName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl glass-input bg-white dark:bg-slate-900 text-sm" />
              </div>
              <button onClick={handleProfileSave} disabled={profileSaving} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-600 transition-all">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
              {profileMsg && <p className="text-xs font-semibold text-emerald-500">{profileMsg}</p>}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
