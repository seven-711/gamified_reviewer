import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const quantDir = path.join(process.cwd(), 'public', 'img', 'afp_reviewer_imgs', 'quantitative_reasoning');
    
    // Read files directly from disk to bypass Next.js compilation
    const abstractReasoningStr = await fs.promises.readFile(path.join(dataDir, 'abstractReasoning.json'), 'utf8');
    const logicalReasoningStr = await fs.promises.readFile(path.join(dataDir, 'logicalReasoning.json'), 'utf8');
    const numericalReasoningStr = await fs.promises.readFile(path.join(dataDir, 'numericalReasoning.json'), 'utf8');
    const quantitativeReasoningStr = await fs.promises.readFile(path.join(quantDir, 'quantitativeReasoning.json'), 'utf8');
    
    const abstractReasoningTests = JSON.parse(abstractReasoningStr);
    const logicalReasoningTests = JSON.parse(logicalReasoningStr);
    const numericalReasoningTests = JSON.parse(numericalReasoningStr);
    const quantitativeReasoningFile = JSON.parse(quantitativeReasoningStr);
    
    const quantitativeReasoningTests = quantitativeReasoningFile.quantitativeReasoningTests || {};
    const quantitativeReasoningExamples = quantitativeReasoningFile.quantitativeReasoningExamples || {};

    const allTests: Record<string, any[]> = { 
      ...abstractReasoningTests, 
      ...logicalReasoningTests, 
      ...numericalReasoningTests, 
      ...quantitativeReasoningTests 
    };

    if (action === 'metadata') {
      // Return all available test keys
      const availableTests = Object.keys(allTests);
      return NextResponse.json({ availableTests });
    }

    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    const questions = allTests[testId];
    const examples = quantitativeReasoningExamples[testId] || [];

    if (!questions) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({
      questions,
      examples
    });
  } catch (error) {
    console.error('API Error reading test data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
