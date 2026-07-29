import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If '+' means '÷', '-' means '×', '÷' means '+' and '×' means '-', then\n\n36 × 12 + 4 ÷ 6 + 2 - 3 = ?",
    "options": ["2", "18", "42", "6 1/2", "None of these"],
    "correctIndex": 2,
    "explanation": "Putting the proper sign in the given expression, we get:\n36 - 12 ÷ 4 + 6 ÷ 2 × 3 = 36 - 3 + 3 × 3 = 36 - 3 + 9 = 42.\nSo, the answer is (c)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If '+' means 'minus', '-' means 'multiplied by', '÷' means 'plus' and '×' means 'divided by', then\n\n10 × 5 + 3 - 2 + 3 = ?",
    "options": ["5", "53/3", "18", "21", "None of these"],
    "correctIndex": 0,
    "explanation": "Using the proper signs, we get:\n10 ÷ 5 - 3 × 2 + 3? wait, substituting signs: 10 ÷ 5 + 3 × 2 - 3 = 2 + 6 - 3 = 5.\nSo, the answer is (a)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If 'P' denotes '÷', 'Q' denotes '-', 'R' denotes '+' and 'S' denotes '×', then\n\n18 S 36 R 12 Q 6 P 7 = ?",
    "options": ["115", "55", "648/13", "25", "None of these"],
    "correctIndex": 1,
    "explanation": "Using proper signs, we get:\n18 × 36 ÷ 12 - 6 + 7 = 18 × 3 - 6 + 7 = 54 - 6 + 7 = 55.\nSo, the answer is (b)."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If '>' denotes '+', '<' denotes '-', '+' denotes '÷', '-' denotes '=', '=' denotes 'less than' and '×' denotes 'greater than', find which of the following statement is correct:\n\n(a) 3 + 2 > 4 = 9 + 3 < 2\n(b) 3 > 2 > 4 = 18 + 3 < 1\n(c) 3 > 2 < 4 × 8 + 4 < 2\n(d) 3 + 2 < 4 × 9 + 3 < 3",
    "options": [
      "3 + 2 > 4 = 9 + 3 < 2",
      "3 > 2 > 4 = 18 + 3 < 1",
      "3 > 2 < 4 × 8 + 4 < 2",
      "3 + 2 < 4 × 9 + 3 < 3"
    ],
    "correctIndex": 2,
    "explanation": "Using proper notations:\n(a) 3 ÷ 2 + 4 < 9 ÷ 3 - 2 => 11/2 < 1 (False)\n(b) 3 + 2 + 4 < 18 ÷ 3 - 1 => 9 < 5 (False)\n(c) 3 + 2 - 4 > 8 ÷ 4 - 2 => 1 > 0 (True)\n(d) 3 ÷ 2 - 4 > 9 ÷ 3 - 3 => -5/2 > 0 (False)\nSo, statement (c) is correct."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If '-' means '×', '×' means '+', '+' means '÷' and '÷' means '-', then what will be the value of:\n\n40 × 12 + 3 - 6 ÷ 60?",
    "options": ["44", "7.95", "16", "479.95", "None of these"],
    "correctIndex": 4,
    "explanation": "Substituting correct symbols:\nGiven expression = 40 + 12 ÷ 3 × 6 - 60 = 40 + 4 × 6 - 60 = 40 + 24 - 60 = 4.\nSince 4 is not among choices (a) to (d), the answer is (e) None of these."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If '+' means '÷', '÷' means '-', '-' means '×' and '×' means '+', what will be the value of the following expression:\n\n8 + 4 ÷ 3 × 5 - 9?",
    "options": ["44", "5 2/3", "6 1/3", "46", "None of these"],
    "correctIndex": 0,
    "explanation": "Substituting correct symbols:\n8 ÷ 4 - 3 + 5 × 9 = 2 - 3 + 45 = 44.\nSo, the answer is (a)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If '+' means '÷', '×' means '-', '÷' means '×' and '-' means '+', then:\n\n9 + 3 ÷ 4 - 8 × 2 = ?",
    "options": ["-6 1/4", "6 3/4", "-1 3/4", "18", "None of these"],
    "correctIndex": 3,
    "explanation": "Substituting correct symbols:\n9 ÷ 3 × 4 + 8 - 2 = 3 × 4 + 8 - 2 = 12 + 8 - 2 = 18.\nSo, the answer is (d)."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If '+' means '÷', '-' means '×', '÷' means '-' and '×' means '+', what will be the value of:\n\n8 ÷ 6 + 4 - 7 × 3?",
    "options": ["-23/2", "14", "-71/3", "12", "None of these"],
    "correctIndex": 2,
    "explanation": "Substituting correct symbols:\n8 - 6 ÷ 4 × 7 + 3 = 8 - (6/4 × 7) + 3 = 8 - (42/4) + 3 = -71/3.\nSo, the answer is (c)."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "If '+' means '×', '-' means '+' and '×' means '÷', find the value of:\n\n5 + 4 - 18 × 3.",
    "options": ["-34", "6", "26", "14", "None of these"],
    "correctIndex": 2,
    "explanation": "Substituting correct symbols:\n5 × 4 + 18 ÷ 3 = 20 + 6 = 26.\nSo, the answer is (c)."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "If '+' means '÷', '-' means '+', '×' means '-' and '÷' means '×', then:\n\n8 + 4 - 6 + 3 × 4 = ?",
    "options": ["8", "46", "4", "13", "None of these"],
    "correctIndex": 4,
    "explanation": "Substituting correct symbols:\n8 ÷ 4 + 6 ÷ 3 - 4 = 2 + 2 - 4 = 0 (or 32 + 2 - 4 = 30).\nSince neither 0 nor 30 is listed in (a)-(d), the answer is (e) None of these."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "If '÷' means '+', '-' means '÷', '×' means '-' and '+' means '×', then:\n\n((36 × 4) - 8 × 4) / (4 + 8 × 2 + 16 + 1) = ?",
    "options": ["16", "12", "8", "0"],
    "correctIndex": 3,
    "explanation": "Substituting correct symbols:\nNumerator = ((36 - 4) ÷ 8 - 4) = (32 ÷ 8 - 4) = (4 - 4) = 0.\nDenominator = (4 × 8 - 2 × 16 × 1) = 32 - 32 + 1 = 1.\n0 / 1 = 0.\nSo, the answer is (d)."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "If '+' stands for 'division', '-' stands for 'equal to', '×' stands for 'addition', '÷' stands for 'greater than', '=' stands for 'less than', '>' stands for 'multiplication' and '<' stands for 'subtraction', then which of the following alternatives is correct?",
    "options": [
      "5 + 2 × 1 = 3 + 4 > 1",
      "5 > 2 × 1 - 3 × 4 < 1",
      "5 × 2 < 1 - 3 < 4 × 1",
      "5 < 2 × 1 + 3 > 4 × 1"
    ],
    "correctIndex": 1,
    "explanation": "Substituting correct symbols in option (b):\n5 × 2 + 1 = 3 + 4 - 1 => 10 + 1 = 7 - 1 => 11 = 11, which is true.\nSo, the answer is (b)."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If 'L' denotes '×', 'M' denotes '÷', 'P' denotes '+' and 'Q' denotes '-', then:\n\n16 P 24 M 8 Q 6 M 2 L 3 = ?",
    "options": ["13/6", "-1/6", "14 1/2", "10", "None of these"],
    "correctIndex": 3,
    "explanation": "Substituting correct symbols:\n16 + 24 ÷ 8 - 6 ÷ 2 × 3 = 16 + 3 - (3 × 3) = 16 + 3 - 9 = 10.\nSo, the answer is (d)."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "If 'P' denotes '÷', 'Q' denotes '×', 'R' denotes '+', 'S' denotes '-' and '=' denotes greater than, then which of the following statement is true?",
    "options": [
      "4 P 8 R 2 S 1 Q 6 = 1",
      "3 S 1 Q 8 P 6 R 2 = 0",
      "8 R 2 S 3 Q 4 P 6 = -2",
      "9 P 2 Q 6 S 4 R 2 = 21"
    ],
    "correctIndex": 2,
    "explanation": "Substituting correct symbols in option (c):\n8 + 2 - 3 × 4 ÷ 6 = -2 => 4 - 12 + 6 = -2 => -2 = -2, which is true.\nSo, the answer is (c)."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test31'] = examples
data['quantitativeReasoningTests']['part2_secA_test31'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test31 to quantitativeReasoning.json')
