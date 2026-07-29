import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Based on: 'A + B means A is son of B; A - B means A is wife of B; A × B means A is brother of B; A ÷ B means A is mother of B; A = B means A is sister of B.' What does P + R - Q mean?",
    "options": ["Q is the father of P", "Q is the son of P", "Q is the uncle of P", "Q is the brother of P"],
    "correctIndex": 0,
    "explanation": "P + R - Q means P is the son of R who is the wife of Q. i.e. Q is the father of P."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Based on the same codes: What does P × R ÷ Q mean?",
    "options": ["P is the brother of R", "P is the father of Q", "P is the uncle of Q", "P is the nephew of Q"],
    "correctIndex": 2,
    "explanation": "P × R ÷ Q means P is the brother of R who is the mother of Q. i.e., P is the uncle of Q."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Based on the same codes: What does P = R + Q mean?",
    "options": ["P is the aunt of Q", "P is the daughter of Q", "P is the niece of Q", "P is the sister of Q"],
    "correctIndex": 1,
    "explanation": "P = R + Q means P is the sister of R who is the son of Q. i.e. P is the daughter of Q."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Based on the same codes: What does P = R ÷ Q mean?",
    "options": ["P is the aunt of Q", "P is the sister of Q", "Q is the niece of P", "Q is the daughter of P"],
    "correctIndex": 0,
    "explanation": "P = R ÷ Q means P is the sister of R who is the mother of Q. i.e., P is the aunt of Q."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P ÷ R + S + Q, which of the following is true?",
    "options": ["P is the daughter of Q", "Q is the aunt of P", "P is the aunt of Q", "P is the mother of Q", "None of these"],
    "correctIndex": 2,
    "explanation": "P ÷ R + S + Q means P is the daughter of R who is the father of S who is the father of Q i.e. P is the sister of S who is the father of Q i.e. P is the aunt of Q."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P - R + Q, which of the following statement is true?",
    "options": ["P is the mother of Q", "Q is the daughter of P", "P is the aunt of Q", "P is the sister of Q", "P is the niece of Q"],
    "correctIndex": 0,
    "explanation": "P - R + Q means P is the wife of R who is the father of Q, i.e. P is the mother of Q."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P × R ÷ Q, which of the following statement is true?",
    "options": ["P is the uncle of Q", "P is the father of Q", "P is the brother of Q", "P is the son of Q", "None of these"],
    "correctIndex": 3,
    "explanation": "P × R ÷ Q means P is the brother of R who is the daughter of Q, i.e. P is the son of Q."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P × R - Q, which of the following is true?",
    "options": ["P is brother-in-law of Q", "P is the brother of Q", "P is the uncle of Q", "P is the father of Q", "None of these"],
    "correctIndex": 0,
    "explanation": "P × R - Q means P is the brother of R who is the wife of Q, i.e. P is the brother-in-law of Q."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P + R ÷ Q, which of the following is true?",
    "options": ["P is the brother of Q", "P is the son of Q", "P is the husband of Q", "P is the father of Q", "P is the uncle of Q"],
    "correctIndex": 2,
    "explanation": "P + R ÷ Q means P is the father of R who is the daughter of Q, i.e. P is the father of R and Q is the mother of R, i.e. P is the husband of Q."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P ÷ R + Q, which of the following is true?",
    "options": ["P is the father of Q", "P is the brother of Q", "P is the mother of Q", "P is the sister of Q", "None of these"],
    "correctIndex": 3,
    "explanation": "P ÷ R + Q means P is the daughter of R who is the father of Q, i.e., P is the sister of Q."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P × R + Q, which of the following is true?",
    "options": ["P is the uncle of Q", "P is the father of Q", "P is brother-in-law of Q", "P is grandfather of Q", "P is son-in-law of Q"],
    "correctIndex": 0,
    "explanation": "P × R + Q means P is the brother of R who is the father of Q, i.e. P is the uncle of Q."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Given: 'A + B: A father of B; A - B: A wife of B; A × B: A brother of B; A ÷ B: A daughter of B.' If P - R × Q, which of the following is true?",
    "options": ["P is the sister of Q", "Q is the husband of P", "P is the sister-in-law of Q", "Q is the sum of P", "None of these"],
    "correctIndex": 2,
    "explanation": "P - R × Q means P is the wife of R who is the brother of Q, i.e. P is the sister-in-law of Q."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If A + B means A is mother of B; A ÷ B means A is brother of B; A × B means A is son of B and A - B means A is daughter of B, which of the following means C is the niece of D?",
    "options": ["D - C", "D × P - C", "C - P ÷ D", "P + D ÷ C", "D - P ÷ C"],
    "correctIndex": 2,
    "explanation": "C is the niece of D means C is the daughter of the brother (say P) of D, i.e. C - P ÷ D."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "If A + B means A is sister of B, A - B means A is brother of B, A × B means A is daughter of B, which of the following shows the relation that E is the maternal uncle of D?",
    "options": ["D + F × E", "D - F × E", "D × F + E", "D × F - E", "None of these"],
    "correctIndex": 2,
    "explanation": "E is the maternal uncle of D means D is the daughter of the sister (say F) of E, i.e. D × F + E."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test20'] = examples
data['quantitativeReasoningTests']['part2_secA_test20'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test20 with 4 examples and 10 questions to quantitativeReasoning.json')
