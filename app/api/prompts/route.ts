import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'prompts.json');
    const fileContents = readFileSync(filePath, 'utf-8');
    const prompts = JSON.parse(fileContents);
    return NextResponse.json(prompts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
