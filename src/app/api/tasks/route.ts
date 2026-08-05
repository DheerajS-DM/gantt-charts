import { NextRequest, NextResponse } from 'next/server';
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

const DEFAULT_CSV = `id,name,start,end,progress,department,type,dependencies
project-cs,CS Department,2026-08-01,2026-08-25,50,cs,project,
task-cs-1,Backend API Setup,2026-08-01,2026-08-10,80,cs,task,
task-cs-2,Database Schema & Migrations,2026-08-06,2026-08-15,40,cs,task,task-cs-1
task-cs-3,Frontend Gantt Integration,2026-08-12,2026-08-25,20,cs,task,task-cs-2
project-mech,Mechanical Department,2026-08-03,2026-08-28,35,mechanical,project,
task-mech-1,Chassis CAD Design,2026-08-03,2026-08-12,90,mechanical,task,
task-mech-2,Material Sourcing & Stress Analysis,2026-08-10,2026-08-18,30,mechanical,task,task-mech-1
task-mech-3,3D Prototype Printing,2026-08-17,2026-08-28,0,mechanical,task,task-mech-2
project-elec,Electrical Department,2026-08-05,2026-08-30,25,electrical,project,
task-elec-1,PCB Circuit Schematic,2026-08-05,2026-08-14,60,electrical,task,
task-elec-2,Microcontroller Firmware Flash,2026-08-14,2026-08-22,10,electrical,task,task-elec-1
task-elec-3,Power Distribution Testing,2026-08-20,2026-08-30,0,electrical,task,task-elec-2
project-mgmt,Management Department,2026-08-01,2026-08-31,65,management,project,
task-mgmt-1,Project Roadmap & Milestones,2026-08-01,2026-08-07,100,management,task,
task-mgmt-2,Budgeting & Resource Allocation,2026-08-06,2026-08-16,70,management,task,
task-mgmt-3,Sprint Review & Client Presentation,2026-08-24,2026-08-31,0,management,task,`;

// In-memory fallback for serverless read/write compatibility
let inMemoryCsvStore: string | null = null;

function getFilePath() {
  return path.join(process.cwd(), 'data', 'tasks.csv');
}

function readCsvContent(): string {
  if (inMemoryCsvStore !== null) {
    return inMemoryCsvStore;
  }
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      inMemoryCsvStore = content;
      return content;
    }
  } catch (err) {
    console.warn('Could not read CSV file from disk, fallback to default in-memory CSV', err);
  }
  inMemoryCsvStore = DEFAULT_CSV;
  return DEFAULT_CSV;
}

function writeCsvContent(csvString: string): boolean {
  inMemoryCsvStore = csvString;
  try {
    const filePath = getFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, csvString, 'utf-8');
    return true;
  } catch (err) {
    console.warn('Could not write CSV to disk (Vercel serverless disk may be read-only). Memory state updated.', err);
    return true;
  }
}

export async function GET() {
  const csvData = readCsvContent();
  const parsed = Papa.parse<TaskItem>(csvData, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  return NextResponse.json({
    tasks: parsed.data,
    rawCsv: csvData,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if raw csv text is passed or array of task items
    if (typeof body.csv === 'string') {
      writeCsvContent(body.csv);
      return NextResponse.json({ success: true, message: 'CSV updated successfully' });
    }
    
    if (Array.isArray(body.tasks)) {
      const csvOutput = Papa.unparse(body.tasks);
      writeCsvContent(csvOutput);
      return NextResponse.json({ success: true, message: 'Tasks updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid payload. Provide "csv" string or "tasks" array.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save tasks' }, { status: 500 });
  }
}
