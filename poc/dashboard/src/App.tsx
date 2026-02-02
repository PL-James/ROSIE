import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  CheckSquare,
  TestTube,
  ScrollText,
  Rocket,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { DashboardPage } from './pages/Dashboard';
import { TraceGraphPage } from './pages/TraceGraph';
import { ApprovalsPage } from './pages/Approvals';
import { EvidencePage } from './pages/Evidence';
import { AuditLogPage } from './pages/AuditLog';
import { ReleasePage } from './pages/Release';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/graph', label: 'Trace Graph', icon: GitBranch },
  { path: '/approvals', label: 'Approvals', icon: CheckSquare },
  { path: '/evidence', label: 'Evidence', icon: TestTube },
  { path: '/audit', label: 'Audit Log', icon: ScrollText },
  { path: '/release', label: 'Release', icon: Rocket },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-rosie-surface border-r border-rosie-border z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-rosie-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rosie-cyan/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-rosie-cyan" />
            </div>
            <div>
              <span className="font-bold text-rosie-text">ROSIE</span>
              <span className="text-rosie-text-muted text-xs ml-2">Demo SoR</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-rosie-surface-light rounded">
            <X size={20} className="text-rosie-text-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-rosie-cyan/10 text-rosie-cyan'
                    : 'text-rosie-text-muted hover:bg-rosie-surface-light hover:text-rosie-text'
                  }
                `}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-rosie-border">
          <div className="text-xs text-rosie-text-muted">
            <p>ROSIE Framework Demo</p>
            <p className="mt-1">Repo-First GxP Compliance</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-rosie-bg flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-rosie-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-rosie-surface-light rounded"
          >
            <Menu size={20} className="text-rosie-text" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rosie-cyan/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-rosie-cyan" />
            </div>
            <span className="font-bold text-rosie-text">ROSIE</span>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/graph" element={<TraceGraphPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/release" element={<ReleasePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
