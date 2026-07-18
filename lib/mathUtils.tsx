import React from "react";

/**
 * Parses LaTeX-style mathematics and fractions in text and returns React nodes.
 * It also supports basic Markdown styles like bold (**bold**) and bullet lists (* ).
 */
export function parseMathText(text: string): React.ReactNode {
  if (!text) return "";
  
  // Replace '*' bullet points at the beginning of a line with '• '
  let processed = text.replace(/^(?:\s*\*\s+)/gm, "• ");
  
  // Inject newline after "Simplify the expression:" to show equations below it
  processed = processed.replace(/(Simplify the expression:)\s*/gi, "$1\n");
  
  // Pre-process common LaTeX symbols to Unicode equivalents
  processed = processed
    .replace(/\\times/g, " × ")
    .replace(/\\approx/g, " ≈ ")
    .replace(/\\text\s*\{([^}]+)\}/g, "$1")
    .replace(/\\boxed\s*\{([^}]+)\}/g, "$1")
    .replace(/\$\$/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\dfrac/g, "\\frac");

  // Regex to find \frac{num}{den}
  const fracRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = fracRegex.exec(processed)) !== null) {
    const matchIndex = match.index;
    
    // Add text before the fraction
    if (matchIndex > lastIndex) {
      parts.push(processed.substring(lastIndex, matchIndex));
    }
    
    const numerator = match[1];
    const denominator = match[2];
    
    // Add the fraction component
    parts.push(
      <span key={matchIndex} className="inline-flex flex-col items-center align-middle mx-1 text-xs select-none">
        <span className="border-b border-current px-1 text-center w-full leading-none pb-0.5">{numerator}</span>
        <span className="text-center w-full leading-none pt-0.5">{denominator}</span>
      </span>
    );
    
    lastIndex = fracRegex.lastIndex;
  }
  
  if (lastIndex < processed.length) {
    parts.push(processed.substring(lastIndex));
  }

  // Parse square roots (\sqrt{val})
  const sqrtParts = parts.flatMap((part, idx) => {
    if (typeof part !== 'string') return [part];
    
    const sqrtRegex = /\\sqrt\{([^{}]+)\}/g;
    const subParts: React.ReactNode[] = [];
    let subLastIndex = 0;
    let sqrtMatch;
    
    while ((sqrtMatch = sqrtRegex.exec(part)) !== null) {
      const sqrtMatchIndex = sqrtMatch.index;
      if (sqrtMatchIndex > subLastIndex) {
        subParts.push(part.substring(subLastIndex, sqrtMatchIndex));
      }
      
      const val = sqrtMatch[1];
      subParts.push(
        <span key={`sqrt-${idx}-${sqrtMatchIndex}`} className="inline-flex items-center align-middle mx-0.5">
          <span className="text-lg md:text-xl font-sans leading-none">√</span>
          <span className="border-t-2 border-current px-0.5 text-sm md:text-base font-bold leading-none pt-0.5 -mt-0.5">{val}</span>
        </span>
      );
      subLastIndex = sqrtRegex.lastIndex;
    }
    
    if (subLastIndex < part.length) {
      subParts.push(part.substring(subLastIndex));
    }
    
    return subParts;
  });

  // Parse overlines (\overline{val})
  const overlineParts = sqrtParts.flatMap((part, idx) => {
    if (typeof part !== 'string') return [part];
    
    const overlineRegex = /\\overline\{([^{}]+)\}/g;
    const subParts: React.ReactNode[] = [];
    let subLastIndex = 0;
    let overlineMatch;
    
    while ((overlineMatch = overlineRegex.exec(part)) !== null) {
      const overlineMatchIndex = overlineMatch.index;
      if (overlineMatchIndex > subLastIndex) {
        subParts.push(part.substring(subLastIndex, overlineMatchIndex));
      }
      
      const val = overlineMatch[1];
      subParts.push(
        <span key={`overline-${idx}-${overlineMatchIndex}`} style={{ textDecoration: "overline" }}>
          {val}
        </span>
      );
      subLastIndex = overlineRegex.lastIndex;
    }
    
    if (subLastIndex < part.length) {
      subParts.push(part.substring(subLastIndex));
    }
    
    return subParts;
  });
  
  // Parse bold markdown (**)
  const boldParts = overlineParts.flatMap((part, idx) => {
    if (typeof part !== 'string') return [part];
    
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const subParts: React.ReactNode[] = [];
    let subLastIndex = 0;
    let boldMatch;
    
    while ((boldMatch = boldRegex.exec(part)) !== null) {
      const boldMatchIndex = boldMatch.index;
      if (boldMatchIndex > subLastIndex) {
        subParts.push(part.substring(subLastIndex, boldMatchIndex));
      }
      
      subParts.push(
        <strong key={`bold-${idx}-${boldMatchIndex}`} className="font-extrabold">
          {boldMatch[1]}
        </strong>
      );
      subLastIndex = boldRegex.lastIndex;
    }
    
    if (subLastIndex < part.length) {
      subParts.push(part.substring(subLastIndex));
    }
    
    return subParts;
  });

  // Parse newlines (\n) to <br /> elements
  const finalParts = boldParts.flatMap((part, idx) => {
    if (typeof part !== 'string') return [part];
    
    const lines = part.split("\n");
    const result: React.ReactNode[] = [];
    
    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        result.push(<br key={`br-${idx}-${lineIdx}`} />);
      }
      result.push(line);
    });
    
    return result;
  });
  
  return <>{finalParts}</>;
}
