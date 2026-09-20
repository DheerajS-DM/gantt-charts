import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Papa from 'papaparse';

export interface TaskItem {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  progress: number;
  department: 'division1' | 'division2' | 'division3' | 'division4' | string;
  type: 'task' | 'project';
  dependencies?: string;
  project?: string;
}

export function normalizeDepartment(dept?: string): 'division1' | 'division2' | 'division3' | 'division4' {
  const d = (dept || '').toLowerCase().trim();
  if (d === 'cs' || d === 'div1' || d === 'division1' || d === 'division 1' || d === 'division_1') return 'division1';
  if (d === 'mechanical' || d === 'mech' || d === 'div2' || d === 'division2' || d === 'division 2' || d === 'division_2') return 'division2';
  if (d === 'electrical' || d === 'elec' || d === 'div3' || d === 'division3' || d === 'division 3' || d === 'division_3') return 'division3';
  if (d === 'management' || d === 'mgmt' || d === 'div4' || d === 'division4' || d === 'division 4' || d === 'division_4') return 'division4';
  return 'division1';
}

export function getTaskFingerprint(task: TaskItem): string {
  return JSON.stringify({
    id: task.id,
    name: task.name,
    start: task.start,
    end: task.end,
    progress: task.progress,
    department: normalizeDepartment(task.department),
    type: task.type,
    dependencies: task.dependencies || '',
    project: task.project || '',
  });
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<TaskItem>('tasks');
    
    const tasks = await collection.find({}).toArray();

    // Clean up MongoDB _id field for frontend rendering and deduplicate
    const seen = new Set<string>();
    const formattedTasks: TaskItem[] = [];
    
    for (const t of tasks) {
      const { _id, ...rest } = t as any;
      const normalizedTask: TaskItem = {
        ...(rest as TaskItem),
        department: normalizeDepartment((rest as TaskItem).department),
      };
      const fingerprint = getTaskFingerprint(normalizedTask);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        formattedTasks.push(normalizedTask);
      }
    }

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

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
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

    if (!Array.isArray(tasksToSave)) {
      return NextResponse.json(
        { error: 'Tasks payload must resolve to an array.' },
        { status: 400 }
      );
    }

    // Direct database mutation: MongoDB Atlas is the single source of truth after fingerprint-based deduplication
    const seen = new Set<string>();
    const uniqueTasksToSave: TaskItem[] = [];
    for (const t of tasksToSave) {
      const normalizedTask: TaskItem = {
        ...t,
        department: normalizeDepartment(t.department),
      };
      const fingerprint = getTaskFingerprint(normalizedTask);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        uniqueTasksToSave.push(normalizedTask);
      }
    }

    await collection.deleteMany({});
    if (uniqueTasksToSave.length > 0) {
      await collection.insertMany(uniqueTasksToSave);
    }

    return NextResponse.json({
      success: true,
      message: 'Tasks updated directly in MongoDB Atlas',
      count: uniqueTasksToSave.length,
    });
  } catch (err: any) {
    console.error('[POST /api/tasks Error]:', err);
    return NextResponse.json(
      {
        error: 'Failed to save tasks to MongoDB Atlas',
        details: err?.message || 'Database transaction error',
      },
      { status: 500 }
    );
  }
}
