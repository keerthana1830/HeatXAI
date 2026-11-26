import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Sun, Moon, MapPin, Activity, Brain,
  Building2, BarChart3, Zap, Globe, Users, ChevronDown,
  ChevronUp, Star, Check
} from 'lucide-react';

interface LandingProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Landing: React.FC<LandingProps> = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Animated counter
  const [counter, setCounter] = useState({ districts: 0, accuracy: 0, cooling: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => ({
        districts: Math.min(prev.districts + 1, 38),
        accuracy: Math.min(prev.accuracy + 2, 96),
        cooling: Math.min(prev.cooling + 0.2, 8.5)
      }));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: MapPin, title: 'Interactive Folium Heatmaps', desc: 'Live Leaflet.js thermal maps with district-level LST, NDVI, and NDBI choropleth overlays powered by Sentinel-2 satellite imagery.', color: 'orange' },
    { icon: Brain, title: 'Explainable AI (SHAP)', desc: 'Transparent SHAP waterfall analysis decomposes each prediction into measurable feature contributions with interactive parameter sliders.', color: 'purple' },
    { icon: Building2, title: 'SaaS Digital Twin', desc: '3D isometric thermal simulation console with Infrared Camera mode, side-by-side baseline comparison, and energy cost projections.', color: 'blue' },
    { icon: BarChart3, title: 'Smart Recommendations', desc: 'Priority-scored cooling interventions with ROI estimates, implementation timelines, and budget projections per district.', color: 'emerald' },
    { icon: Users, title: 'Community Suggestions', desc: 'Analyst-powered crowdsourced cooling ideas with upvote ranking, category filters, and district-specific targeting.', color: 'pink' },
    { icon: Activity, title: 'Real-Time Pipeline', desc: 'Automated satellite data ingestion from Copernicus, Landsat 8, and ERA5 reanalysis with live execution telemetry logs.', color: 'amber' },
  ];

  const faqs = [
    { q: 'What satellite data does Thermacity use?', a: 'We ingest multispectral bands from Copernicus Sentinel-2 (NDVI/NDBI), NASA Landsat 8 TIRS (LST), and ECMWF ERA5 atmospheric reanalysis grids.' },
    { q: 'How does Explainable AI work in the platform?', a: 'Each LST prediction is decomposed using SHAP (SHapley Additive exPlanations) values. The waterfall chart shows exactly how much each feature (NDBI, NDVI, solar load, water proximity) contributes to the final temperature.' },

    { q: 'What is the Digital Twin Simulator?', a: 'It is an interactive 3D thermal model that simulates the impact of cooling interventions (cool roofs, microforests, water bodies) on a district\'s surface temperature in real time.' },
    { q: 'Is Thermacity free to use?', a: 'The Project Dashboard with public heatmaps and analytics is free. The full Analyst Workspace with pipeline triggers, AI training, and project management requires a registered account.' },
  ];

  const testimonials = [
    { name: 'Dr. Priya Rajan', role: 'Urban Climate Researcher, IIT Madras', quote: 'Thermacity\'s SHAP explainability layer transformed how we communicate heat risk to policymakers. The digital twin simulator is invaluable.' },
    { name: 'Karthik Subramanian', role: 'Smart City Director, Chennai Corp.', quote: 'We used Thermacity to identify 12 priority zones for cool roof painting. The ROI projections helped us secure municipal funding.' },
    { name: 'Ananya Krishnan', role: 'Environmental Data Scientist', quote: 'The Folium integration and satellite pipeline automation saved our team weeks of manual GIS processing. Production-grade analytics.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 h-16 px-8 glass-panel border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl shadow-lg"><Sparkles className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Thermacity</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <a href="#features" className="hover:text-orange-500 transition-colors">Features</a>
          <a href="#metrics" className="hover:text-orange-500 transition-colors">Metrics</a>
          <a href="#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform">
            {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
          </button>
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">Sign In</button>
          <button onClick={() => navigate('/signup')} className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all">Start Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent dark:from-orange-950/20" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-xs font-bold">
            <Zap size={14} />
            <span>Tamil Nadu's #1 Urban Heat Intelligence SaaS</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
            Predict, Explain & <br />
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Cool Urban Heat</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Satellite-powered thermal analytics with Explainable AI, interactive Folium heatmaps, and Digital Twin cooling simulations across Tamil Nadu's 38 districts.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button onClick={() => navigate('/project-dashboard')} className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-2">
              <Globe size={18} />
              <span>Explore Live Platform</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/signup')} className="px-8 py-3.5 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Live Metrics Ticker */}
      <section id="metrics" className="py-16 px-8 border-y border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Districts Monitored', value: counter.districts, suffix: '', color: 'text-orange-500' },
            { label: 'AI Model Accuracy', value: counter.accuracy, suffix: '%', color: 'text-emerald-500' },
            { label: 'Max Cooling Achieved', value: counter.cooling.toFixed(1), suffix: '°C', color: 'text-blue-500' },
            { label: 'Satellite Sources', value: 3, suffix: '', color: 'text-purple-500' },
          ].map((m, i) => (
            <div key={i} className="space-y-2">
              <h3 className={`text-4xl font-extrabold ${m.color}`}>{m.value}{m.suffix}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Platform Capabilities</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">Enterprise-grade urban heat intelligence tools built for climate researchers, urban planners, and smart city administrators.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-4 group">
                  <div className={`p-3 w-fit rounded-2xl bg-${f.color}-500/10`}>
                    <Icon size={22} className={`text-${f.color}-500`} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="py-20 px-8 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/40 dark:border-slate-800/40 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-8 text-center bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold">Ready to Cool Your City?</h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto">Join urban planners, climate researchers, and smart city administrators using Thermacity to fight the urban heat island effect.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="px-8 py-3 bg-white text-slate-900 font-bold text-sm rounded-2xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2">
              <span>Get Started Free</span><ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/project-dashboard')} className="px-8 py-3 bg-white/20 border border-white/30 text-white font-semibold text-sm rounded-2xl hover:bg-white/30 transition-all">
              View Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Thermacity — Urban Heat Intelligence Platform. Built for Tamil Nadu.</p>
      </footer>
    </div>
  );
};
