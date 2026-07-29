import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

dir_text = "Directions (1 to 10): In each question below are given two statements followed by two conclusions numbered I and II. You have to take the given two statements to be true even if they seem to be at variance from commonly known facts and then decide which of the given conclusions logically follows from the given two statements."

std_options = [
  "Only conclusion I follows",
  "Only conclusion II follows",
  "Either conclusion I or II follows",
  "Neither conclusion I nor II follows",
  "Both conclusions I and II follow"
]

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Directions: Determine which conclusion follows from the given statements.\n\nStatements:\n1. All desks are tables.\n2. Some tables are chairs.\n\nConclusions:\nI. All tables are desks.\nII. Some tables are not chairs.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "The conclusion cannot contain the middle term. Since both conclusions I and II contain the middle term ('tables'), neither conclusion follows."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Directions: Determine which conclusion follows from the given statements.\n\nStatements:\n1. Some students are boys.\n2. All boys are fools.\n\nConclusions:\nI. All fools are boys.\nII. Some students are fools.",
    "options": std_options,
    "correctIndex": 1,
    "explanation": "Statement 1 is an I-type proposition (neither term distributed). Statement 2 is an A-type proposition which distributes 'boys'. Conclusion I distributes 'fools' without it being distributed in premises, so I does not follow. Conclusion II ('Some students are fools') validly follows."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nAll cakes are ice creams.\nAll ice creams are toffees.\n\nConclusions:\nI. All cakes are toffees.\nII. All toffees are ice creams.",
    "options": std_options,
    "correctIndex": 0,
    "explanation": "Since both statements are universal affirmative (A-type), combining 'All cakes are ice creams' and 'All ice creams are toffees' yields 'All cakes are toffees'. Conclusion II contains the middle term, so only conclusion I follows."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nSome pearls are gems.\nSome gems are ornaments.\n\nConclusions:\nI. Some gems are pearls.\nII. Some ornaments are gems.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "Since both premises are particular (I-type), no valid conclusion can be drawn from two particular premises. Neither conclusion I nor II follows."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nAll lights are trucks.\nSome trucks are jeeps.\n\nConclusions:\nI. All jeeps are lights.\nII. Some lights are jeeps.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "The middle term 'trucks' is not distributed in either premise (it is predicate in A-type and subject in I-type). Since middle term is not distributed, no conclusion follows."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nLawyers married only fair girls.\nSobha is very fair.\n\nConclusions:\nI. Sobha was married to a lawyer.\nII. Sobha was not married to a lawyer.",
    "options": std_options,
    "correctIndex": 2,
    "explanation": "The premises state lawyers marry only fair girls, but do not specify whether all fair girls marry lawyers. Thus, Sobha either was married to a lawyer or was not."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nAll pencils are bricks.\nAll bricks are bottles.\n\nConclusions:\nI. All pencils are bottles.\nII. All bricks are pencils.",
    "options": std_options,
    "correctIndex": 0,
    "explanation": "Both premises are universal affirmative (A-type). Combining 'All pencils are bricks' and 'All bricks are bottles' gives 'All pencils are bottles'. So only conclusion I follows."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nSome books are pencils.\nSome pencils are pens.\n\nConclusions:\nI. Some books are pens.\nII. Some pens are books.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "Both premises are particular (I-type). No deduction can be derived from two particular premises. Neither conclusion I nor II follows."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nAll trays are erasers.\nAll pens are erasers.\n\nConclusions:\nI. All trays are pens.\nII. Some pens are trays.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "The middle term 'erasers' acts as predicate in both A-type statements, so it is not distributed in either premise. No valid conclusion follows."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nAll birds are trees.\nSome trees are hens.\n\nConclusions:\nI. Some birds are hens.\nII. Some hens are trees.",
    "options": std_options,
    "correctIndex": 0,
    "explanation": "With one universal and one particular premise, the conclusion must be particular. Only conclusion I ('Some birds are hens') follows."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nSome cooks are lazy.\nAll boys are lazy.\n\nConclusions:\nI. Some boys are cooks.\nII. Some cooks are boys.",
    "options": std_options,
    "correctIndex": 3,
    "explanation": "The middle term 'lazy' is predicate in both an I-type and A-type proposition, so it is never distributed. No conclusion follows."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": dir_text + "\n\nStatements:\nSohan is a good sportsmen.\nSportsmen are healthy.\n\nConclusions:\nI. All healthy person are sportsmen.\nII. Sohan is healthy.",
    "options": std_options,
    "correctIndex": 1,
    "explanation": "Conclusion I distributes 'healthy' without distribution in premises and contains the middle term. Conclusion II ('Sohan is healthy') follows directly. So only conclusion II follows."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secB_test1'] = examples
data['quantitativeReasoningTests']['part2_secB_test1'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secB_test1 to quantitativeReasoning.json')
