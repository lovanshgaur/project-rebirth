import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Home, 
  TrendingUp, 
  TrendingDown, 
  CheckSquare, 
  User, 
  Plus, 
  Droplet, 
  Code, 
  Dumbbell, 
  BookOpen, 
  Coffee, 
  Moon, 
  Zap, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';

// --- Configuration & Constants ---

const COLORS = {
  bg: '#FBFCFE',
  surface: '#FFFFFF',
  primary: '#0EA5A4',
  success: '#16A34A',
  warning: '#F97316',
  textMain: '#0F172A',
  textMuted: '#6B7280',
};

const HABITS = {
  earnings: [
    { id: 'water', label: 'Drank 1L Water', amount: 20, icon: <Droplet size={18} /> },
    { id: 'exercise', label: 'Exercise (25m)', amount: 120, icon: <Dumbbell size={18} /> },
    { id: 'code', label: 'Coding (1hr)', amount: 50, icon: <Code size={18} /> },
    { id: 'steps', label: '8k Steps', amount: 60, icon: <Zap size={18} /> },
    { id: 'read', label: 'Reading (30m)', amount: 70, icon: <BookOpen size={18} /> },
    { id: 'sleep', label: 'Good Sleep (7h+)', amount: 60, icon: <Moon size={18} /> },
    { id: 'meal', label: 'Healthy Meal', amount: 80, icon: <Coffee size={18} /> },
  ],
  penalties: [
    { id: 'sugar', label: 'Sugar/Sweets', amount: -100, icon: <ShieldAlert size={18} /> },
    { id: 'social', label: 'Doomscrolling', amount: -70, icon: <ShieldAlert size={18} /> },
    { id: 'youtube', label: 'YouTube Binge', amount: -80, icon: <ShieldAlert size={18} /> },
    { id: 'lazy', label: 'Skipped Workout', amount: -120, icon: <ShieldAlert size={18} /> },
    { id: 'junk', label: 'Junk Food', amount: -120, icon: <ShieldAlert size={18} /> },
  ]
};

const UPGRADES = [
  { id: 'potion', name: 'Willpower Potion', cost: 500, desc: 'Reset a bad streak' },
  { id: 'blade', name: 'Productivity Blade', cost: 1200, desc: '+10% on coding tasks' },
  { id: 'shield', name: 'Focus Shield', cost: 800, desc: 'Block 1 penalty/day' },
];

// --- Helper Functions ---

const formatCurrency = (amount) => {
  return amount >= 0 ? `+₹${amount}` : `-₹${Math.abs(amount)}`;
};

const getTodayString = () => new Date().toISOString().split('T')[0];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "active:scale-95 transition-transform rounded-xl font-medium flex items-center justify-center gap-2";
  const variants = {
    primary: `bg-[#0EA5A4] text-white shadow-sm shadow-[#0EA5A4]/30`,
    danger: `bg-[#F97316] text-white shadow-sm shadow-[#F97316]/30`,
    ghost: `bg-slate-100 text-slate-600`,
    outline: `border border-slate-200 text-slate-600 bg-white`
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

// --- Main App Component ---

export default function Game() {
  // State
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(0);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Animation Refs
  const balanceRef = useRef(null);

  // Persistence (Simulating IDB with LocalStorage for Single File ease)
  useEffect(() => {
    const savedData = localStorage.getItem('delusional_rpg_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setBalance(parsed.balance || 0);
      setEvents(parsed.events || []);
      setTasks(parsed.tasks || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('delusional_rpg_data', JSON.stringify({ balance, events, tasks }));
  }, [balance, events, tasks]);

  // Logic
  const handleLogEvent = (habit) => {
    const newEvent = {
      id: Date.now(),
      habitId: habit.id,
      label: habit.label,
      amount: habit.amount,
      timestamp: new Date().toISOString(),
      type: habit.amount > 0 ? 'earn' : 'lose'
    };

    setEvents(prev => [newEvent, ...prev]);
    setBalance(prev => prev + habit.amount);
    
    // Toast Feedback
    triggerToast(habit.amount > 0 ? 'success' : 'warning', `${formatCurrency(habit.amount)} — ${habit.label}`);
    
    // Close modal if open
    setShowLogModal(false);
  };

  const handleUndo = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Check time window (3 mins) - Simplified for demo to always allow recent
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setBalance(prev => prev - event.amount);
    triggerToast('neutral', 'Event undone');
  };

  const addTask = (title, reward) => {
    const newTask = {
      id: Date.now(),
      title,
      reward: parseInt(reward) || 50,
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
    setShowTaskModal(false);
  };

  const completeTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    
    // Log as earnings
    handleLogEvent({
      id: `task-${taskId}`,
      label: `Task: ${task.title}`,
      amount: task.reward
    });
  };

  const triggerToast = (type, message) => {
    setShowToast({ type, message });
    setTimeout(() => setShowToast(null), 3000);
  };

  // --- Sub-Screens ---

  const renderHome = () => {
    // Calculate daily delta
    const today = getTodayString();
    const todayEvents = events.filter(e => e.timestamp.startsWith(today));
    const dailyDelta = todayEvents.reduce((acc, curr) => acc + curr.amount, 0);

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        {/* Header / Balance */}
        <div className="pt-4 px-2">
          <div className="flex justify-between items-center mb-4 text-slate-400 text-sm font-medium">
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
            <span>TODAY</span>
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
          </div>
          
          <Card className="text-center py-8 relative overflow-hidden border-teal-100/50">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>
             <div className="text-slate-500 text-sm font-medium tracking-widest uppercase mb-2">Current Balance</div>
             <div ref={balanceRef} className="text-5xl font-bold text-slate-800 tracking-tight mb-2 transition-all duration-300">
               ₹{balance.toLocaleString()}
             </div>
             <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dailyDelta >= 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
               {dailyDelta >= 0 ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
               Today: {dailyDelta >= 0 ? '+' : ''}{dailyDelta}
             </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Quick Log</h3>
          <div className="grid grid-cols-4 gap-3">
            {HABITS.earnings.slice(0, 4).map(habit => (
              <button 
                key={habit.id}
                onClick={() => handleLogEvent(habit)}
                className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  {habit.icon}
                </div>
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{habit.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Feed */}
        <div>
           <div className="flex justify-between items-end px-2 mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h3>
            <span className="text-xs text-teal-600 font-medium">View All</span>
           </div>
           
           <div className="space-y-3">
             {events.length === 0 ? (
               <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 No logs today. Start grinding.
               </div>
             ) : (
               events.slice(0, 5).map((event) => (
                 <div key={event.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                   <div className="flex items-center gap-3">
                     <div className={`w-2 h-10 rounded-full ${event.type === 'earn' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                     <div>
                       <div className="text-slate-800 font-medium text-sm">{event.label}</div>
                       <div className="text-slate-400 text-xs">{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className={`font-bold ${event.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                       {event.type === 'earn' ? '+' : '-'}₹{Math.abs(event.amount)}
                     </span>
                     {/* Undo Button (Tiny) */}
                     <button 
                       onClick={() => handleUndo(event.id)}
                       className="text-slate-300 hover:text-red-400 p-1"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    );
  };

  const renderHistory = (type) => {
    const filtered = events.filter(e => type === 'earned' ? e.amount > 0 : e.amount < 0);
    const colorClass = type === 'earned' ? 'text-green-600' : 'text-orange-600';
    
    return (
      <div className="pb-24 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-6 px-2 capitalize">Money I {type}</h2>
        <div className="space-y-3">
           {filtered.map(event => (
             <Card key={event.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${type === 'earned' ? 'bg-green-50' : 'bg-orange-50'}`}>
                     {type === 'earned' ? <TrendingUp size={18} className={colorClass}/> : <TrendingDown size={18} className={colorClass}/>}
                   </div>
                   <div>
                     <p className="font-medium text-slate-800">{event.label}</p>
                     <p className="text-xs text-slate-400">{new Date(event.timestamp).toDateString()}</p>
                   </div>
                </div>
                <span className={`font-bold ${colorClass}`}>{formatCurrency(event.amount)}</span>
             </Card>
           ))}
        </div>
      </div>
    );
  };

  const renderTodo = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    
    return (
      <div className="pb-24 animate-fade-in h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 px-2">
           <h2 className="text-xl font-bold text-slate-800">Todays Missions</h2>
           <button onClick={() => setShowTaskModal(true)} className="p-2 bg-teal-50 text-teal-600 rounded-lg">
             <Plus size={20} />
           </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {activeTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <CheckSquare size={48} className="mb-4 opacity-20" />
               <p>All clear. Great work.</p>
             </div>
          ) : (
            activeTasks.map(task => (
              <div key={task.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 flex justify-between items-center z-10 relative bg-white transition-transform transform translate-x-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => completeTask(task.id)}
                      className="w-6 h-6 rounded-md border-2 border-slate-300 group-hover:border-teal-400 flex items-center justify-center"
                    >
                    </button>
                    <div>
                      <p className="text-slate-800 font-medium">{task.title}</p>
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                        Reward: ₹{task.reward}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="pb-24 animate-fade-in space-y-6">
      <div className="flex flex-col items-center py-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-teal-400 to-cyan-300 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-teal-200 mb-4">
          DE
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Delusional Emperor</h2>
        <p className="text-slate-500">Level 5 • 15 Day Streak</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">₹{events.filter(e=>e.amount>0).reduce((a,b)=>a+b.amount,0)}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Total Earned</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-500">₹{Math.abs(events.filter(e=>e.amount<0).reduce((a,b)=>a+b.amount,0))}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Total Fines</div>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase mb-3 px-2">Store Upgrades</h3>
        <div className="space-y-3">
          {UPGRADES.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
               <div className="flex gap-3 items-center">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={18}/></div>
                 <div>
                   <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                   <div className="text-xs text-slate-500">{item.desc}</div>
                 </div>
               </div>
               <Button 
                 variant="outline" 
                 className="text-xs py-1 h-8"
                 disabled={balance < item.cost}
                 onClick={() => {
                   if(balance >= item.cost) {
                     handleLogEvent({ id: `buy-${item.id}`, label: `Bought ${item.name}`, amount: -item.cost });
                   }
                 }}
               >
                 ₹{item.cost}
               </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Render Layout ---

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased text-slate-900">
      {/* Mobile Container */}
      <div className="w-full max-w-[420px] bg-[#FBFCFE] h-screen overflow-hidden flex flex-col relative shadow-2xl">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'earned' && renderHistory('earned')}
          {activeTab === 'used' && renderHistory('used')}
          {activeTab === 'todo' && renderTodo()}
          {activeTab === 'profile' && renderProfile()}
        </main>

        {/* Global Floating Action Button (for custom logging) */}
        {activeTab === 'home' && (
           <button 
             onClick={() => setShowLogModal(true)}
             className="absolute bottom-24 right-4 w-14 h-14 bg-[#0F172A] rounded-full text-white shadow-lg shadow-slate-400/40 flex items-center justify-center active:scale-90 transition-transform z-20"
           >
             <Plus size={24} />
           </button>
        )}

        {/* Bottom Navigation */}
        <nav className="h-20 bg-white border-t border-slate-100 flex justify-around items-center px-2 pb-2 z-30">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'earned', icon: TrendingUp, label: 'Earned' },
            { id: 'used', icon: TrendingDown, label: 'Used' },
            { id: 'todo', icon: CheckSquare, label: 'Todo' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${activeTab === tab.id ? 'text-[#0EA5A4] bg-teal-50/50' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
               <span className="text-[10px] font-medium mt-1">{tab.label}</span>
             </button>
          ))}
        </nav>

        {/* Log Modal */}
        {showLogModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end animate-fade-in">
            <div className="bg-white w-full rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[85vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Log Activity</h3>
                 <button onClick={() => setShowLogModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><ChevronRight className="rotate-90" /></button>
               </div>

               <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-teal-600 uppercase mb-3">Earnings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {HABITS.earnings.map(h => (
                        <button key={h.id} onClick={() => handleLogEvent(h)} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-colors text-left">
                          <div className="text-teal-600 bg-teal-50 p-2 rounded-lg">{h.icon}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{h.label}</div>
                            <div className="text-xs text-green-600 font-bold">+{h.amount}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-orange-500 uppercase mb-3">Penalties</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {HABITS.penalties.map(h => (
                        <button key={h.id} onClick={() => handleLogEvent(h)} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors text-left">
                          <div className="text-orange-500 bg-orange-50 p-2 rounded-lg">{h.icon}</div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{h.label}</div>
                            <div className="text-xs text-orange-600 font-bold">{h.amount}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4">New Mission</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  addTask(fd.get('title'), fd.get('reward'));
                }}>
                  <input name="title" autoFocus placeholder="Task title..." className="w-full mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500" required />
                  <div className="flex gap-2 mb-6">
                    {[50, 80, 100].map(amt => (
                      <label key={amt} className="flex-1 cursor-pointer">
                        <input type="radio" name="reward" value={amt} className="peer hidden" defaultChecked={amt === 50}/>
                        <div className="py-2 text-center border border-slate-200 rounded-lg peer-checked:bg-teal-50 peer-checked:border-teal-500 peer-checked:text-teal-700 text-sm font-medium transition-all">
                          ₹{amt}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1">Add Task</Button>
                  </div>
                </form>
             </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className={`absolute top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-down ${
            showToast.type === 'success' ? 'bg-green-600 text-white' : 
            showToast.type === 'warning' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-white'
          }`}>
             {showToast.type === 'success' ? <TrendingUp size={20} /> : showToast.type === 'warning' ? <ShieldAlert size={20} /> : <Zap size={20}/>}
             <span className="font-medium text-sm">{showToast.message}</span>
          </div>
        )}

      </div>
      
      {/* Micro-animations via standard CSS (no external GSAP dependency for reliability in iframe) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}