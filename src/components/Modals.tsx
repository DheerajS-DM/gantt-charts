'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { TaskItem } from '@/app/api/tasks/route';
import { X, Upload, Plus, FileText } from 'lucide-react';

interface CSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCsv: (csvString: string) => void;
}

export const CSVModal: React.FC<CSVModalProps> = ({ isOpen, onClose, onImportCsv }) => {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvText.trim()) {
      setError('Please select a CSV file or paste valid CSV content.');
      return;
    }

    const parsed = Papa.parse<TaskItem>(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      setError(`CSV Parsing Error: ${parsed.errors[0].message}`);
      return;
    }

    onImportCsv(csvText);
    setError(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--accent-cs)" />
            Import / Paste CSV File
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        {/* File Dropzone */}
        <label style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px',
          border: '2px dashed var(--border-color)',
          borderRadius: '12px',
          background: 'rgba(19, 26, 41, 0.6)',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.2s ease',
        }}>
          <Upload size={28} color="var(--accent-cs)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to browse CSV file</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports id, name, start, end, progress, department, type</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {/* Manual Raw CSV Textarea */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Or Paste CSV Text directly:
          </label>
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="id,name,start,end,progress,department,type&#10;task-1,Design UI,2026-08-01,2026-08-10,50,cs,task"
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleImport} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent-cs)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Import & Sync
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<'cs' | 'mechanical' | 'electrical' | 'management'>('cs');
  const [type, setType] = useState<'task' | 'project'>('task');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      name,
      department,
      type,
      start,
      end,
      progress,
    };

    onAddTask(newTask);
    setName('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="var(--accent-cs)" />
            Quick Add Task
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Task Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Firmware Integration Test"
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              >
                <option value="cs">CS</option>
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              >
                <option value="task">Individual Task</option>
                <option value="project">Project Sub-Section Header</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</label>
              <input
                type="date"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</label>
              <input
                type="date"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Progress ({progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cs)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent-cs)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
