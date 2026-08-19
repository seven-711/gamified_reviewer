import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import alasql from 'alasql';

const dataDir = path.join(process.cwd(), 'public', 'data');
const quantDir = path.join(process.cwd(), 'public', 'img', 'afp_reviewer_imgs', 'quantitative_reasoning');

const fileMap: Record<string, string> = {
  abstract: path.join(dataDir, 'abstractReasoning.json'),
  logical: path.join(dataDir, 'logicalReasoning.json'),
  numerical: path.join(dataDir, 'numericalReasoning.json'),
  quantitative: path.join(quantDir, 'quantitativeReasoning.json'),
};

const CATEGORY_LABELS: Record<string, string> = {
  abstract: 'Abstract Reasoning',
  logical: 'Logical Reasoning',
  numerical: 'Numerical Reasoning',
  quantitative: 'Quantitative Reasoning',
};

function getCategoryForTestId(testId: string): string {
  if (testId.startsWith('abstract')) return 'abstract';
  if (testId.startsWith('logical')) return 'logical';
  if (testId.startsWith('numerical')) return 'numerical';
  if (testId.startsWith('quantitative') || testId.startsWith('part2')) return 'quantitative';
  return 'abstract';
}

function getFilePathForTest(testId: string): string {
  return fileMap[getCategoryForTestId(testId)] ?? fileMap.abstract;
}

async function loadAllData() {
  const abstractStr = await fs.promises.readFile(fileMap.abstract, 'utf8');
  const logicalStr = await fs.promises.readFile(fileMap.logical, 'utf8');
  const numericalStr = await fs.promises.readFile(fileMap.numerical, 'utf8');
  const quantitativeStr = await fs.promises.readFile(fileMap.quantitative, 'utf8');

  const abstractTests: Record<string, any[]> = JSON.parse(abstractStr);
  const logicalTests: Record<string, any[]> = JSON.parse(logicalStr);
  const numericalTests: Record<string, any[]> = JSON.parse(numericalStr);
  const quantitativeFile = JSON.parse(quantitativeStr);
  const quantitativeTests: Record<string, any[]> = quantitativeFile.quantitativeReasoningTests || {};

  return { abstractTests, logicalTests, numericalTests, quantitativeTests };
}

function flattenCategoryData(testsObj: Record<string, any[]>, categoryKey: string, categoryLabel: string) {
  const list: any[] = [];
  for (const [testId, qs] of Object.entries(testsObj)) {
    for (const q of (qs || [])) {
      list.push({
        id: q.id,
        testId: testId,
        category: categoryKey,
        categoryLabel: categoryLabel,
        type: q.type ?? (q.image ? 'image' : 'text'),
        prompt: q.prompt,
        options: q.options || [],
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        image: q.image ?? null,
      });
    }
  }
  return list;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const mode = searchParams.get('mode');

    const { abstractTests, logicalTests, numericalTests, quantitativeTests } = await loadAllData();

    const categorizedTestIds: Record<string, string[]> = {
      abstract: Object.keys(abstractTests),
      logical: Object.keys(logicalTests),
      numerical: Object.keys(numericalTests),
      quantitative: Object.keys(quantitativeTests),
    };

    const allTestIds = [
      ...categorizedTestIds.abstract,
      ...categorizedTestIds.logical,
      ...categorizedTestIds.numerical,
      ...categorizedTestIds.quantitative,
    ];

    // Prepare table datasets for AlaSQL execution
    const abstractQs = flattenCategoryData(abstractTests, 'abstract', CATEGORY_LABELS.abstract);
    const logicalQs = flattenCategoryData(logicalTests, 'logical', CATEGORY_LABELS.logical);
    const numericalQs = flattenCategoryData(numericalTests, 'numerical', CATEGORY_LABELS.numerical);
    const quantitativeQs = flattenCategoryData(quantitativeTests, 'quantitative', CATEGORY_LABELS.quantitative);

    const categoriesTable = [
      { category: 'abstract', label: CATEGORY_LABELS.abstract },
      { category: 'logical', label: CATEGORY_LABELS.logical },
      { category: 'numerical', label: CATEGORY_LABELS.numerical },
      { category: 'quantitative', label: CATEGORY_LABELS.quantitative },
    ];

    // ── 1. UNION ALL RAW SQL SUBQUERY ──────────────────────────────────────
    const rawUnionAllSql = `
      SELECT * FROM ?
      UNION ALL
      SELECT * FROM ?
      UNION ALL
      SELECT * FROM ?
      UNION ALL
      SELECT * FROM ?
    `;
    const allQuestions: any[] = alasql(rawUnionAllSql, [abstractQs, logicalQs, numericalQs, quantitativeQs]);

    // ── 2. SCALAR RAW SQL SUBQUERY ──────────────────────────────────────────
    const rawScalarSql = `
      SELECT (SELECT COUNT(*) FROM ?) AS scalarTotalQuestions
    `;
    const scalarResult: any[] = alasql(rawScalarSql, [allQuestions]);
    const scalarTotalQuestions: number = Number(scalarResult[0]?.scalarTotalQuestions ?? 0);

    // ── 3. CORRELATED RAW SQL SUBQUERY ──────────────────────────────────────
    const rawCorrelatedSql = `
      SELECT 
        c.category AS category,
        c.label AS label,
        (SELECT COUNT(DISTINCT q.testId) FROM ? q WHERE q.category = c.category) AS testCount,
        (SELECT COUNT(*) FROM ? q WHERE q.category = c.category) AS questionCount
      FROM ? c
    `;
    const correlatedPerCategory: any[] = alasql(rawCorrelatedSql, [allQuestions, allQuestions, categoriesTable]);

    // ── MODE: stats ──────────────────────────────────────────────────────────
    if (mode === 'stats') {
      // ── 4. MULTIROW RAW SQL SUBQUERY ──────────────────────────────────────
      const rawMultirowSql = `
        SELECT * FROM ? 
        WHERE type IN (SELECT type FROM ? WHERE type = 'image')
      `;
      const multirowImageQuestions: any[] = alasql(rawMultirowSql, [allQuestions, allQuestions]);

      // ── 5. MULTI-COLUMN RAW SQL SUBQUERY ──────────────────────────────────
      const rawMulticolSql = `
        SELECT id, testId, category, categoryLabel, type, prompt, correctIndex, image 
        FROM ?
      `;
      const multicolAllQuestions: any[] = alasql(rawMulticolSql, [allQuestions]);

      return NextResponse.json({
        // Scalar result
        scalarTotalQuestions,
        // Correlated result
        correlatedPerCategory,
        // Multirow results
        multirowImageCount: multirowImageQuestions.length,
        multirowTextCount: multicolAllQuestions.length - multirowImageQuestions.length,
        // Multi-column sample for UI presentation
        multicolSample: multicolAllQuestions.slice(0, 50),
        totalQuestionsInAll: multicolAllQuestions.length,
        // Raw SQL statements executed for reference/transparency
        rawSqlQueries: {
          scalarSql: rawScalarSql.trim(),
          correlatedSql: rawCorrelatedSql.trim(),
          multirowSql: rawMultirowSql.trim(),
          multicolSql: rawMulticolSql.trim(),
          unionAllSql: rawUnionAllSql.trim(),
        }
      });
    }

    // ── MODE: all (UNION ALL RAW SQL QUERY) ──────────────────────────────────
    if (mode === 'all') {
      const filterCategory = searchParams.get('category') ?? null;
      const filterType = searchParams.get('filterType') ?? 'all';

      let rawFilteredUnionSql = `SELECT * FROM ? WHERE 1=1`;
      const queryParams: any[] = [allQuestions];

      if (filterCategory) {
        rawFilteredUnionSql += ` AND category = ?`;
        queryParams.push(filterCategory);
      }
      if (filterType && filterType !== 'all') {
        rawFilteredUnionSql += ` AND type = ?`;
        queryParams.push(filterType);
      }

      const unionAllQuestions: any[] = alasql(rawFilteredUnionSql, queryParams);

      return NextResponse.json({
        questions: unionAllQuestions,
        testIds: allTestIds,
        categorizedTestIds,
        scalarTotalQuestions,
        correlatedPerCategory,
        mode: 'all',
        rawSqlQueries: {
          unionAllSql: rawFilteredUnionSql.trim(),
        }
      });
    }

    // ── DEFAULT: return test IDs list or single test ─────────────────────────
    if (!testId) {
      return NextResponse.json({
        testIds: allTestIds,
        categorizedTestIds,
        scalarTotalQuestions,
        correlatedPerCategory,
      });
    }

    let questions: any[] = [];
    let isQuantitative = false;

    if (testId.startsWith('quantitative') || testId.startsWith('part2')) {
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
      categorizedTestIds,
      isQuantitative,
      scalarTotalQuestions,
      correlatedPerCategory,
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

    if (testId.startsWith('quantitative') || testId.startsWith('part2')) {
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
