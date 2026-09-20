# 📊 GanttFlow - Division & Master Timeline Tracker

GanttFlow is an interactive, enterprise-grade timeline management web application built using **Next.js 16 (App Router)**, **TypeScript**, **React 19**, and **MongoDB Atlas**. It is designed for multi-disciplinary teams across Division 1, Division 2, Division 3, and Division 4 to track project milestones, manage task dependencies, perform drag-and-drop schedule adjustments, and seamlessly import/export project timelines via CSV.

---

## 📑 Table of Contents

1. [Architectural Overview & Technical Stack](#-architectural-overview--technical-stack)
2. [Project Directory & Blueprint](#-project-directory--blueprint)
3. [Environment Configuration & Setup](#-environment-configuration--setup)
4. [Exhaustive Codebase & Snippet Reference](#-exhaustive-codebase--snippet-reference)
   - [`src/lib/mongodb.ts`](#1-srclibmongodbts---database-connection-management)
   - [`src/app/api/tasks/route.ts`](#2-srcappapitasksroutets---backend-rest-api)
   - [`src/app/layout.tsx`](#3-srcapplayouttsx---root-layout--metadata)
   - [`src/app/page.tsx`](#4-srcapppagetsx---main-dashboard--state-orchestrator)
   - [`src/components/GanttChartWrapper.tsx`](#5-srccomponentsganttchartwrappertsx---interactive-gantt--inline-editor)
   - [`src/components/Navbar.tsx`](#6-srccomponentsnavbartsx---navigation--actions-bar)
   - [`src/components/Modals.tsx`](#7-srccomponentsmodalstsx---csv-import--quick-add-modals)
   - [`src/app/globals.css`](#8-srcappglobalscss---design-system--gantt-overrides)
5. [Architectural Choices & Technical Tradeoffs](#-architectural-choices--technical-tradeoffs)
6. [Data Schema & CSV Interchange Format](#-data-schema--csv-interchange-format)

---

## 🏗️ Architectural Overview & Technical Stack

The application uses a hybrid architecture combining serverless API endpoints with interactive client-side state management:

- **Framework**: [Next.js 16.3.0](https://nextjs.org/) (App Router paradigm) with React 19.2.8.
- **Language**: TypeScript 5 for strict end-to-end type safety.
- **Database Layer**: MongoDB 7.5.0 with cached connection pooling for serverless execution environments.
- **Timeline Engine**: [`gantt-task-react`](https://github.com/MaTeMaT6/gantt-task-react) dynamically loaded on the client side with custom SVG styling and theme overrides.
- **Data Parsing & Interchange**: [PapaParse](https://www.papaparse.com/) for multi-format CSV parsing and unparsing.
- **Iconography & Styling**: Lucide React icons, Google Fonts (*Plus Jakarta Sans* & *JetBrains Mono*), Vanilla CSS custom properties, and glassmorphic UI components.

---

## 📁 Project Directory & Blueprint

```
Gantt chart/
├── data/
│   └── tasks.csv                   # Seed dataset loaded if MongoDB collection is empty
├── public/
│   └── favicon.ico                 # Application favicon icon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       └── route.ts        # REST API endpoints (GET & POST) for database sync
│   │   ├── globals.css             # Design tokens, glassmorphism, & Gantt dark theme overrides
│   │   ├── layout.tsx              # Root HTML wrapper and metadata declaration
│   │   ├── page.module.css         # Page-specific styling utilities
│   │   └── page.tsx                # Main dashboard page container & state orchestrator
│   ├── components/
│   │   ├── GanttChartWrapper.tsx   # Interactive SVG Gantt chart & inline editable table
│   │   ├── Modals.tsx              # CSV Import/Upload & Quick Task Creation modals
│   │   └── Navbar.tsx              # Brand header, division tabs, & action bar
│   └── lib/
│       └── mongodb.ts              # MongoDB Atlas connection client with global pooling
├── .env                            # Environment variables (MongoDB connection URI & DB name)
├── AGENTS.md                       # Repository rules and Next.js agent guidelines
├── eslint.config.mjs               # ESLint configuration rules
├── next.config.ts                  # Next.js compiler & runtime configurations
├── package.json                    # Project dependencies and script definitions
└── tsconfig.json                   # TypeScript compiler options
```

---

## ⚙️ Environment Configuration & Setup

### 1. Environment Variables
Create or verify the `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=mandatory
MONGODB_DB=gantt_db
```

### 2. Dependency Installation
Due to React 19 peer dependency constraints in modern packages like `gantt-task-react`, install dependencies using `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

### 3. Development Server
Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔍 Exhaustive Codebase & Snippet Reference

---

### 1. `src/lib/mongodb.ts` - Database Connection Management

Manages MongoDB Atlas database connections using connection pooling across serverless API invocations.

#### File Path: [`src/lib/mongodb.ts`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/lib/mongodb.ts)

#### Code Snippet & Detailed Breakdown:

```typescript
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'gantt_db';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    throw new Error('Database connection failed');
  }
}
```

#### Concepts & Choices:
- **`cachedClient` & `cachedDb`**: Module-level variables preserving active client connections across Next.js Hot Module Reloads (HMR) and lambda invocations.
- **`connectToDatabase()`**: Checks if `cachedClient` and `cachedDb` exist. If present, returns them immediately, avoiding connection exhaustion in serverless environments.

---

### 2. `src/app/api/tasks/route.ts` - Backend REST API

Handles data retrieval, initial seed loading from local CSV, parsing incoming CSV strings or JSON arrays, and mutating MongoDB Atlas documents.

#### File Path: [`src/app/api/tasks/route.ts`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/app/api/tasks/route.ts)

#### Code Snippet 2.1: Data Schema Definition (`TaskItem`)

```typescript
export interface TaskItem {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  progress: number;
  department: 'cs' | 'mechanical' | 'electrical' | 'management';
  type: 'task' | 'project';
  dependencies?: string;
  project?: string;
}
```

#### Code Snippet 2.2: Disk CSV Seed Loader (`loadDiskCsvTasks`)

```typescript
function loadDiskCsvTasks(): TaskItem[] {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'tasks.csv');
    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const parsed = Papa.parse<TaskItem>(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      if (parsed.data && parsed.data.length > 0) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn('Failed to read data/tasks.csv from disk:', err);
  }
  return [];
}
```

#### Code Snippet 2.3: `GET /api/tasks` Route Handler

```typescript
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<TaskItem>('tasks');
    
    let tasks = await collection.find({}).toArray();

    // Seed ONLY ONCE if MongoDB collection is completely empty
    if (tasks.length === 0) {
      const initialCsvTasks = loadDiskCsvTasks();
      if (initialCsvTasks.length > 0) {
        await collection.insertMany(initialCsvTasks as any);
        tasks = await collection.find({}).toArray();
      }
    }

    // Clean up MongoDB _id field for frontend rendering
    const formattedTasks = tasks.map(({ _id, ...rest }: any) => rest as TaskItem);

    return NextResponse.json({
      tasks: formattedTasks,
      source: 'mongodb',
    });
  } catch (err: any) {
    console.error('[GET /api/tasks Error]:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks from MongoDB Atlas',
        details: err?.message || 'Database error',
      },
      { status: 500 }
    );
  }
}
```

#### Code Snippet 2.4: `POST /api/tasks` Route Handler

```typescript
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('tasks');

    let tasksToSave: TaskItem[] = [];

    if (typeof body.csv === 'string') {
      const parsed = Papa.parse<TaskItem>(body.csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (parsed.errors && parsed.errors.length > 0) {
        return NextResponse.json(
          { error: 'Failed to parse CSV string', details: parsed.errors },
          { status: 400 }
        );
      }
      tasksToSave = parsed.data;
    } else if (Array.isArray(body.tasks)) {
      tasksToSave = body.tasks;
    } else {
      return NextResponse.json(
        { error: 'Invalid payload structure. Provide a "tasks" array or "csv" string.' },
        { status: 400 }
      );
    }

    // Direct database mutation: MongoDB Atlas is the single source of truth
    await collection.deleteMany({});
    if (tasksToSave.length > 0) {
      await collection.insertMany(tasksToSave);
    }

    return NextResponse.json({
      success: true,
      message: 'Tasks updated directly in MongoDB Atlas',
      count: tasksToSave.length,
    });
  } catch (err: any) {
    console.error('[POST /api/tasks Error]:', err);
    return NextResponse.json(
      { error: 'Failed to save tasks to MongoDB Atlas', details: err?.message || 'Database transaction error' },
      { status: 500 }
    );
  }
}
```

---

### 3. `src/app/layout.tsx` - Root Layout & Metadata

Defines standard HTML tags, metadata, and loads the global CSS bundle.

#### File Path: [`src/app/layout.tsx`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/app/layout.tsx)

#### Code Snippet:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GanttFlow - Department & Master Timeline Tracker",
  description: "Interactive timeline tracking system with department views (CS, Mechanical, Electrical, Management), dual-mode master view, and CSV import/export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

### 4. `src/app/page.tsx` - Main Dashboard & State Orchestrator

Root client component that integrates navigation, interactive components, API calls, and modals.

#### File Path: [`src/app/page.tsx`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/app/page.tsx)

#### Code Snippet 4.1: State Hooks & Initializer

```tsx
const [tasks, setTasks] = useState<TaskItem[]>([]);
const [currentView, setCurrentView] = useState<ViewType>('master');
const [masterMode, setMasterMode] = useState<'flat' | 'grouped'>('flat');

const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [notification, setNotification] = useState<string | null>(null);

const showToast = (msg: string) => {
  setNotification(msg);
  setTimeout(() => setNotification(null), 3000);
};
```

#### Code Snippet 4.2: Data Persistence & API Sync Handlers

```tsx
// Fetch initial tasks from MongoDB Atlas
const fetchTasks = async () => {
  try {
    setLoading(true);
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if (data.tasks) {
      setTasks(data.tasks);
    }
  } catch (err) {
    console.error('Failed to load tasks', err);
    showToast('Failed to connect to API backend');
  } finally {
    setLoading(false);
  }
};

// Explicit Save function to sync state to MongoDB Atlas
const saveTasksToDatabase = async (tasksToSave: TaskItem[]) => {
  try {
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: tasksToSave }),
    });
    if (res.ok) {
      showToast('Saved changes to MongoDB Atlas!');
    } else {
      showToast('Failed to save to database');
    }
  } catch (err) {
    console.error('Error saving tasks', err);
    showToast('Error syncing changes with database');
  } finally {
    setSaving(false);
  }
};

// Optimistic Local State Update (avoids UI render lag during drag operations)
const handleLocalTaskUpdate = (updatedTasks: TaskItem[]) => {
  setTasks(updatedTasks);
};

const handleManualSave = () => {
  saveTasksToDatabase(tasks);
};
```

#### Code Snippet 4.3: Browser CSV Export Handler (`handleExportCsv`)

```tsx
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
```

---

### 5. `src/components/GanttChartWrapper.tsx` - Interactive Gantt & Inline Editor

Renders the interactive SVG timeline chart alongside an inline editing table.

#### File Path: [`src/components/GanttChartWrapper.tsx`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/components/GanttChartWrapper.tsx)

#### Code Snippet 5.1: Dynamic Component Import & Department Color Palette

```tsx
const Gantt = dynamic(
  () => import('gantt-task-react').then((mod) => mod.Gantt),
  { ssr: false }
);

const getDeptColorPalette = (dept: string) => {
  switch (dept) {
    case 'cs': 
      return { bg: '#4143c5', progress: '#6366f1', border: '#818cf8' };
    case 'mechanical': 
      return { bg: '#b45309', progress: '#f59e0b', border: '#fbbf24' };
    case 'electrical': 
      return { bg: '#047857', progress: '#10b981', border: '#34d399' };
    case 'management': 
      return { bg: '#6b21a8', progress: '#a855f7', border: '#c084fc' };
    default: 
      return { bg: '#1d4ed8', progress: '#3b82f6', border: '#60a5fa' };
  }
};
```

#### Code Snippet 5.2: Data Filtering & `GanttTask` Data Mapping

```tsx
const filteredTasks = tasks.filter((t) => {
  if (currentView === 'master') return true;
  return t.department === currentView;
});

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
```

#### Code Snippet 5.3: Drag & Drop Handlers (`handleDateChange`, `handleProgressChange`)

```tsx
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

const handleProgressChange = (task: GanttTask) => {
  const updated = tasks.map((t) => {
    if (t.id === task.id) {
      return { ...t, progress: Math.round(task.progress) };
    }
    return t;
  });
  onTaskUpdate(updated);
};
```

---

### 6. `src/components/Navbar.tsx` - Navigation & Actions Bar

Renders top navigation tabs, department filters, and action triggers.

#### File Path: [`src/components/Navbar.tsx`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/components/Navbar.tsx)

#### Code Snippet: View Tabs Configuration & Render

```tsx
export type ViewType = 'master' | 'cs' | 'mechanical' | 'electrical' | 'management';

const views: { id: ViewType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'master', label: 'Master View', icon: <Layers size={18} />, color: '#6366f1' },
  { id: 'cs', label: 'CS', icon: <Code2 size={18} />, color: '#818cf8' },
  { id: 'mechanical', label: 'Mechanical', icon: <Wrench size={18} />, color: '#fbbf24' },
  { id: 'electrical', label: 'Electrical', icon: <Zap size={18} />, color: '#34d399' },
  { id: 'management', label: 'Management', icon: <Briefcase size={18} />, color: '#c084fc' },
];
```

---

### 7. `src/components/Modals.tsx` - CSV Import & Quick Add Modals

Contains the CSV Import dropzone and the Quick Task Add dialog forms.

#### File Path: [`src/components/Modals.tsx`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/components/Modals.tsx)

#### Code Snippet 7.1: `CSVModal` FileReader Handler

```tsx
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
```

#### Code Snippet 7.2: `QuickAddModal` Form Submission

```tsx
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
```

---

### 8. `src/app/globals.css` - Design System & Gantt Dark Theme Overrides

CSS rules for design tokens, glassmorphism containers, custom scrollbars, and Gantt chart dark mode styling.

#### File Path: [`src/app/globals.css`](file:///c:/Users/Dheeraj%20Sutram/Documents/projects/Sammard_coz_im_Bored/Gantt%20chart/src/app/globals.css)

#### Code Snippet 8.1: Design Tokens (`:root`)

```css
:root {
  --bg-main: #090d16;
  --bg-card: rgba(15, 21, 35, 0.75);
  --bg-card-hover: rgba(22, 30, 48, 0.85);
  --bg-input: #0f172a;
  --border-color: rgba(255, 255, 255, 0.08);

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --accent-cs: #6366f1;
  --accent-mech: #f59e0b;
  --accent-elec: #10b981;
  --accent-mgmt: #a855f7;

  --font-main: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

#### Code Snippet 8.2: SVG Dark Mode Overrides (`.dark-gantt-wrapper`)

```css
/* Preserve Task Bar Colors and apply Pill Shapes + Drop Shadows */
.dark-gantt-wrapper g[class*="task"] rect,
.dark-gantt-wrapper g[class*="project"] rect {
  rx: 10px !important;
  ry: 10px !important;
  stroke: rgba(255, 255, 255, 0.25) !important;
  stroke-width: 1px !important;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

/* High visibility text labels inside SVG task bars */
.dark-gantt-wrapper g[class*="task"] text,
.dark-gantt-wrapper g[class*="project"] text {
  fill: #ffffff !important;
  font-weight: 600 !important;
  font-size: 0.82rem !important;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}
```

---

## ⚖️ Architectural Choices & Technical Tradeoffs

| Feature / Pattern | Choice | Alternative Considered | Rationale & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Database Syncing** | Full Collection Overwrite (`deleteMany` + `insertMany`) | Incremental Delta Updates (`updateOne` / `push`) | **Rationale**: Simplifies array order synchronization and bulk CSV imports.<br>**Tradeoff**: Requires careful transaction control to prevent data loss during concurrent multi-user edits. |
| **State Management** | Optimistic Local React State | Server-side Auto-Save on every keypress/drag | **Rationale**: Eliminates lag while dragging tasks on the timeline.<br>**Tradeoff**: User must click "Save" or complete a modal action to persist state to MongoDB Atlas. |
| **Gantt Loading** | Client-Side Dynamic Import (`ssr: false`) | SSR Static SVG Rendering | **Rationale**: Prevents Next.js HTML hydration mismatch errors caused by client-side browser DOM measurements.<br>**Tradeoff**: Brief initial skeleton render state while dynamic bundle loads. |
| **Data Interchange** | Dynamic CSV Parsing via PapaParse | Fixed JSON REST Payloads only | **Rationale**: Allows users to export and edit timelines directly in external tools like Microsoft Excel or Google Sheets. |

---

## 📋 Data Schema & CSV Interchange Format

When importing or exporting CSV files, rows must follow this header format:

```csv
id,name,start,end,progress,department,type,dependencies,project
task-1,Architecture & UI Design,2026-08-01,2026-08-10,100,cs,project,,cs-proj
task-2,Database Schema & Migrations,2026-08-03,2026-08-12,85,cs,task,task-1,cs-proj
task-3,Mechanical CAD Chassis Design,2026-08-05,2026-08-18,60,mechanical,task,,mech-proj
task-4,PCB Circuit Route & Soldering,2026-08-10,2026-08-22,40,electrical,task,,elec-proj
task-5,Sprint Milestone Review,2026-08-15,2026-08-25,20,management,task,,mgmt-proj
```

---
*Documentation updated for GanttFlow codebase.*
