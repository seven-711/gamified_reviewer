# Solving Word Problems — Book Plan

Read this compact current state for chapter work. The chapter map/status lives in `chapters.md`; storyboards, errata and feedback live in `chapters/chNN.md`.

## Intake
- Readers: Civil Service Examination (CSE) and College Entrance Exam (CET/UPCAT/DCAT) reviewees.
- Tone: Clear, visual, intuitive, structured, encouraging.
- Narration language: English (`en-US-AndrewMultilingualNeural`, rate: `-3%`).
- Guide character: Infinity guide (default).
- Slug: `word-problems`.
- Primary language code: `en`.
- Asset approach: Code / SVG vector stage (1600×900) with dynamic math typography.
- Source: `Solving_Word_Problems.pdf` (Reviewer Reference).
- Page map: `sections.json` (4 pages, 5 chapters across 3 units).

## Conventions
- Look:
  - Slate blackboard background (`#131f2e` / `COL.board`).
  - Warm chalk white (`COL.chalk` `#f8fafc`) for primary text & numbers.
  - Accent colors: `COL.good` (`#22c55e`) for solutions, `COL.task` (`#38bdf8`) for variables & prompts, `COL.bad` (`#ef4444`) for errors, `COL.dim` (`#94a3b8`) for secondary annotations.
  - Interactive tape diagrams & balance models to make equations visible before writing algebra.
- Narration:
  - Short, cadence-friendly sentences.
  - Speak mathematical operations naturally ("two x", "x plus twenty-four", "seventy-two divided by three is twenty-four").
  - Use `[[marks]]` right before key words to synchronize SVG visual transformations with spoken cues.
- Questions:
  - Position: `BAND` (bottom panel) for checks with diagram intact; `SCREEN` for final practice.
  - Types: `blanks` for algebraic and numeric step verification, `choice` with dedicated mistake feedback for reasoning traps.
  - Immediate visual feedback on right/wrong attempts.

## Visual models / available helpers
- Tape diagram / Bar model: Rectangular block partitions showing unit multiples ($x$, $2x$) combining into a whole bracket.
- Balance scale: Visual weight balance comparing algebraic expressions.
- Timeline & distance tracks: Horizontal displacement lines for motion problems.
