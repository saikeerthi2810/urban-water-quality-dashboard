import { useEffect, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "motion/react";
import { 
  Droplets, 
  Activity, 
  Waves, 
  ShieldCheck, 
  Thermometer, 
  Info, 
  RefreshCw,
  Map as MapIcon,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowRight,
  User,
  Bell,
  TrendingUp,
  TrendingDown,
  Wind,
  CloudRain,
  Download,
  Search,
  Settings
} from "lucide-react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* --------------------------
Fix marker icon bug
--------------------------- */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/* --------------------------
Types
--------------------------- */
interface Reading {
  id?: string;
  location: string;
  ph: number;
  tds: number;
  turbidity: number;
  chlorine: number;
  hardness: number;
  dissolvedOxygen: number;
  temp: number;
  status: "SAFE" | "WARNING" | "UNSAFE";
  time: string;
}

interface Location {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

/* --------------------------
Stations (Default Fallback)
--------------------------- */
const defaultLocations: Location[] = [
  { name: "Hussain Sagar", lat: 17.4239, lng: 78.4738, description: "Central lake water quality monitoring" },
  { name: "Osman Sagar", lat: 17.3789, lng: 78.2939, description: "Drinking water reservoir supply" },
  { name: "Himayat Sagar", lat: 17.3239, lng: 78.3539, description: "Secondary reservoir checkpoint" },
];

/* --------------------------
Force map resize fix
--------------------------- */
function FixMap() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

/* --------------------------
Components
--------------------------- */
function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center px-4"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-blue-600 p-6 rounded-3xl shadow-2xl shadow-blue-500/20 inline-block mb-8"
        >
          <Droplets className="text-white w-16 h-16" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4"
        >
          PureStream
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-blue-400 font-bold uppercase tracking-[0.3em] text-sm md:text-base mb-12"
        >
          Urban Water Quality Monitoring System
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="group bg-white text-black px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 mx-auto hover:bg-blue-50 transition-all shadow-xl shadow-white/10"
        >
          Enter Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest"
      >
        Real-time Data • Cloud Analytics • Urban Safety
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, unit, icon: Icon, color, status, delay = 0, trend }: { 
  title: string; 
  value: number | string; 
  unit?: string; 
  icon: any; 
  color: string;
  status?: string;
  delay?: number;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-white/5 flex flex-col gap-3 transition-all hover:bg-slate-900/60 hover:border-white/10 group"
    >
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex flex-col items-end gap-1">
          {status && (
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
              status === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400' : 
              status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {status}
            </span>
          )}
          {trend && (
            <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
              trend === 'up' ? 'text-rose-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              {trend === 'up' ? '+2.4%' : trend === 'down' ? '-1.2%' : 'Stable'}
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          {unit && <span className="text-slate-600 text-xs font-bold uppercase tracking-tighter">{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function AlertFeed({ readings }: { readings: Reading[] }) {
  const dynamicAlerts = readings
    .filter(r => r.status === 'WARNING' || r.status === 'UNSAFE')
    .slice(0, 3)
    .map((r, idx) => ({
      id: `dynamic-${idx}`,
      type: r.status === 'UNSAFE' ? 'warning' : 'info',
      msg: `${r.status}: ${r.location} quality threshold exceeded`,
      time: 'Just now'
    }));

  const staticAlerts = [
    { id: 2, type: 'info', msg: 'System maintenance scheduled', time: '1h ago' },
    { id: 3, type: 'success', msg: 'Station 3 back online', time: '3h ago' },
  ];

  const alerts = [...dynamicAlerts, ...staticAlerts].slice(0, 4);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          System Alerts
        </h3>
        <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{alerts.length}</span>
      </div>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="flex gap-4 group cursor-pointer">
            <div className={`w-1 h-8 rounded-full shrink-0 ${
              alert.type === 'warning' ? 'bg-amber-500' : 
              alert.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
            }`} />
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{alert.msg}</p>
              <p className="text-[10px] text-slate-500 font-medium">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnvironmentalWidget() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Local Environment</p>
          <h3 className="text-2xl font-black tracking-tight">Hyderabad, TS</h3>
        </div>
        <CloudRain className="w-8 h-8 opacity-50" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-2xl p-3">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Humidity</p>
          <div className="flex items-center gap-2">
            <Waves className="w-3 h-3 text-blue-200" />
            <span className="text-sm font-black">64%</span>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-3">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Wind</p>
          <div className="flex items-center gap-2">
            <Wind className="w-3 h-3 text-blue-200" />
            <span className="text-sm font-black">12 km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ onBack }: { onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto px-4 py-10"
    >
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
        </button>
        <h2 className="text-2xl font-black text-white tracking-tighter">User Profile</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 mb-6">
              <User className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Sai Keerthi</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Senior Administrator</p>
            
            <div className="w-full space-y-3">
              <button className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Edit Profile</button>
              <button className="w-full py-3 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Log Out</button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Account Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Email Address</p>
                <p className="text-sm font-bold text-white">saikeerthimiryala28@gmail.com</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Department</p>
                <p className="text-sm font-bold text-white">Urban Infrastructure</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Access Level</p>
                <p className="text-sm font-bold text-emerald-400">Full Administrative</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Region</p>
                <p className="text-sm font-bold text-white">Hyderabad, TS</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">System Preferences</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Push Notifications</span>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Real-time Data Sync</span>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportPage({ readings, onBack }: { readings: Reading[], onBack: () => void }) {
  const safeCount = readings.filter(r => r.status === 'SAFE').length;
  const warningCount = readings.filter(r => r.status === 'WARNING').length;
  const unsafeCount = readings.filter(r => r.status === 'UNSAFE').length;
  const total = readings.length || 1;

  const avgPh = (readings.reduce((acc, r) => acc + r.ph, 0) / total).toFixed(2);
  const avgTds = Math.round(readings.reduce((acc, r) => acc + r.tds, 0) / total);
  const avgTurbidity = (readings.reduce((acc, r) => acc + r.turbidity, 0) / total).toFixed(2);

  const anomalies = readings.filter(r => r.status === 'UNSAFE');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 py-10"
    >
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
        </button>
        <div className="text-right">
          <h2 className="text-3xl font-black text-white tracking-tighter">Network Analysis Report</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Generated: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Summary */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Executive Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Health</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{Math.round((safeCount / total) * 100)}%</span>
                  <span className="text-[10px] font-bold text-emerald-400 mb-1">OPTIMAL</span>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Avg pH Level</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{avgPh}</span>
                  <span className="text-[10px] font-bold text-blue-400 mb-1">NEUTRAL</span>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Nodes</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">{total}</span>
                  <span className="text-[10px] font-bold text-slate-400 mb-1">ACTIVE</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20">
              <div className="flex gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl shrink-0 h-fit">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">System Analysis</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Current monitoring data indicates a stable network with {safeCount} nodes operating within standard parameters. 
                    Average TDS across the network is {avgTds} ppm, which is well within the safe threshold. 
                    {warningCount > 0 ? `However, ${warningCount} nodes are showing minor deviations requiring attention.` : 'No significant deviations detected in the current cycle.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Parameter Distribution</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Safe Operations</span>
                  <span className="text-[10px] font-black text-slate-500">{safeCount}/{total}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(safeCount/total)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Warning Thresholds</span>
                  <span className="text-[10px] font-black text-slate-500">{warningCount}/{total}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(warningCount/total)*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Critical Anomalies</span>
                  <span className="text-[10px] font-black text-slate-500">{unsafeCount}/{total}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(unsafeCount/total)*100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Anomalies List */}
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Critical Anomalies</h3>
            <div className="space-y-4">
              {anomalies.length > 0 ? anomalies.map((a, i) => (
                <div key={i} className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-white">{a.location}</span>
                  </div>
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Turbidity: {a.turbidity} NTU</p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <ShieldCheck className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Critical Anomalies</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 text-white shadow-xl shadow-blue-900/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-6">Recommendations</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-[10px] font-black">1</div>
                <p className="text-xs font-bold leading-relaxed">Increase chlorine dosing at Station 4 to counteract rising turbidity.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-[10px] font-black">2</div>
                <p className="text-xs font-bold leading-relaxed">Schedule manual sensor calibration for nodes showing "Warning" status.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-[10px] font-black">3</div>
                <p className="text-xs font-bold leading-relaxed">Review historical TDS trends for the Southern Sector.</p>
              </li>
            </ul>
            <button className="w-full mt-8 py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">
              Export Full PDF
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* --------------------------
App
--------------------------- */
export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'profile' | 'report'>('landing');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [locations, setLocations] = useState<Location[]>(defaultLocations);
  const [selectedStation, setSelectedStation] = useState<string>(defaultLocations[0].name);
  const [isDemo, setIsDemo] = useState(false);
  const [bubbles, setBubbles] = useState<any[]>([]);

  // Ensure selected station is valid when locations change
  useEffect(() => {
    if (locations.length > 0 && !locations.find(l => l.name === selectedStation)) {
      setSelectedStation(locations[0].name);
    }
  }, [locations]);

  useEffect(() => {
    // Generate random bubbles
    const newBubbles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 20 + 10}px`,
      duration: `${Math.random() * 5 + 5}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setBubbles(newBubbles);

    if (isDemo) {
      generateMockData();
      return;
    }

    // Firebase Realtime Listeners
    const unsubscribeLocations = onSnapshot(
      collection(db, "locations"),
      (snapshot) => {
        if (snapshot.empty) {
          setLocations(defaultLocations);
        } else {
          const data = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Location))
            .filter(loc => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number');
          setLocations(data.length > 0 ? data : defaultLocations);
        }
      }
    );

    const readingsQuery = query(
      collection(db, "water_readings"),
      orderBy("time", "desc"),
      limit(20)
    );

    const unsubscribeReadings = onSnapshot(readingsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          time: d.time?.toDate?.()
            ? d.time.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.time,
        } as Reading;
      });
      setReadings(data);
    });

    return () => {
      unsubscribeLocations();
      unsubscribeReadings();
    };
  }, [isDemo]);

  const generateMockData = () => {
    const data: Reading[] = [];
    locations.forEach((loc) => {
      // Generate 10 historical points for each location to show variations
      for (let i = 0; i < 10; i++) {
        const ph = Number((6.5 + Math.random() * 1.5).toFixed(2));
        const tds = Math.floor(200 + Math.random() * 300);
        const turbidity = Number((0.1 + Math.random() * 2.0).toFixed(2));
        const chlorine = Number((0.5 + Math.random() * 1.5).toFixed(2));
        const hardness = Math.floor(100 + Math.random() * 200);
        const dissolvedOxygen = Number((6.0 + Math.random() * 3.0).toFixed(1));
        const temp = Number((22 + Math.random() * 8).toFixed(1));

        let status: "SAFE" | "WARNING" | "UNSAFE" = "SAFE";
        if (ph < 6.5 || ph > 8.5 || turbidity > 1.0 || tds > 450 || hardness > 250 || dissolvedOxygen < 5.0) status = "WARNING";
        if (ph < 6.0 || ph > 9.0 || turbidity > 5.0 || tds > 500 || hardness > 300 || dissolvedOxygen < 4.0) status = "UNSAFE";

        const time = new Date();
        time.setMinutes(time.getMinutes() - (i * 15)); // 15 min intervals

        data.push({
          id: `mock-${loc.name}-${i}`,
          location: loc.name,
          ph,
          tds,
          turbidity,
          chlorine,
          hardness,
          dissolvedOxygen,
          temp,
          status,
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });
    setReadings(data);
  };

  const seedData = async () => {
    try {
      // First, ensure locations exist in Firebase if they don't
      const locationsSnap = await getDocs(collection(db, "locations"));
      
      let currentLocations = locations;
      if (locationsSnap.empty) {
        const newLocs = [];
        for (const loc of defaultLocations) {
          const docRef = await addDoc(collection(db, "locations"), loc);
          newLocs.push({ id: docRef.id, ...loc });
        }
        currentLocations = newLocs;
        setLocations(newLocs);
      }

      // Add multiple readings for the selected station to show variation
      const stationName = selectedStation || currentLocations[0].name;
      
      for (let i = 0; i < 5; i++) {
        const ph = Number((6.5 + Math.random() * 1.5).toFixed(2));
        const tds = Math.floor(200 + Math.random() * 300);
        const turbidity = Number((0.1 + Math.random() * 2.0).toFixed(2));
        const chlorine = Number((0.5 + Math.random() * 1.5).toFixed(2));
        const hardness = Math.floor(100 + Math.random() * 200);
        const dissolvedOxygen = Number((6.0 + Math.random() * 3.0).toFixed(1));
        const temp = Number((22 + Math.random() * 8).toFixed(1));

        let status: "SAFE" | "WARNING" | "UNSAFE" = "SAFE";
        if (ph < 6.5 || ph > 8.5 || turbidity > 1.0 || tds > 450 || hardness > 250 || dissolvedOxygen < 5.0) status = "WARNING";
        if (ph < 6.0 || ph > 9.0 || turbidity > 5.0 || tds > 500 || hardness > 300 || dissolvedOxygen < 4.0) status = "UNSAFE";

        await addDoc(collection(db, "water_readings"), {
          location: stationName,
          ph,
          tds,
          turbidity,
          chlorine,
          hardness,
          dissolvedOxygen,
          temp,
          status,
          time: serverTimestamp(),
        });
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log("Successfully seeded variations for " + stationName);
    } catch (e) {
      console.error("Error seeding data: ", e);
    }
  };

  const activeReading = readings.find(r => r.location === selectedStation) || readings[0];

  const chartData = useMemo(() => {
    const stationReadings = readings
      .filter(r => r.location === selectedStation)
      .reverse(); // Show oldest to newest
    
    return {
      labels: stationReadings.map((r) => r.time),
      datasets: [
        {
          label: `${selectedStation} - pH Level`,
          data: stationReadings.map((r) => r.ph),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
        },
        {
          label: `${selectedStation} - Turbidity (NTU)`,
          data: stationReadings.map((r) => r.turbidity),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
        }
      ],
    };
  }, [readings, selectedStation]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' as any }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      }
    }
  };

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-x-hidden">
      {/* Background Water Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="water-wave" />
        <div className="water-wave water-wave-2" />
        {bubbles.map(b => (
          <div 
            key={b.id} 
            className="bubble" 
            style={{ 
              left: b.left, 
              width: b.size, 
              height: b.size, 
              animationDuration: b.duration, 
              animationDelay: b.delay 
            }} 
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-black/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-2xl shadow-blue-500/20">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">PureStream</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none">Network Active</p>
              </div>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8">
              {['Overview', 'Stations', 'Analytics', 'Reports'].map(item => (
                <button 
                  key={item} 
                  onClick={() => {
                    if (item === 'Overview') setView('dashboard');
                    if (item === 'Reports') setView('report');
                  }}
                  className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                    (item === 'Overview' && view === 'dashboard') || (item === 'Reports' && view === 'report')
                      ? 'text-white'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-3">
              <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-black" />
              </button>
              <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Settings className="w-5 h-5" />
              </button>
              <div 
                onClick={() => setView('profile')}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20 cursor-pointer hover:scale-105 transition-transform"
              >
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        {view === 'profile' ? (
          <ProfilePage onBack={() => setView('dashboard')} />
        ) : view === 'report' ? (
          <ReportPage readings={readings} onBack={() => setView('dashboard')} />
        ) : (
          <>
            {/* Top Section: Welcome & Quick Info */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Administrator</span>
              <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">•</span>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Last Login: 10:42 AM</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Command Center</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">Monitoring {locations.length} active nodes across the metropolitan area.</p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDemo(!isDemo)}
              className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-6 py-3 bg-white text-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-white/5"
            >
              {isDemo ? 'Live Sync' : 'Demo Mode'}
              <RefreshCw className={`w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 ${isDemo ? 'text-amber-600' : 'text-emerald-600'}`} />
            </button>
            <button className="p-3 bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Stats & Alerts */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <EnvironmentalWidget />
            <AlertFeed readings={readings} />
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={seedData}
                  className="p-3 bg-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Seed Data
                </button>
                <button className="p-3 bg-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">Audit</button>
              </div>
            </div>
          </div>

          {/* Center Column: Main Stats & Charts */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <StatCard 
                title="pH Level" 
                value={activeReading?.ph || '--'} 
                icon={Activity} 
                color="bg-blue-500" 
                status={activeReading?.status}
                trend="down"
                delay={0.1}
              />
              <StatCard 
                title="TDS" 
                value={activeReading?.tds || '--'} 
                unit="ppm" 
                icon={Waves} 
                color="bg-indigo-500" 
                trend="up"
                delay={0.2}
              />
              <StatCard 
                title="Turbidity" 
                value={activeReading?.turbidity || '--'} 
                unit="ntu"
                icon={Droplets}
                color="bg-cyan-500"
                trend="stable"
                delay={0.3}
              />
              <StatCard 
                title="Chlorine" 
                value={activeReading?.chlorine || '--'} 
                unit="mg/L"
                icon={ShieldCheck}
                color="bg-blue-400"
                trend="stable"
                delay={0.4}
              />
              <StatCard 
                title="Hardness" 
                value={activeReading?.hardness || '--'} 
                unit="mg/L"
                icon={Activity}
                color="bg-purple-500"
                trend="up"
                delay={0.5}
              />
              <StatCard 
                title="Dissolved Oxygen" 
                value={activeReading?.dissolvedOxygen || '--'} 
                unit="mg/L"
                icon={Waves}
                color="bg-teal-500"
                trend="down"
                delay={0.6}
              />
              <StatCard 
                title="Temp" 
                value={activeReading?.temp || '--'} 
                unit="°C"
                icon={Thermometer}
                color="bg-emerald-500"
                trend="up"
                delay={0.7}
              />
            </div>

            {/* Chart Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Performance</h3>
                  <h4 className="text-xl font-black text-white tracking-tight">Quality Trends</h4>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  {['24h', '7d', '30d'].map(t => (
                    <button key={t} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${t === '24h' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Map & Table Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Map */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Geospatial</h3>
                    <h4 className="text-xl font-black text-white tracking-tight">Station View</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Stable</span>
                    </div>
                  </div>
                </div>
                <div className="h-[350px] rounded-2xl overflow-hidden shadow-inner border border-white/5">
                  <MapContainer center={[17.3850, 78.4867]} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FixMap />
                    {locations.filter(loc => typeof loc.lat === 'number' && typeof loc.lng === 'number').map((loc) => (
                      <Marker 
                        key={loc.id || loc.name} 
                        position={[loc.lat, loc.lng]}
                        eventHandlers={{ click: () => setSelectedStation(loc.id || loc.name) }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-black text-slate-900">{loc.name}</h3>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Status: {loc.status || 'Active'}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </motion.div>

              {/* Table */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inventory</h3>
                    <h4 className="text-xl font-black text-white tracking-tight">Station Integrity</h4>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="SEARCH NODES..." 
                      className="bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500/50 transition-all w-48"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Station</th>
                        <th className="text-left py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                        <th className="text-right py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {locations.map((loc) => (
                        <tr key={loc.id} className="group cursor-pointer hover:bg-white/[0.02] transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${loc.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-xs font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{loc.name}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${loc.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                              {loc.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-xs font-mono text-slate-400">98.4%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    )}
  </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-blue-100 mt-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Droplets className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">PureStream v2.0</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-blue-400">© 2026 Smart City Infrastructure Dept.</p>
        </div>
      </footer>
    </div>
  );
}

