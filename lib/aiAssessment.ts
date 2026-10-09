export interface UserAnswerRecord {
  questionIndex: number;
  questionId?: number | string;
  prompt: string;
  questionType?: string;
  image?: string;
  options: string[];
  selectedOptionIndex: number | null;
  selectedOptionText: string | null;
  correctOptionIndex: number;
  correctOptionText: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface AssessmentRequestPayload {
  testId: string;
  testTitle?: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds?: number;
  totalTimeSeconds?: number;
  questionsSummary: UserAnswerRecord[];
}

export interface MistakeDetail {
  questionNumber: number;
  questionPrompt: string;
  image?: string;
  userAnswer: string;
  correctAnswer: string;
  whyUserAnswerWasWrong: string;
  keyTakeaway: string;
  explanation?: string;
}

export interface RecommendationItem {
  priority: number;
  step: string;
  category: string;
  tip: string;
}

export interface StrengthItem {
  title: string;
  description: string;
}

export interface WeaknessItem {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
}

export interface AIAssessmentResult {
  testId: string;
  testTitle: string;
  overallGrade: string; // e.g. "Civil Service Ready", "Strong Candidate", "Developing Competency", "Needs Foundation Review"
  readinessScore: number; // 0 - 100
  scorePercentage: number;
  executiveSummary: string;
  strengths: StrengthItem[];
  areasForImprovement: WeaknessItem[];
  mistakeAnalysis: MistakeDetail[];
  actionableRecommendations: RecommendationItem[];
  examDayTactics: string[];
  recommendedNextTopics: string[];
  encouragingQuote: string;
  isMock?: boolean;
  apiKeyMissing?: boolean;
}

export function formatTestTitle(testId: string): string {
  if (!testId) return "Civil Service Practice Test";
  
  // Format part2_secA_test1 -> Quantitative Reasoning (Part 2 Sec A - Test 1)
  if (testId.startsWith("part2_secA")) {
    const num = testId.replace("part2_secA_test", "");
    return `Quantitative Reasoning: Part 2 Sec A (Test ${num})`;
  }
  if (testId.startsWith("part2_secB")) {
    const num = testId.replace("part2_secB_test", "");
    return `Quantitative Reasoning: Part 2 Sec B (Test ${num})`;
  }

  // Common replacements
  const cleaned = testId
    .replace(/_/g, " ")
    .replace(/\btest(\d+)\b/gi, "Test $1")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned;
}

export function generateHeuristicAssessment(payload: AssessmentRequestPayload): AIAssessmentResult {
  const { testId, testTitle, totalQuestions, correctAnswers, scorePercentage, questionsSummary } = payload;
  const title = testTitle || formatTestTitle(testId);
  const wrongs = (questionsSummary || []).filter((q) => !q.isCorrect);
  const rights = (questionsSummary || []).filter((q) => q.isCorrect);

  let grade = "Civil Service Ready";
  let readiness = 85;
  if (scorePercentage >= 90) {
    grade = "Civil Service Topnotcher";
    readiness = 96;
  } else if (scorePercentage >= 80) {
    grade = "Civil Service Exam Ready";
    readiness = 88;
  } else if (scorePercentage >= 65) {
    grade = "Promising Candidate (Near Passing)";
    readiness = 72;
  } else if (scorePercentage >= 50) {
    grade = "Developing Competency";
    readiness = 58;
  } else {
    grade = "Needs Intensive Review";
    readiness = 42;
  }

  // Construct strengths based on actual correct questions
  const strengths: StrengthItem[] = [];
  if (rights.length > 0) {
    strengths.push({
      title: "Core Concept Retention",
      description: `Successfully mastered ${rights.length} out of ${totalQuestions} questions, demonstrating good speed and accurate recognition under timed conditions.`
    });
  }
  if (scorePercentage >= 50) {
    strengths.push({
      title: "Pattern Decoupling & Elimination",
      description: "Showed ability to discard obvious distractors and home in on the mathematically or logically valid choice in multiple test items."
    });
  }
  if (strengths.length === 0) {
    strengths.push({
      title: "Active Learning Baseline",
      description: "Completed the entire question set. This diagnostic data forms your clear baseline to pinpoint target improvements."
    });
  }

  // Construct areas for improvement based on mistakes
  const areasForImprovement: WeaknessItem[] = [];
  if (wrongs.length > 0) {
    areasForImprovement.push({
      title: "Tricky Choices & Quick Misreads",
      description: `Missed ${wrongs.length} question(s). Exam choices often look convincing because they include partial calculations or common slip-ups.`,
      urgency: scorePercentage < 80 ? "high" : "medium"
    });
    areasForImprovement.push({
      title: "Double-Checking Before Submitting",
      description: "Take 5–10 seconds to re-verify your final answer against the question's conditions before locking it in.",
      urgency: "medium"
    });
  } else {
    areasForImprovement.push({
      title: "Speed Calibration",
      description: "You got a perfect or near-perfect score! Your next step is maintaining this accuracy under stricter time limits.",
      urgency: "low"
    });
  }

  // Mistake analysis — include all missed questions without limiting to 5
  const mistakeAnalysis: MistakeDetail[] = wrongs.map((q) => ({
    questionNumber: q.questionIndex + 1,
    questionPrompt: q.prompt || `Question ${q.questionIndex + 1}`,
    image: q.image || undefined,
    userAnswer: q.selectedOptionText || (q.selectedOptionIndex !== null ? `Option ${q.selectedOptionIndex + 1}` : "Unanswered / Timed Out"),
    correctAnswer: q.correctOptionText || `Option ${q.correctOptionIndex + 1}`,
    whyUserAnswerWasWrong: q.selectedOptionIndex === null
      ? "This question was left unanswered before time ran out or hearts were depleted."
      : "This choice is a common trap designed to look correct at first glance. It usually catches you when you solve only halfway through or overlook a small detail in the question.",
    keyTakeaway: q.explanation || "Re-read the question carefully to identify whether all conditions and unit constraints were fulfilled.",
    explanation: q.explanation
  }));

  // Recommendations
  const actionableRecommendations: RecommendationItem[] = [
    {
      priority: 1,
      category: "Targeted Retake",
      step: "Review missed items immediately",
      tip: "Redo the incorrect questions without looking at the solution first to solidify the correct cognitive pattern."
    },
    {
      priority: 2,
      category: "Elimination Technique",
      step: "Strike out 2 impossible choices",
      tip: "Before calculating or guessing, identify and eliminate the two most extreme or inconsistent options to raise your probability to 50%."
    },
    {
      priority: 3,
      category: "Pacing Strategy",
      step: "Cap question time to 60 seconds",
      tip: "If a question takes longer than 1 minute, flag it, make your best educated guess, and keep moving to protect remaining points."
    }
  ];

  const examDayTactics = [
    "Read the question carefully twice before looking at the choices to avoid jumping to quick conclusions.",
    "For numerical or math problems, quickly check if working backwards from the choices is faster than long algebraic derivations.",
    "Maintain your composure: encountering 1 or 2 difficult questions is expected; secure the easy points first."
  ];

  const recommendedNextTopics = [
    "Abstract Reasoning",
    "Numerical Reasoning",
    "Logical Reasoning",
    "Word Problems & Operations"
  ];

  return {
    testId,
    testTitle: title,
    overallGrade: grade,
    readinessScore: readiness,
    scorePercentage,
    executiveSummary: `You completed "${title}" scoring ${correctAnswers}/${totalQuestions} (${scorePercentage.toFixed(0)}%). ${
      scorePercentage >= 80
        ? "Excellent job! You met the 80% benchmark required for CSE passing proficiency. Your foundation in this topic is well established."
        : "Good attempt! With targeted practice on the tricky questions identified below, you can comfortably cross the 80% passing threshold for the Civil Service Exam."
    }`,
    strengths,
    areasForImprovement,
    mistakeAnalysis,
    actionableRecommendations,
    examDayTactics,
    recommendedNextTopics,
    encouragingQuote: "Success in the Civil Service Examination is not about innate genius—it is about relentless consistency, pattern recognition, and calm exam discipline.",
    isMock: true,
    apiKeyMissing: true
  };
}
