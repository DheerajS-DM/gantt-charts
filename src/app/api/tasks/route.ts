import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Papa from 'papaparse';

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

export function getTaskFingerprint(task: TaskItem): string {
  return JSON.stringify({
    id: task.id,
    name: task.name,
    start: task.start,
    end: task.end,
    progress: task.progress,
    department: task.department,
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
      const fingerprint = getTaskFingerprint(rest as TaskItem);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        formattedTasks.push(rest as TaskItem);
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
      const fingerprint = getTaskFingerprint(t);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        uniqueTasksToSave.push(t);
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
