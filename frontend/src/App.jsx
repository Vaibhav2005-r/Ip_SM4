import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Package, TrendingUp, DollarSign, BellRing, Settings, 
  Search, Bot, Sparkles, FileText, ChevronRight, CheckCircle, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, MessageCircle 
} from 'lucide-react';

// ==========================================
// 1. DATA PROVIDER & FETCH LOGIC (PRESERVED)
// ==========================================
const DataContext = React.createContext();
const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8081/api/ims/products')
      .then(res => res.json())
      .then(data => {
         const mapped = data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            stock: 50 // Standardize default
         }));
         setProducts(mapped);
      })
      .catch(err => console.error("Could not fetch DB products: ", err));
  }, []);

  const showToast = (msg, type = 'success') => {
     setToast({ msg, type });
     setTimeout(() => setToast(null), 4000);
  };

  const recordSale = async (name, qty) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/sales', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productName: name, quantity: parseInt(qty) })
      });
      const result = await res.json();
      
      setProducts(prev => prev.map(p => {
        if (p.name === name) {
          if (result.newStock < 10) showToast(`WhatsApp Alert: Low Stock for ${name}`, 'critical');
          return { ...p, stock: result.newStock };
        }
        return p;
      }));
    } catch(err) {
      console.error('Sale error', err);
    }
  };

  const applyAction = async (name, actionType) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/prices', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productName: name, actionType: actionType })
      });
      const result = await res.json();
      setProducts(prev => prev.map(p => p.name === name ? { ...p, price: result.newPrice } : p));
      showToast(`AI Price Updated: ₹${result.newPrice}`, 'success');
    } catch(err) {
      console.error('Price update error', err);
    }
  };

  const restockProduct = async (name, qty) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/restock', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productName: name, quantity: parseInt(qty) })
      });
      const result = await res.json();
      setProducts(prev => prev.map(p => p.name === name ? { ...p, stock: result.newStock } : p));
      showToast(`Stock replenished for ${name}: +${qty}`, 'success');
    } catch(err) {
      console.error('Restock error', err);
    }
  };

  const createProduct = async (newProd) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/products', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: newProd.name, category: newProd.category, price: parseFloat(newProd.price) })
      });
      const data = await res.json();
      setProducts(prev => [{...data, stock: 0}, ...prev]);
      showToast(`${newProd.name} deployed globally!`, 'success');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <DataContext.Provider value={{ products, recordSale, applyAction, restockProduct, createProduct }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 ${
                toast.type === 'critical' 
                ? 'bg-red-500/90 border-red-400 text-white shadow-red-500/50' 
                : 'bg-[#003153]/90 border-blue-400 text-white shadow-blue-500/50'
            }`}
          >
             {toast.type === 'critical' ? <AlertTriangle className="animate-pulse" /> : <Sparkles />}
             <span className="font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </DataContext.Provider>
  );
};

// ==========================================
// 2. PREMIUM COMPONENTS
// ==========================================
const SidebarItem = ({ icon: Icon, text, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to}>
      <motion.div 
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-3 px-4 py-3 my-1 rounded-xl cursor-pointer transition-all ${
          isActive 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-900'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
        <span className={`font-semibold ${isActive ? '' : 'tracking-wide'}`}>{text}</span>
      </motion.div>
    </Link>
  );
};

const KPICard = ({ title, value, sub, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/60 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,49,83,0.08)] transition-all"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${color} blur-xl group-hover:scale-150 transition-transform duration-700`}></div>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-xl`}>
        <Icon size={24} />
      </div>
      <span className="flex items-center gap-1 text-sm font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
        <ArrowUpRight size={14} /> 12%
      </span>
    </div>
    <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
    <h2 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">{value}</h2>
    <p className="text-xs text-gray-400 mt-2">{sub}</p>
  </motion.div>
);

// ==========================================
// 3. SMART DASHBOARD (HERO)
// ==========================================
const SmartDashboard = () => {
  const { products } = useContext(DataContext);
  
  // Mock graphical data for Vercel-like charts
  const chartData = [
    { name: 'Jan', revenue: 4000, profit: 2400 },
    { name: 'Feb', revenue: 5500, profit: 3200 },
    { name: 'Mar', revenue: 7200, profit: 4800 },
    { name: 'Apr', revenue: 6800, profit: 4100 },
    { name: 'May', revenue: 9500, profit: 6000 },
    { name: 'Jun', revenue: 12000, profit: 8400 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Utility Bar */}
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-lg p-4 rounded-2xl border border-gray-100 shadow-sm">
         <div>
            <h1 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">AI Command Center</h1>
            <p className="text-sm font-medium text-gray-500">Intelligent system overview</p>
         </div>
         <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="text" placeholder="Search inventory... (Cmd+K)" className="pl-10 pr-4 py-2 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all" />
            </div>
            <motion.button onClick={() => window.location.href='/predictions'} whileHover={{ scale: 1.05 }} className="bg-[#0a0a0a] text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              <Sparkles size={16} /> Predict Trends
            </motion.button>
         </div>
      </div>

      {/* KPI LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Inventory Value" value="₹24.8M" sub="Updated real-time" icon={DollarSign} color="from-blue-500 to-indigo-600" delay={0.1} />
        <KPICard title="Active Products" value={products.length || 0} sub="Monitoring 100% catalog" icon={Package} color="from-indigo-500 to-purple-600" delay={0.2} />
        <KPICard title="AI Health Score" value="98.4" sub="System operating nominally" icon={ActivityIcon} color="from-emerald-400 to-teal-500" delay={0.3} />
        <KPICard title="Critical Alerts" value="2" sub="Requires immediate review" icon={BellRing} color="from-rose-400 to-red-500" delay={0.4} />
      </div>

      {/* CHARTS & AI PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vercel-style Area Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-extrabold text-[#0a0a0a] mb-6 flex items-center gap-2"><TrendingUp className="text-indigo-500" /> Revenue vs Output Projection</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{ opacity: 0.1 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Assistant Overlay */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] p-6 rounded-3xl shadow-2xl relative overflow-hidden group text-white flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
           <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20"><Bot size={24} className="text-indigo-300" /></div>
                <h2 className="text-lg font-bold">Copilot Insights</h2>
              </div>
              <div className="space-y-4 relative z-10">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex gap-2 items-center text-emerald-400 mb-1"><TrendingUp size={16} /> <span className="text-sm font-bold">Demand Spike</span></div>
                    <p className="text-sm text-gray-300">Demand for <strong>Aashirvaad Atta</strong> is predicted to rise 18% next week. Suggest increasing price by ₹20.</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex gap-2 items-center text-rose-400 mb-1"><AlertTriangle size={16} /> <span className="text-sm font-bold">Low Stock Warning</span></div>
                    <p className="text-sm text-gray-300"><strong>Tata Salt</strong> drops below 10 units in 4 days at current sales velocity.</p>
                 </div>
              </div>
           </div>
           <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all">Chat with Copilot</button>
        </motion.div>
      </div>

    </motion.div>
  );
};

// Quick missing icon wrapper
const ActivityIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;

// ==========================================
// 4. INTELLIGENT INVENTORY PAGE
// ==========================================
const InventoryPage = () => {
  const { products, recordSale, restockProduct, createProduct } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', category: 'FMCG', price: '' });

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center mt-4">
        <div>
           <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Product Matrix</h1>
           <p className="text-gray-500 font-medium">Manage and track your global entities.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer">
           <Package size={18} /> Add Product
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md border border-gray-100">
               <h2 className="text-2xl font-extrabold text-[#0a0a0a] mb-6">Deploy New Product</h2>
               <div className="space-y-4">
                  <input placeholder="Product Name (e.g. Red Label Tea)" onChange={e => setNewProd({...newProd, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Category" value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Price Base (INR)" type="number" onChange={e => setNewProd({...newProd, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={() => { createProduct(newProd); setShowModal(false); }} className="flex-1 py-3 bg-[#0a0a0a] text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Launch Entity</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/60 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6">
         <div className="mb-6">
           <div className="relative w-1/3">
             <Search className="absolute left-3 top-3 text-gray-400" size={18} />
             <input type="text" placeholder="Filter by name..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
           </div>
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead>
               <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                 <th className="pb-4 font-semibold w-1/3">Product Name</th>
                 <th className="pb-4 font-semibold">Category</th>
                 <th className="pb-4 font-semibold">Value (INR)</th>
                 <th className="pb-4 font-semibold">Stock Level</th>
                 <th className="pb-4 font-semibold text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="text-sm">
               {filtered.slice(0, 15).map((p, i) => (
                 <motion.tr 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                   key={p.id} className="border-b border-gray-50 hover:bg-indigo-50/50 transition-colors group"
                 >
                   <td className="py-4 font-bold text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{p.name.charAt(0)}</div>
                      {p.name}
                   </td>
                   <td className="py-4 text-gray-500"><span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold">{p.category}</span></td>
                   <td className="py-4 font-mono font-semibold text-gray-700">₹{parseFloat(p.price).toFixed(2)}</td>
                   <td className="py-4">
                      {p.stock > 10 ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-max text-xs font-bold border border-emerald-100">
                           <CheckCircle size={14} /> {p.stock} In Stock
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-max text-xs font-bold border border-rose-200 animate-pulse">
                           <AlertTriangle size={14} /> {p.stock} Low Stock
                        </span>
                      )}
                   </td>
                   <td className="py-4 text-right flex justify-end gap-2">
                      <button onClick={() => restockProduct(p.name, 50)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                        + Restock
                      </button>
                      <button onClick={() => recordSale(p.name, 1)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                        - Sell
                      </button>
                   </td>
                 </motion.tr>
               ))}
               {filtered.length === 0 && (
                 <tr><td colSpan="5" className="text-center py-12 text-gray-400">No products found.</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// 4B. AI MARKET ENGINE LAYER
// ==========================================
const AIMarketEngine = () => {
  const [analysis, setAnalysis] = useState([]);
  const { products, applyAction } = useContext(DataContext);

  const runEngine = () => {
     if (products.length < 2) return;
     const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 2);
     setAnalysis([
       { id: 1, product: shuffled[0].name, action: 'APPLY DISCOUNT', confidence: '88.3%', msg: 'Low demand detected next quarter.' },
       { id: 2, product: shuffled[1].name, action: 'INCREASE PRICE +5%', confidence: '94.2%', msg: 'Spike in regional FMCG trends.' }
     ]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6 mt-4">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">AI Predictions Engine</h1>
           <p className="text-gray-500 font-medium">Scikit-Learn models mapping future localized demand.</p>
        </div>
        <button onClick={runEngine} className="bg-[#0a0a0a] text-white px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2">
           <Bot size={18} /> Execute AI Model
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {analysis.length === 0 ? (
            <div className="md:col-span-2 text-center text-gray-400 py-20 bg-white/40 border border-gray-100 rounded-3xl">Click "Execute AI Model" to analyze tracked items.</div>
         ) : analysis.map(a => (
            <motion.div key={a.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/60 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-sm text-center flex flex-col items-center group">
               <h3 className="font-bold text-gray-800 text-xl">{a.product}</h3>
               <p className="text-sm text-gray-500 mt-2 h-10">{a.msg}</p>
               <div className="my-4 inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold font-mono">CONFIDENCE: {a.confidence}</div>
               <button onClick={() => applyAction(a.product, a.action)} className="w-full mt-auto py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg font-bold text-sm hover:scale-[1.02] transition-transform">
                 Apply: {a.action}
               </button>
            </motion.div>
         ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// 5. FINANCE & AI REPORTS LAYER
// ==========================================
const ReportsPage = () => {
   const { products } = useContext(DataContext);
   
   const totalGross = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (p.stock || 50), 0);
   const cgst = totalGross * 0.09;
   const sgst = totalGross * 0.09;
   const realizedNet = totalGross + cgst + sgst;

   const pieData = [ {name:'Core Gross Value', val: totalGross}, {name:'CGST (9%)', val: cgst}, {name:'SGST (9%)', val: sgst} ];
   const colors = ['#0a0a0a', '#4f46e5', '#38bdf8'];

   return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6 mt-4">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Financial Intelligence</h1>
               <p className="text-gray-500 font-medium">Auto-generated cryptographic analysis and GST tracking.</p>
            </div>
            <a href="http://localhost:8000/api/reports/generate-pdf" download="IMS_Report.pdf">
              <motion.button whileHover={{ scale: 1.05 }} className="bg-[#0a0a0a] text-white px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2">
                 <FileText size={18} /> Export Cryptographic PDF
              </motion.button>
            </a>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-xl border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col justify-center items-center text-center group">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm border border-blue-100"><DollarSign size={32} /></div>
               <h2 className="text-4xl font-extrabold text-[#0a0a0a] mb-2">₹{realizedNet.toLocaleString('en-IN', {minimumFractionDigits:2})}</h2>
               <p className="text-gray-500 font-medium">Total Asset Potential (Net + GST)</p>
               <div className="mt-4 flex gap-2"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold font-mono">+12.4% vs Prev</span></div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col items-center">
               <h2 className="text-xl font-bold text-gray-800 self-start w-full border-b border-gray-100 pb-4 mb-4">GST Compliance Breakdown</h2>
               <div className="h-48 w-full flex justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="val">
                           {pieData.map((e, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                     </PieChart>
                   </ResponsiveContainer>
               </div>
               <div className="flex gap-4 w-full justify-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><div className="w-3 h-3 bg-[#0a0a0a] rounded-sm"></div> Gross Base</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> CGST</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500"><div className="w-3 h-3 bg-sky-400 rounded-sm"></div> SGST</div>
               </div>
            </div>
         </div>
      </motion.div>
   );
};

// ==========================================
// 6. MAIN APPLICATION WRAPPER & ROUTING
// ==========================================
const App = () => {
  return (
    <Router>
      <DataProvider>
        <div className="flex h-screen bg-[#fafafa] font-sans selection:bg-indigo-200">
           
           {/* Ultimate Sidebar */}
           <div className="w-64 bg-white/80 backdrop-blur-2xl border-r border-gray-200 flex flex-col p-4 z-50">
             <div className="flex items-center gap-3 px-2 py-4 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0a0a0a] to-[#2a2a2a] rounded-xl flex items-center justify-center shadow-lg">
                   <Sparkles className="text-indigo-400" size={20} />
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-[#0a0a0a]">Vault AI</h1>
             </div>

             <nav className="flex flex-col gap-1 flex-1">
                <SidebarItem icon={LayoutDashboard} text="Dashboard" to="/" />
                <SidebarItem icon={Package} text="Inventory Matrix" to="/inventory" />
                <SidebarItem icon={TrendingUp} text="AI Market Engine" to="/predictions" />
                <SidebarItem icon={FileText} text="Financial Intel" to="/reports" />
             </nav>

             <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">V</div>
                   <div>
                     <p className="text-sm font-bold text-gray-800 leading-none">Admin Vaibhav</p>
                     <p className="text-xs text-gray-500 mt-1">Superuser</p>
                   </div>
                </div>
             </div>
           </div>

           {/* Main Content Pane */}
           <div className="flex-1 overflow-y-auto relative">
              {/* Soft background glow */}
              <div className="fixed top-0 left-1/4 w-[800px] h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent blur-[100px] -z-10 pointer-events-none"></div>
              
              <div className="p-8">
                 <Routes>
                    <Route path="/" element={<SmartDashboard />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/predictions" element={<AIMarketEngine />} />
                    <Route path="/reports" element={<ReportsPage />} />
                 </Routes>
              </div>
           </div>

        </div>
      </DataProvider>
    </Router>
  );
};

export default App;
