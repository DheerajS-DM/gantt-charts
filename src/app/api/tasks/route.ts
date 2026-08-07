import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
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
      {
        error: 'Failed to save tasks to MongoDB Atlas',
        details: err?.message || 'Database transaction error',
      },
      { status: 500 }
    );
  }
}
