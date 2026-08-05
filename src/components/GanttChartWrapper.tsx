'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ViewMode, Task as GanttTask } from 'gantt-task-react';
import { TaskItem } from '@/app/api/tasks/route';
import { Calendar, LayoutList, Sliders, Trash2, Edit2, Check, X } from 'lucide-react';

const Gantt = dynamic(
  () => import('gantt-task-react').then((mod) => mod.Gantt),
  { ssr: false }
);

interface GanttChartWrapperProps {
  tasks: TaskItem[];
  currentView: string;
  masterMode: 'flat' | 'grouped';
  onMasterModeChange: (mode: 'flat' | 'grouped') => void;
  onTaskUpdate: (updatedTasks: TaskItem[]) => void;
  onDeleteTask: (taskId: string) => void;
}

export const GanttChartWrapper: React.FC<GanttChartWrapperProps> = ({
  tasks,
  currentView,
  masterMode,
  onMasterModeChange,
  onTaskUpdate,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TaskItem>>({});

  // Vibrant department color palette for high visibility on dark background
  const getDeptColorPalette = (dept: string) => {
    switch (dept) {
      case 'cs': 
        return {
          bg: '#4143c5',
          progress: '#6366f1',
          border: '#818cf8',
        };
      case 'mechanical': 
        return {
          bg: '#b45309',
          progress: '#f59e0b',
          border: '#fbbf24',
        };
      case 'electrical': 
        return {
          bg: '#047857',
          progress: '#10b981',
          border: '#34d399',
        };
      case 'management': 
        return {
          bg: '#6b21a8',
          progress: '#a855f7',
          border: '#c084fc',
        };
      default: 
        return {
          bg: '#1d4ed8',
          progress: '#3b82f6',
          border: '#60a5fa',
        };
    }
  };

  // Filter tasks based on current view tab
  const filteredTasks = tasks.filter((t) => {
    if (currentView === 'master') return true;
    return t.department === currentView;
  });

  // Transform TaskItem to gantt-task-react format with soft non-boxy styling
  const ganttTasks: GanttTask[] = filteredTasks
    .filter((t) => {
      // In master flat mode, omit project headers to show only individual tasks
      if (currentView === 'master' && masterMode === 'flat' && t.type === 'project') {
        return false;
      }
      return true;
    })
    .map((t) => {
      const palette = getDeptColorPalette(t.department);
      const isProject = t.type === 'project';

      return {
        id: t.id,
        name: t.name,
        start: new Date(t.start),
        end: new Date(t.end),
        progress: t.progress || 0,
        type: isProject ? 'project' : 'task',
        project: masterMode === 'grouped' ? t.project : undefined,
        dependencies: t.dependencies ? t.dependencies.split(',').map((d) => d.trim()) : [],
        styles: {
          backgroundColor: isProject ? 'rgba(168, 85, 247, 0.25)' : palette.bg,
          progressColor: isProject ? 'rgba(192, 132, 252, 0.75)' : palette.progress,
          progressSelectedColor: 'rgba(56, 189, 248, 0.85)',
          backgroundSelectedColor: isProject ? 'rgba(168, 85, 247, 0.4)' : palette.bg,
        },
      };
    });

  // Handle Drag and Drop date changes
  const handleDateChange = (task: GanttTask) => {
    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          start: task.start.toISOString().split('T')[0],
          end: task.end.toISOString().split('T')[0],
        };
      }
      return t;
    });
    onTaskUpdate(updated);
  };

  // Handle Drag and Drop progress change
  const handleProgressChange = (task: GanttTask) => {
    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return { ...t, progress: Math.round(task.progress) };
      }
      return t;
    });
    onTaskUpdate(updated);
  };

  // Inline edit handlers
  const startEditing = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditForm({ ...task });
  };

  const saveEditing = () => {
    if (!editingTaskId) return;
    const updated = tasks.map((t) => {
      if (t.id === editingTaskId) {
        return { ...t, ...editForm } as TaskItem;
      }
      return t;
    });
    onTaskUpdate(updated);
    setEditingTaskId(null);
    setEditForm({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View & Zoom Controls Bar */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left Controls */}
        {currentView === 'master' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Master Mode:
            </span>
            <div style={{
              display: 'flex',
              background: 'rgba(11, 15, 25, 0.6)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => onMasterModeChange('flat')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: masterMode === 'flat' ? 'var(--accent-cs)' : 'transparent',
                  color: masterMode === 'flat' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Individual Tasks
              </button>
              <button
                onClick={() => onMasterModeChange('grouped')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: masterMode === 'grouped' ? 'var(--accent-cs)' : 'transparent',
                  color: masterMode === 'grouped' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Grouped Sub-sections
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`dept-badge ${currentView}`}>
              {currentView.toUpperCase()} DEPARTMENT
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ({filteredTasks.length} items)
            </span>
          </div>
        )}

        {/* Right Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '4px' }}>Zoom:</span>
          {(['Day', 'Week', 'Month'] as const).map((mode) => {
            const enumMode = ViewMode[mode];
            const isActive = viewMode === enumMode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(enumMode)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg-input)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth Scrollable Gantt Chart Container */}
      <div className="glass-panel smooth-scroll dark-gantt-wrapper" style={{ padding: '20px', minHeight: '350px' }}>
        {ganttTasks.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tasks found for this view. Upload a CSV or click "Quick Add Task" to get started!
          </div>
        ) : (
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
            listCellWidth="220px"
            columnWidth={viewMode === ViewMode.Month ? 250 : viewMode === ViewMode.Week ? 120 : 65}
            ganttHeight={320}
            barCornerRadius={10}
            handleWidth={8}
          />
        )}
      </div>

      {/* Direct Inline Data Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <LayoutList size={18} color="var(--accent-cs)" />
            Direct Inline Task Editor
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Instant inline updates saved directly to CSV backend.
          </span>
        </div>

        <div className="smooth-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Task Name</th>
                <th style={{ padding: '10px 12px' }}>Department</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Start Date</th>
                <th style={{ padding: '10px 12px' }}>End Date</th>
                <th style={{ padding: '10px 12px' }}>Progress</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const isEditing = editingTaskId === t.id;

                if (isEditing) {
                  return (
                    <tr key={t.id} style={{ background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={editForm.department || 'cs'}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value as any })}
                          style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        >
                          <option value="cs">CS</option>
                          <option value="mechanical">Mechanical</option>
                          <option value="electrical">Electrical</option>
                          <option value="management">Management</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={editForm.type || 'task'}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                          style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        >
                          <option value="task">Task</option>
                          <option value="project">Project Header</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="date"
                          value={editForm.start || ''}
                          onChange={(e) => setEditForm({ ...editForm, start: e.target.value })}
                          style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="date"
                          value={editForm.end || ''}
                          onChange={(e) => setEditForm({ ...editForm, end: e.target.value })}
                          style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.progress ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                          style={{ width: '60px', padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        />%
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button onClick={saveEditing} style={{ border: 'none', background: '#10b981', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' }}>
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingTaskId(null)} style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px', fontWeight: t.type === 'project' ? 700 : 500 }}>
                      {t.name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`dept-badge ${t.department}`}>
                        {t.department}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {t.type}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.start}</td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{t.end}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '75px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${t.progress}%`,
                            height: '100%',
                            background: t.department === 'cs' ? '#6366f1' : t.department === 'mechanical' ? '#f59e0b' : t.department === 'electrical' ? '#10b981' : '#a855f7'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{t.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => startEditing(t)}
                        title="Inline Edit"
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', padding: '6px', cursor: 'pointer', marginRight: '4px' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteTask(t.id)}
                        title="Delete Task"
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', padding: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
