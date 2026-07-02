import React from "react";
import { Button } from "./Button";

interface QuizFooterProps {
  status: "none" | "selected" | "correct" | "wrong" | "completed";
  onCheck: () => void;
  onContinue: () => void;
  explanation?: string;
  correctAnswer?: string;
}

export function QuizFooter({ status, onCheck, onContinue, explanation, correctAnswer }: QuizFooterProps) {
  const isFeedback = status === "correct" || status === "wrong";

  return (
    <footer className={`fixed bottom-0 left-0 right-0 border-t-2 z-50 transition-colors duration-200 ${
      status === "correct" ? "bg-[#d7ffb8] border-[#58cc02]" :
      status === "wrong" ? "bg-[#ffdfe0] border-[#ea2b2b]" :
      "bg-white border-cloud-gray"
    }`}>
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Feedback Banner */}
        {isFeedback ? (
          <div className="flex flex-col flex-1 w-full md:w-auto animate-[slideIn_0.3s_ease-out]">
            <div className={`flex items-center gap-2 font-feather text-2xl md:text-3xl font-bold tracking-wide ${
              status === "correct" ? "text-duo-green" : "text-[#ea2b2b]"
            }`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shadow-sm ${
                status === "correct" ? "bg-duo-green" : "bg-[#ea2b2b]"
              }`}>
                {status === "correct" ? (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              {status === "correct" ? "Excellent!" : "Not quite"}
            </div>
            
            {status === "wrong" && correctAnswer && (
              <div className="mt-3 mb-1">
                <span className="bg-[#ba1c1c]/10 text-[#ea2b2b] px-4 py-2 rounded-xl font-bold text-[15px] md:text-[17px] inline-flex items-center shadow-sm">
                  Correct Answer: {correctAnswer}
                </span>
              </div>
            )}
            
            {(status === "wrong" || status === "correct") && explanation && (
              <div className={`mt-4 font-din-round text-[15px] md:text-[17px] leading-relaxed ${status === "correct" ? "text-[#3f8f01]" : "text-[#ba1c1c]"}`}>
                <div className="opacity-90">
                  {(() => {
                    const lines = explanation.split('\n');
                    const elements: React.ReactNode[] = [];
                    let tableRows: string[] = [];
  
                    const renderTable = (rows: string[], index: number) => {
                      return (
                        <div key={`table-${index}`} className="my-4 overflow-x-auto w-full rounded-xl border border-current shadow-sm bg-white/40">
                          <table className="w-full text-left border-collapse">
                            <tbody>
                              {rows.map((row, rIdx) => {
                                const cells = row.split('|').map(c => c.trim());
                                return (
                                  <tr key={rIdx} className="border-b border-current/20 last:border-0">
                                    {cells.map((cell, cIdx) => (
                                      <td key={cIdx} className={`py-2 px-4 border-r border-current/20 last:border-0 ${rIdx === 0 ? 'font-bold bg-current/10' : 'font-medium'}`}>
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    };
  
                    lines.forEach((line, i) => {
                      if (line.includes('|')) {
                        tableRows.push(line);
                      } else {
                        if (tableRows.length > 0) {
                          elements.push(renderTable(tableRows, i));
                          tableRows = [];
                        }
                        
                        const colonIndex = line.indexOf(':');
                        if (colonIndex > 0 && colonIndex < 15) {
                          const prefix = line.substring(0, colonIndex + 1);
                          const suffix = line.substring(colonIndex + 1);
                          elements.push(
                            <p key={i} className="mb-2 last:mb-0">
                              <span className="font-bold">{prefix}</span>
                              <span className="font-medium">{suffix}</span>
                            </p>
                          );
                        } else {
                          elements.push(<p key={i} className="mb-2 last:mb-0 font-medium">{line}</p>);
                        }
                      }
                    });
  
                    if (tableRows.length > 0) {
                      elements.push(renderTable(tableRows, lines.length));
                    }
  
                    return elements;
                  })()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 hidden md:block"></div>
        )}

        {/* Action Button */}
        <div className="w-full md:w-auto shrink-0 flex justify-end">
          {status === "none" || status === "selected" ? (
            <Button
              variant="primary"
              disabled={status === "none"}
              onClick={onCheck}
              className={`w-full md:w-[150px] text-[15px] md:text-[17px] h-[44px] md:h-[48px] ${status === "none" ? "bg-[#e5e5e5] text-[#afafaf] border-none shadow-none" : "shadow-[0_4px_0_#3f8f01]"}`}
            >
              CHECK
            </Button>
          ) : (
            <button
              onClick={onContinue}
              className={`w-full md:w-[150px] font-din-round font-bold text-[15px] md:text-[17px] h-[44px] md:h-[48px] rounded-2xl flex items-center justify-center transition-all active:translate-y-1 ${
                status === "correct" 
                  ? "bg-duo-green text-white shadow-[0_4px_0_#3f8f01] hover:brightness-110" 
                  : "bg-[#ea2b2b] text-white shadow-[0_4px_0_#ba1c1c] hover:brightness-110"
              }`}
            >
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
