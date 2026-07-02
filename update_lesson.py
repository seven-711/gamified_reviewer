import re
import codecs

with codecs.open('app/lesson/page.tsx', 'r', 'utf-8') as f:
    text = f.read()

# 1. Update imports
text = text.replace(
    'import { quantitativeReasoningTests } from "@/lib/data/quantitativeReasoning";',
    'import { quantitativeReasoningTests, quantitativeReasoningExamples } from "@/lib/data/quantitativeReasoning";'
)

# 2. Add testExamples and phase state
text = text.replace(
    '  const questions = allTests[testId] || allTests["abstract_reasoning_test1"];\n\n  const [currentIndex, setCurrentIndex] = useState(0);',
    '  const allExamples: any = { ...quantitativeReasoningExamples };\n  const questions = allTests[testId] || allTests["abstract_reasoning_test1"];\n  const testExamples = allExamples[testId] || [];\n\n  const [phase, setPhase] = useState<"examples" | "quiz" | "completed">("quiz");\n  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);\n  const [currentIndex, setCurrentIndex] = useState(0);'
)

# 3. Update localStorage loading
old_load = '''        const parsed = JSON.parse(savedState);
        setCurrentIndex(parsed.currentIndex ?? 0);'''
new_load = '''        const parsed = JSON.parse(savedState);
        setPhase(parsed.phase || (testExamples.length > 0 && !parsed.phase ? "examples" : "quiz"));
        setCurrentExampleIndex(parsed.currentExampleIndex || 0);
        setCurrentIndex(parsed.currentIndex ?? 0);'''
text = text.replace(old_load, new_load)

old_load_else = '''    } else {
      const prefs = JSON.parse(localStorage.getItem("onboarding_prefs") || "{}");'''
new_load_else = '''    } else {
      setPhase(testExamples.length > 0 ? "examples" : "quiz");
      const prefs = JSON.parse(localStorage.getItem("onboarding_prefs") || "{}");'''
text = text.replace(old_load_else, new_load_else)

# 4. Update localStorage saving
old_save = '''      localStorage.setItem(`quiz_state_${testId}`, JSON.stringify({
        currentIndex,'''
new_save = '''      localStorage.setItem(`quiz_state_${testId}`, JSON.stringify({
        phase,
        currentExampleIndex,
        currentIndex,'''
text = text.replace(old_save, new_save)

old_deps = '''  }, [currentIndex, selectedOption, status, timeLeft, correctAnswers, showHowToAnswer, isLoaded, testId]);'''
new_deps = '''  }, [phase, currentExampleIndex, currentIndex, selectedOption, status, timeLeft, correctAnswers, showHowToAnswer, isLoaded, testId]);'''
text = text.replace(old_deps, new_deps)

# 5. Timer logic
old_timer = '''  useEffect(() => {
    if (!isLoaded || status === "completed") return;'''
new_timer = '''  // Timer logic
  useEffect(() => {
    if (!isLoaded || status === "completed" || phase !== "quiz") return;'''
text = text.replace(old_timer, new_timer)

# 6. Status check for completed
old_completed_check = '''  if (!isLoaded) return null;

  if (status === "completed") {'''
new_completed_check = '''  if (!isLoaded) return null;

  if (phase === "examples") {
    const example = testExamples[currentExampleIndex];
    if (!example) return null;
    return (
      <div className="min-h-dvh flex flex-col bg-white font-din-round text-almost-black pb-[120px]">
        <header className="sticky top-0 bg-white py-4 px-4 md:px-6 z-30">
          <div className="max-w-[1024px] mx-auto flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-silver hover:text-charcoal font-bold text-2xl p-2 transition-colors"
            >
              ✕
            </button>
            <div className="grow max-w-[800px]">
              <ProgressBar progress={(currentExampleIndex / testExamples.length) * 100} />
            </div>
            <div className="font-bold text-sky-blue">
              Example {currentExampleIndex + 1}/{testExamples.length}
            </div>
          </div>
        </header>

        <main className="grow flex flex-col max-w-[800px] w-full mx-auto px-4 md:px-6 py-4 md:py-6">
          <h2 className="font-feather text-[20px] md:text-[28px] text-charcoal mb-4 leading-snug">
            {example.prompt}
          </h2>
          <div className="bg-sky-blue/10 rounded-2xl p-6 border-2 border-sky-blue/20">
            <p className="text-sky-blue font-bold mb-2 uppercase text-sm tracking-wider">Solution / Explanation</p>
            <div className="text-[17px] text-almost-black whitespace-pre-wrap leading-relaxed">
              {example.explanation}
            </div>
          </div>
        </main>
        
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-cloud-gray p-4 md:p-6 z-40">
          <div className="max-w-[1024px] mx-auto flex justify-end">
            <button
              onClick={() => {
                if (currentExampleIndex < testExamples.length - 1) {
                  setCurrentExampleIndex(prev => prev + 1);
                } else {
                  setPhase("quiz");
                }
              }}
              className="bg-duo-green text-white font-bold text-[17px] h-[50px] px-8 rounded-2xl shadow-[0_4px_0_#3f8f01] active:translate-y-1 active:shadow-none transition-all"
            >
              {currentExampleIndex < testExamples.length - 1 ? "NEXT EXAMPLE" : "START TEST"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "completed" || phase === "completed") {'''
text = text.replace(old_completed_check, new_completed_check)

# 7. handleContinue & handleRetake update
old_retake = '''  const handleRetake = () => {
    localStorage.removeItem(`quiz_state_${testId}`);
    setCurrentIndex(0);'''
new_retake = '''  const handleRetake = () => {
    localStorage.removeItem(`quiz_state_${testId}`);
    setPhase(testExamples.length > 0 ? "examples" : "quiz");
    setCurrentExampleIndex(0);
    setCurrentIndex(0);'''
text = text.replace(old_retake, new_retake)

# Check if handleEnter keyboard shortcut needs phase check
old_keyboard = '''      if (e.key === "Enter") {
        if (status === "selected" && selectedOption !== null) {'''
new_keyboard = '''      if (e.key === "Enter") {
        if (phase === "examples") {
            if (currentExampleIndex < testExamples.length - 1) {
              setCurrentExampleIndex(prev => prev + 1);
            } else {
              setPhase("quiz");
            }
            return;
        }
        if (status === "selected" && selectedOption !== null) {'''
text = text.replace(old_keyboard, new_keyboard)


with codecs.open('app/lesson/page.tsx', 'w', 'utf-8') as f:
    f.write(text)

print("Updated app/lesson/page.tsx")
