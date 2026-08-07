'use client';

import React from 'react';
import { 
  Layers, 
  Code2, 
  Wrench, 
  Zap, 
  Briefcase, 
  Upload, 
  Download, 
  RotateCcw,
  Plus,
  Save
} from 'lucide-react';

export type ViewType = 'master' | 'cs' | 'mechanical' | 'electrical' | 'management';

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onUploadCsvClick: () => void;
  onExportCsvClick: () => void;
  onResetClick: () => void;
  onSaveClick: () => void;
  onAddTaskClick: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onUploadCsvClick,
  onExportCsvClick,
  onResetClick,
  onSaveClick,
  onAddTaskClick,
  isSaving = false,
}) => {
  const views: { id: ViewType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'master', label: 'Master View', icon: <Layers size={18} />, color: '#6366f1' },
    { id: 'cs', label: 'CS', icon: <Code2 size={18} />, color: '#818cf8' },
    { id: 'mechanical', label: 'Mechanical', icon: <Wrench size={18} />, color: '#fbbf24' },
    { id: 'electrical', label: 'Electrical', icon: <Zap size={18} />, color: '#34d399' },
    { id: 'management', label: 'Management', icon: <Briefcase size={18} />, color: '#c084fc' },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      marginBottom: '24px',
      gap: '16px',
      flexWrap: 'wrap',
    }} className="glass-panel">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
        }}>
          <Layers size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GanttFlow
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive Department Timeline Tracker</p>
        </div>
      </div>

      {/* View Tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(11, 15, 25, 0.6)',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        {views.map((v) => {
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 12px ${v.color}40` : 'none',
                outline: isActive ? `1px solid ${v.color}60` : 'none',
              }}
            >
              <span style={{ color: isActive ? v.color : 'var(--text-muted)' }}>{v.icon}</span>
              {v.label}
            </button>
          );
        })}
      </nav>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onAddTaskClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} /> Quick Add Task
        </button>

        <button
          onClick={onUploadCsvClick}
          title="Upload CSV File"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={16} /> Import CSV
        </button>

        <button
          onClick={onExportCsvClick}
          title="Export CSV File"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Download size={16} /> Export
        </button>

        <button
          onClick={onSaveClick}
          disabled={isSaving}
          title="Save changes to MongoDB Atlas"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            color: '#10b981',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <Save size={16} />
        </button>

        <button
          onClick={onResetClick}
          title="Refresh tasks from MongoDB Atlas"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-input)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
};
