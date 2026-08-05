'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Navbar, ViewType } from '@/components/Navbar';
import { GanttChartWrapper } from '@/components/GanttChartWrapper';
import { CSVModal, QuickAddModal } from '@/components/Modals';
import { TaskItem } from '@/app/api/tasks/route';

export default function Home() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [rawCsv, setRawCsv] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewType>('master');
  const [masterMode, setMasterMode] = useState<'flat' | 'grouped'>('flat');
  
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch initial tasks from backend CSV API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        setRawCsv(data.rawCsv || '');
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
      showToast('Failed to connect to CSV API backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Save updated tasks array to backend CSV API
  const saveTasks = async (updatedTasks: TaskItem[]) => {
    setTasks(updatedTasks);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
      if (res.ok) {
        showToast('Saved changes to backend CSV');
      }
    } catch (err) {
      console.error('Error saving tasks', err);
      showToast('Error syncing changes with CSV storage');
    }
  };

  // Import raw CSV string
  const handleImportCsv = async (csvString: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvString }),
      });
      if (res.ok) {
        showToast('Successfully imported and saved CSV!');
        await fetchTasks();
      }
    } catch (err) {
      console.error('Import error', err);
      showToast('Failed to import CSV');
    }
  };

  // Export current tasks to downloadable CSV
  const handleExportCsv = () => {
    const csvStr = Papa.unparse(tasks);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gantt_tasks_${currentView}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file downloaded');
  };

  // Delete task by ID
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
  };

  // Add new task
  const handleAddTask = (newTask: TaskItem) => {
    const updated = [...tasks, newTask];
    saveTasks(updated);
    showToast(`Added new task "${newTask.name}"`);
  };

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid var(--accent-cs)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          fontSize: '0.875rem',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}>
          ✨ {notification}
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onUploadCsvClick={() => setIsCsvModalOpen(true)}
        onExportCsvClick={handleExportCsv}
        onResetClick={fetchTasks}
        onAddTaskClick={() => setIsAddTaskModalOpen(true)}
      />

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Gantt timeline data...
        </div>
      ) : (
        <GanttChartWrapper
          tasks={tasks}
          currentView={currentView}
          masterMode={masterMode}
          onMasterModeChange={(mode) => setMasterMode(mode)}
          onTaskUpdate={saveTasks}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Modals */}
      <CSVModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportCsv={handleImportCsv}
      />

      <QuickAddModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />
    </main>
  );
}
