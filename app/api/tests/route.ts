import { NextResponse } from 'next/server';
import abstractReasoningTests from '@/public/data/abstractReasoning.json';
import logicalReasoningTests from '@/public/data/logicalReasoning.json';
import numericalReasoningTests from '@/public/data/numericalReasoning.json';
import quantitativeReasoningFile from '@/public/img/afp_reviewer_imgs/quantitative_reasoning/quantitativeReasoning.json';
import wordProblemsAndOperationsTests from '@/public/data/wordProblemsAndOperations.json';
import dataSufficiencyTests from '@/public/data/dataSufficiency.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    const quantitativeReasoningTests = (quantitativeReasoningFile as any).quantitativeReasoningTests || {};
    const quantitativeReasoningExamples = (quantitativeReasoningFile as any).quantitativeReasoningExamples || {};

    const allTests: Record<string, any[]> = { 
      ...abstractReasoningTests, 
      ...logicalReasoningTests, 
      ...numericalReasoningTests, 
      ...quantitativeReasoningTests,
      ...wordProblemsAndOperationsTests,
      ...dataSufficiencyTests
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

    const rawQuestions = allTests[testId];
    const examples = quantitativeReasoningExamples[testId] || [];

    if (!rawQuestions) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Exclude questions that are already presented as examples to avoid repetition in the quiz
    let questions = rawQuestions;
    if (examples.length > 0) {
      const examplePrompts = new Set(examples.map((e: any) => e.prompt?.trim()));
      const filtered = rawQuestions.filter((q: any) => !examplePrompts.has(q.prompt?.trim()));
      if (filtered.length > 0) {
        questions = filtered;
      }
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
