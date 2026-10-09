"use client";

import React, { useState } from "react";
import { AIAssessmentResult } from "@/lib/aiAssessment";

interface AIAssessmentCardProps {
  assessment: AIAssessmentResult | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  testTitle?: string;
}

export function AIAssessmentCard({
  assessment,
  loading,
  error,
  onRefresh,
  testTitle,
}: AIAssessmentCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="w-full max-w-2xl bg-white dark:bg-[#18252b] border border-cloud-gray/40 dark:border-cloud-gray/15 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-t-sky-blue border-r-transparent border-b-duo-green border-l-transparent animate-spin" />
          <p className="text-sm font-bold text-charcoal dark:text-white">Analyzing your answers</p>
          <p className="text-xs text-graphite dark:text-silver max-w-xs">
            Reviewing each incorrect response and generating your improvement report.
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="w-full max-w-2xl bg-white dark:bg-[#18252b] border border-red-500/25 rounded-2xl p-5 shadow-sm text-center">
        <p className="text-sm font-bold text-red-500 mb-1">Could not generate report</p>
        <p className="text-xs text-graphite dark:text-silver mb-4">
          {error || "An unexpected error occurred."}
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-sky-blue text-white text-xs font-bold hover:bg-sky-blue/90 cursor-pointer shadow-[0_3px_0_#189edc] active:translate-y-0.5 active:shadow-none transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { mistakeAnalysis, areasForImprovement, readinessScore, scorePercentage } = assessment;
  const totalWrong = mistakeAnalysis.length;
  const passed = scorePercentage >= 80;

  const readinessLabel =
    readinessScore >= 80 ? "Passing" : readinessScore >= 60 ? "Near Passing" : "Below Passing";

  const readinessBg =
    readinessScore >= 80 ? "bg-duo-green" : readinessScore >= 60 ? "bg-sunshine-yellow" : "bg-[#ea2b2b]";

  const readinessText =
    readinessScore >= 80 ? "text-duo-green" : readinessScore >= 60 ? "text-sunshine-yellow" : "text-[#ea2b2b]";

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-[#18252b] border border-cloud-gray/30 dark:border-cloud-gray/15 rounded-2xl shadow-sm text-left overflow-hidden">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-5 pt-5 pb-4 border-b border-cloud-gray/20 dark:border-cloud-gray/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-feather font-bold text-charcoal dark:text-white leading-tight">
              {testTitle || assessment.testTitle}
            </h2>
            <p className="text-xs text-graphite dark:text-silver mt-0.5">Review Report</p>
          </div>
          <button
            onClick={onRefresh}
            className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-cloud-gray/40 dark:border-cloud-gray/20 text-graphite dark:text-silver hover:text-charcoal dark:hover:text-white hover:bg-cloud-gray/15 transition-all cursor-pointer"
          >
            Regenerate
          </button>
        </div>

        {/* Score + readiness bar */}
        <div className="flex items-center gap-3 mt-4">
          <div className={`shrink-0 px-3 py-1 rounded-lg border font-feather font-extrabold text-sm ${
            passed
              ? "border-duo-green/40 bg-duo-green/10 text-duo-green"
              : "border-[#ea2b2b]/40 bg-[#ea2b2b]/10 text-[#ea2b2b]"
          }`}>
            {scorePercentage.toFixed(0)}%
          </div>
          <div className="flex-1 bg-cloud-gray/30 dark:bg-cloud-gray/15 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${readinessBg}`}
              style={{ width: `${Math.min(100, Math.max(4, readinessScore))}%` }}
            />
          </div>
          <span className={`shrink-0 text-xs font-extrabold uppercase tracking-wide ${readinessText}`}>
            {readinessLabel}
          </span>
        </div>
      </div>

      {/* â”€â”€ Areas to improve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {areasForImprovement.length > 0 && (
        <div className="px-5 py-4 border-b border-cloud-gray/20 dark:border-cloud-gray/10">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-graphite dark:text-silver mb-3">
            Areas to Improve
          </h3>
          <div className="space-y-2.5">
            {areasForImprovement.map((a, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className={`shrink-0 mt-0.5 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  a.urgency === "high"
                    ? "bg-red-500/10 text-red-500"
                    : a.urgency === "medium"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-500"
                }`}>
                  {a.urgency}
                </span>
                <div>
                  <p className="text-xs font-bold text-charcoal dark:text-white">{a.title}</p>
                  <p className="text-[11px] text-graphite dark:text-silver leading-snug mt-0.5">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* missed questions */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-graphite dark:text-silver">
            Missed Questions
          </h3>
          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
            totalWrong === 0
              ? "bg-duo-green/10 text-duo-green"
              : "bg-red-500/10 text-red-500"
          }`}>
            {totalWrong === 0 ? "None" : `${totalWrong} item${totalWrong > 1 ? "s" : ""}`}
          </span>
        </div>

        {totalWrong === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-duo-green">No mistakes — great work!</p>
            <p className="text-xs text-graphite dark:text-silver mt-1">
              You answered every question correctly.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mistakeAnalysis.map((m, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-cloud-gray/30 dark:border-cloud-gray/15 overflow-hidden"
                >
                  {/* Collapsed row */}
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-cloud-gray/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="shrink-0 mt-0.5 text-[10px] font-extrabold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                        #{m.questionNumber}
                      </span>
                      <p className="text-xs font-semibold text-charcoal dark:text-white leading-snug line-clamp-2">
                        {m.questionPrompt}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 shrink-0 text-silver mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-cloud-gray/20 dark:border-cloud-gray/10 space-y-2.5">

                      {/* Question image */}
                      {m.image && (
                        <div className="rounded-xl overflow-hidden border border-cloud-gray/25 dark:border-cloud-gray/15 bg-cloud-gray/5 mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.image}
                            alt={`Question ${m.questionNumber}`}
                            className="w-full max-h-64 object-contain"
                          />
                        </div>
                      )}

                      {/* Your answer vs correct */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2.5">
                          <p className="text-[10px] font-extrabold uppercase text-red-500 mb-1">Your Answer</p>
                          <p className="text-xs text-charcoal dark:text-silver leading-snug">{m.userAnswer}</p>
                        </div>
                        <div className="rounded-xl bg-duo-green/5 border border-duo-green/20 px-3 py-2.5">
                          <p className="text-[10px] font-extrabold uppercase text-duo-green mb-1">Correct Answer</p>
                          <p className="text-xs text-charcoal dark:text-silver leading-snug">{m.correctAnswer}</p>
                        </div>
                      </div>

                      {/* Why wrong */}
                      {m.whyUserAnswerWasWrong && (
                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                          <p className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 mb-1">Why it was wrong</p>
                          <p className="text-xs text-charcoal dark:text-silver leading-relaxed">{m.whyUserAnswerWasWrong}</p>
                        </div>
                      )}

                      {/* What to remember */}
                      {(m.keyTakeaway || m.explanation) && (
                        <div className="rounded-xl bg-sky-blue/5 border border-sky-blue/20 px-3 py-2.5">
                          <p className="text-[10px] font-extrabold uppercase text-sky-blue mb-1">What to remember</p>
                          <p className="text-xs text-charcoal dark:text-silver leading-relaxed">
                            {m.keyTakeaway || m.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
