import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  FilePlus, 
  History, 
  Clock, 
  BarChart2, 
  Bell, 
  Settings, 
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Calendar
} from "lucide-react";

export function Header({ title, subtitle, caseNo }) {
  const { user } = useAuth();
  
  return (
    <header className="topbar">
      <div>
        <h1>BORDER SCREENING SYSTEM</h1>
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
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "New Screening", path: "/dashboard/screening", icon: FilePlus },
    { name: "Case History", path: "/dashboard/history", icon: History },
    { name: "Pending Cases", path: "/dashboard/pending", icon: Clock, badge: 12 },
    { name: "Reports", path: "/dashboard/reports", icon: BarChart2 },
    { name: "Notifications", path: "/dashboard/notifications", icon: Bell, badge: 5 },
    { name: "Profile & Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ShieldCheck size={28} />
          <span>Officer Panel</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={location.pathname === item.path || (location.pathname === "/dashboard" && item.path === "/dashboard") ? "active" : ""}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </Link>
          ))}
          <button className="logout" onClick={logout}>
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
