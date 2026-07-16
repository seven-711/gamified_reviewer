import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'public', 'data');
const quantDir = path.join(process.cwd(), 'public', 'img', 'afp_reviewer_imgs', 'quantitative_reasoning');

const fileMap: Record<string, string> = {
  abstract: path.join(dataDir, 'abstractReasoning.json'),
  logical: path.join(dataDir, 'logicalReasoning.json'),
  numerical: path.join(dataDir, 'numericalReasoning.json'),
  quantitative: path.join(quantDir, 'quantitativeReasoning.json'),
};

function getFilePathForTest(testId: string): string {
  if (testId.startsWith('abstract')) return fileMap.abstract;
  if (testId.startsWith('logical')) return fileMap.logical;
  if (testId.startsWith('numerical')) return fileMap.numerical;
  if (testId.startsWith('quantitative')) return fileMap.quantitative;
  return fileMap.abstract; // default fallback
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    // Read all JSON files to list available tests and structure
    const abstractStr = await fs.promises.readFile(fileMap.abstract, 'utf8');
    const logicalStr = await fs.promises.readFile(fileMap.logical, 'utf8');
    const numericalStr = await fs.promises.readFile(fileMap.numerical, 'utf8');
    const quantitativeStr = await fs.promises.readFile(fileMap.quantitative, 'utf8');

    const abstractTests = JSON.parse(abstractStr);
    const logicalTests = JSON.parse(logicalStr);
    const numericalTests = JSON.parse(numericalStr);
    const quantitativeFile = JSON.parse(quantitativeStr);
    const quantitativeTests = quantitativeFile.quantitativeReasoningTests || {};

    const allTestIds = [
      ...Object.keys(abstractTests),
      ...Object.keys(logicalTests),
      ...Object.keys(numericalTests),
      ...Object.keys(quantitativeTests),
    ];

    if (!testId) {
      return NextResponse.json({ testIds: allTestIds });
    }

    let questions: any[] = [];
    let isQuantitative = false;

    if (testId.startsWith('quantitative')) {
      questions = quantitativeTests[testId] || [];
      isQuantitative = true;
    } else if (testId.startsWith('abstract')) {
      questions = abstractTests[testId] || [];
    } else if (testId.startsWith('logical')) {
      questions = logicalTests[testId] || [];
    } else if (testId.startsWith('numerical')) {
      questions = numericalTests[testId] || [];
    }

    return NextResponse.json({
      testId,
      questions,
      testIds: allTestIds,
      isQuantitative,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/tests:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testId, questions } = body;

    if (!testId || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing testId or questions array' }, { status: 400 });
    }

    const filePath = getFilePathForTest(testId);
    const fileContentStr = await fs.promises.readFile(filePath, 'utf8');
    const json = JSON.parse(fileContentStr);

    if (testId.startsWith('quantitative')) {
      if (!json.quantitativeReasoningTests) {
        json.quantitativeReasoningTests = {};
      }
      json.quantitativeReasoningTests[testId] = questions;
    } else {
      json[testId] = questions;
    }

    await fs.promises.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8');

    return NextResponse.json({ success: true, testId, questionsCount: questions.length });
  } catch (error: any) {
    console.error('Error in POST /api/admin/tests:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
