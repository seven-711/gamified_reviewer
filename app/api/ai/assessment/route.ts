import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  AssessmentRequestPayload,
  AIAssessmentResult,
  generateHeuristicAssessment,
  formatTestTitle
} from "@/lib/aiAssessment";

export async function POST(request: Request) {
  try {
    const payload: AssessmentRequestPayload = await request.json();

    if (!payload || !payload.testId) {
      return NextResponse.json({ error: "Missing test assessment payload" }, { status: 400 });
    }

    const testTitle = payload.testTitle || formatTestTitle(payload.testId);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

    // If no OpenAI API key configured, seamlessly provide smart heuristic assessment
    if (!apiKey) {
      const fallbackResult = generateHeuristicAssessment({
        ...payload,
        testTitle
      });
      return NextResponse.json({
        ...fallbackResult,
        isMock: true,
        apiKeyMissing: true,
        message: "OpenAI API key is not configured in .env. Showing high-precision heuristic assessment."
      });
    }

    // Call OpenAI GPT-4o-mini
    try {
      const openai = new OpenAI({ apiKey });

      const wrongQuestions = (payload.questionsSummary || []).filter((q) => !q.isCorrect);
      const rightQuestions = (payload.questionsSummary || []).filter((q) => q.isCorrect);

      const systemPrompt = `You are an elite, encouraging, and pedagogically expert Civil Service Exam (CSE) AI Coach in the Philippines.
You analyze examinees' test responses on CSE practice exams (Abstract Reasoning, Numerical Reasoning, Word Problems, Logical Reasoning, General Information, Data Sufficiency).
Your goal is to provide a deep, personalized, highly motivating, and analytically actionable performance assessment.

You must output STRICT JSON matching this schema:
{
  "testTitle": "string",
  "overallGrade": "string (e.g., 'Civil Service Ready', 'Solid Foundation', 'Needs Targeted Review')",
  "readinessScore": number (0 to 100 integer indicating estimated CSE exam readiness),
  "executiveSummary": "string (2-3 insightful, encouraging paragraphs detailing performance, speed, accuracy, and test psychology)",
  "strengths": [
    {
      "title": "string (name of skill mastered)",
      "description": "string (why they did well, referencing concepts they got right)"
    }
  ],
  "areasForImprovement": [
    {
      "title": "string (concept or trap causing trouble)",
      "description": "string (diagnostic explanation of why this concept tripped them up)",
      "urgency": "high" | "medium" | "low"
    }
  ],
  "mistakeAnalysis": [
    {
      "questionNumber": number,
      "questionPrompt": "string",
      "userAnswer": "string",
      "correctAnswer": "string",
      "whyUserAnswerWasWrong": "string (in simple, friendly, easy-to-understand words, explain clearly why this choice seemed tempting and where the mistake happened — avoid dry jargon like 'attractive distractor')",
      "keyTakeaway": "string (clear rule or mental checklist to remember on exam day)"
    }
  ],
  "actionableRecommendations": [
    {
      "priority": number (1, 2, 3...),
      "category": "string",
      "step": "string",
      "tip": "string"
    }
  ],
  "examDayTactics": [
    "string (specific time-saving or elimination trick for this subject on actual exam day)"
  ],
  "recommendedNextTopics": [
    "string (recommended CSE topics/modules to take next)"
  ],
  "encouragingQuote": "string"
}`;

      // Build context for OpenAI
      const questionsDataForPrompt = (payload.questionsSummary || []).map((q, idx) => ({
        index: idx + 1,
        prompt: q.prompt,
        options: q.options,
        userSelected: q.selectedOptionText ?? (q.selectedOptionIndex !== null ? `Option ${q.selectedOptionIndex + 1}` : "Unanswered / Timed Out"),
        correct: q.correctOptionText ?? `Option ${q.correctOptionIndex + 1}`,
        isCorrect: q.isCorrect,
        explanation: q.explanation || ""
      }));

      const userPrompt = `Test Details:
- Test: "${testTitle}" (ID: ${payload.testId})
- Score: ${payload.correctAnswers} / ${payload.totalQuestions} (${payload.scorePercentage.toFixed(1)}%)
- Time remaining: ${payload.timeSpentSeconds !== undefined ? `${payload.timeSpentSeconds} seconds` : "N/A"}
- Questions Summary (${payload.questionsSummary?.length || 0} items):
${JSON.stringify(questionsDataForPrompt, null, 2)}

Provide an in-depth, structured AI assessment focusing on:
1. Why they succeeded on correct questions (${rightQuestions.length} correct).
2. For each missed question (${wrongQuestions.length} missed), explain in simple, friendly, everyday words why they might have picked that choice and the exact slip-up to watch out for.
3. Concrete steps to raise their score beyond the 80% CSE passing mark.
Respond strictly in JSON matching the specified schema.`;

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 3500
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("Empty response received from OpenAI");
      }

      const parsedData = JSON.parse(responseContent);

      const finalResult: AIAssessmentResult = {
        testId: payload.testId,
        testTitle: parsedData.testTitle || testTitle,
        overallGrade: parsedData.overallGrade || "Civil Service Candidate",
        readinessScore: typeof parsedData.readinessScore === "number" ? parsedData.readinessScore : Math.round(payload.scorePercentage),
        scorePercentage: payload.scorePercentage,
        executiveSummary: parsedData.executiveSummary || "Test complete. Keep practicing consistently.",
        strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
        areasForImprovement: Array.isArray(parsedData.areasForImprovement) ? parsedData.areasForImprovement : [],
        mistakeAnalysis: Array.isArray(parsedData.mistakeAnalysis) ? parsedData.mistakeAnalysis : [],
        actionableRecommendations: Array.isArray(parsedData.actionableRecommendations) ? parsedData.actionableRecommendations : [],
        examDayTactics: Array.isArray(parsedData.examDayTactics) ? parsedData.examDayTactics : [],
        recommendedNextTopics: Array.isArray(parsedData.recommendedNextTopics) ? parsedData.recommendedNextTopics : [],
        encouragingQuote: parsedData.encouragingQuote || "Consistency and deliberate review turn effort into Civil Service success.",
        isMock: false,
        apiKeyMissing: false
      };

      // Enrich mistakeAnalysis with images from original payload (AI doesn't receive images)
      const enrichedMistakes = finalResult.mistakeAnalysis.map((m) => {
        const original = payload.questionsSummary?.find((q) => q.questionIndex + 1 === m.questionNumber);
        return original?.image ? { ...m, image: original.image } : m;
      });

      // Ensure ALL missed questions from the test are included, even if AI omitted any items
      const existingMap = new Map(enrichedMistakes.map((m) => [m.questionNumber, m]));
      const allMistakes = wrongQuestions.map((wq) => {
        const qNum = wq.questionIndex + 1;
        const fromAi = existingMap.get(qNum);
        if (fromAi) return fromAi;
        return {
          questionNumber: qNum,
          questionPrompt: wq.prompt || `Question ${qNum}`,
          image: wq.image || undefined,
          userAnswer: wq.selectedOptionText || (wq.selectedOptionIndex !== null ? `Option ${wq.selectedOptionIndex + 1}` : "Unanswered / Timed Out"),
          correctAnswer: wq.correctOptionText || `Option ${wq.correctOptionIndex + 1}`,
          whyUserAnswerWasWrong: wq.selectedOptionIndex === null
            ? "This question was left unanswered before time ran out or hearts were depleted."
            : "This choice is a common trap designed to look correct at first glance. It usually catches you when you solve only halfway through or overlook a small detail in the question.",
          keyTakeaway: wq.explanation || "Re-read the question carefully to identify whether all conditions and unit constraints were fulfilled.",
          explanation: wq.explanation
        };
      });

      return NextResponse.json({ ...finalResult, mistakeAnalysis: allMistakes });
    } catch (apiError: any) {
      console.error("OpenAI API call failed, falling back to heuristic assessment:", apiError);
      
      const fallback = generateHeuristicAssessment({
        ...payload,
        testTitle
      });

      return NextResponse.json({
        ...fallback,
        isMock: true,
        apiKeyMissing: false,
        apiError: apiError.message || "Failed to communicate with OpenAI API"
      });
    }
  } catch (error: any) {
    console.error("Error processing AI assessment request:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
