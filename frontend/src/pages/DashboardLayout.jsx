import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { mockDatabase } from "../utils/mockDatabase";
import { 
   Home, 
   FilePlus, 
   History, 
   Clock, 
   BarChart2, 
   Bell, 
   Settings, 
   LogOut,
  Menu,
  X,
   ShieldCheck,
   User as UserIcon,
   Calendar
} from "lucide-react";

export function Header({ title, subtitle, caseNo }) {
  const { user } = useAuth();
  
  return (
    <header className="topbar">
      <div>
        <h1>VERIFYDOC</h1>
        <p>AI-Based Fake Identity &amp; Document Screening System</p>
      </div>
      <div className="topbar-right">
        {caseNo && <span className="case-chip">{caseNo}</span>}
        <div className="officer">
          <strong>{user?.username || "Officer_102"}</strong>
          <span><i className="status-dot" /> Online</span>
        </div>
      </div>
    </header>
  );
}

export function Panel({ title, children, className = "" }) { 
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">{title}</div>
      {children}
    </section>
  ); 
}

export function Stat({ number, label, tone = "blue", foot, trend }) { 
  return (
    <div className="stat">
      <span>{label}</span>
      <div className="stat-body">
        <strong className={tone}>{number}</strong>
        {trend && <span className="trend positive">↑ {trend}%</span>}
      </div>
      <small className={tone === 'green' ? 'text-green' : tone === 'amber' ? 'text-amber' : tone === 'red' ? 'text-red' : ''}>{foot}</small>
    </div>
  ); 
}

export default function DashboardLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isHistoryResult = location.pathname.startsWith("/screening/") &&
    new URLSearchParams(location.search).get("from") === "history";

  useEffect(() => {
    mockDatabase.initialize();
    const list = mockDatabase.getAllCases();
    const pending = list.filter(c => c.status === "Pending").length;
    setPendingCount(pending);
  }, [location.pathname]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "New Screening", path: "/dashboard/screening", icon: FilePlus },
    { name: "Case History", path: "/dashboard/history", icon: History },
    { name: "Pending Cases", path: "/dashboard/pending", icon: Clock, badge: pendingCount },
    { name: "Reports", path: "/dashboard/reports", icon: BarChart2 },
    { name: "Notifications", path: "/dashboard/notifications", icon: Bell, badge: 5 },
    { name: "Profile & Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="app">
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isSidebarOpen}
        onClick={() => setIsSidebarOpen((open) => !open)}
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {isSidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`sidebar${isSidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <ShieldCheck size={28} />
          <span>Officer Panel</span>
        </div>
        <nav>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (location.pathname === "/dashboard" && item.path === "/dashboard") ||
              (item.path === "/dashboard/history" && isHistoryResult) ||
              (item.path === "/dashboard/screening" && location.pathname.startsWith("/screening") && !isHistoryResult) ||
              (item.path === "/dashboard/pending" && location.pathname.startsWith("/cases"));

            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={isActive ? "active" : ""}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
                {item.badge > 0 && <span className="badge">{item.badge}</span>}
              </Link>
            );
          })}
          <button className="logout" onClick={() => { setIsSidebarOpen(false); logout(); }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
