import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')
import re
import codecs

q = []

q.append({
  "id": 21,
  "type": "text",
  "prompt": "The salaries of A, B, C are in the ratio 2 : 3 : 5. If the increments of 15%, 10% and 20% are allowed respectively in their salaries, then what will be the new ratio of their salaries?",
  "options": ["(A) 3 : 3 : 10", "(B) 10 : 11 : 20", "(C) 23 : 33 : 60", "(D) cannot be determined", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Let their salaries be 2k, 3k and 5k.\nNew salaries are respectively 2k(1.15), 3k(1.10) and 5k(1.20)\nRatio of new salaries = 2.3k : 3.3k : 6k = 23 : 33 : 60"
})

q.append({
  "id": 22,
  "type": "text",
  "prompt": "If ₹ 782 be divided into three parts, proportional to 1/2 : 2/3 : 3/4, then the first part is:",
  "options": ["(A) ₹ 182", "(B) ₹ 190", "(C) ₹ 196", "(D) ₹ 204", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Given ratio is 1/2 : 2/3 : 3/4\nMultiply by LCM 12 = 6 : 8 : 9\nFirst part = 6 / (6+8+9) × 782 = 6 / 23 × 782 = 6 × 34 = ₹ 204"
})

q.append({
  "id": 23,
  "type": "text",
  "prompt": "If A : B = 1/2 : 3/8, B : C = 1/3 : 5/9 and C : D = 5/6 : 3/4, then the ratio A : B : C : D is",
  "options": ["(A) 4 : 6 : 8 : 10", "(B) 6 : 4 : 8 : 10", "(C) 6 : 8 : 9 : 10", "(D) 8 : 6 : 10 : 9", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Given,\nA : B = 1/2 : 3/8 = 4 : 3\nB : C = 1/3 : 5/9 = 3 : 5\nC : D = 5/6 : 3/4 = 10 : 9\nMaking common ratios:\nA : B = 8 : 6, B : C = 6 : 10, C : D = 10 : 9\n∴ A : B : C : D = 8 : 6 : 10 : 9"
})

q.append({
  "id": 24,
  "type": "text",
  "prompt": "The sum of three numbers is 98. If the ratio of the first to the second is 2 : 3 and that of the second to the third is 5 : 8, then the second number is:",
  "options": ["(A) 20", "(B) 30", "(C) 48", "(D) 58", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Let the numbers be x, y and z\nx + y + z = 98\nx : y = 2 : 3\ny : z = 5 : 8\n=> x : y : z = (2×5) : (3×5) : (3×8) = 10 : 15 : 24\ny = 15 / (10 + 15 + 24) × 98 = 15/49 × 98 = 30"
})

q.append({
  "id": 25,
  "type": "text",
  "prompt": "A sum of ₹ 1,300 is divided amongst P, Q, R and S such that P's share / Q's share = Q's share / R's share = R's share / S's share = 2/3. Then P's share is",
  "options": ["(A) ₹ 140", "(B) ₹ 160", "(C) ₹ 240", "(D) ₹ 320", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "P/Q = 2/3, Q/R = 2/3, R/S = 2/3\nP : Q = 2 : 3\nQ : R = 2 : 3\nR : S = 2 : 3\nP : Q : R : S = (2×2×2) : (3×2×2) : (3×3×2) : (3×3×3) = 8 : 12 : 18 : 27\nP's share = 8 / (8+12+18+27) × 1300 = 8/65 × 1300 = ₹ 160"
})

q.append({
  "id": 26,
  "type": "text",
  "prompt": "A and B together have ₹ 1210. If 4/15 of A's amount is equal to 2/5 of B's amount, how much amount does B have?",
  "options": ["(A) ₹ 460", "(B) ₹ 484", "(C) ₹ 550", "(D) ₹ 664", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Let the amount with B be x and amount with A be y.\nx + y = 1210\n4/15 y = 2/5 x => 4y = 6x => 2y = 3x => y = 3x/2\nSubstituting, x + 3x/2 = 1210\n5x/2 = 1210\nx = 1210 × 2 / 5 = ₹ 484"
})

q.append({
  "id": 27,
  "type": "text",
  "prompt": "Two numbers are respectively 20% and 50% more than a third number. The ratio of the two numbers is",
  "options": ["(A) 2 : 5", "(B) 3 : 5", "(C) 4 : 5", "(D) 6 : 7", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Let the third number be x.\nThen first number = 1.2x and second number = 1.5x\nFirst number : Second number = 1.2x : 1.5x = 4 : 5"
})

q.append({
  "id": 28,
  "type": "text",
  "prompt": "The ratio of the number of boys and girls in a college is 7 : 8. If the percentage increase in the number of boys and girls is 20% and 10% respectively, what will be the new ratio?",
  "options": ["(A) 8 : 9", "(B) 17 : 18", "(C) 21 : 22", "(D) cannot be determined", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Ratio of boys : girls = 7 : 8\nLet number of boys be 7k and girls be 8k.\nNew ratio = 7k(1.2) : 8k(1.1) = 8.4k : 8.8k = 21 : 22"
})

q.append({
  "id": 29,
  "type": "text",
  "prompt": "A sum of money is to be distributed among A, B, C and D in the proportion of 5 : 2 : 4 : 3. If C gets ₹ 1000 more than D, what is B's share?",
  "options": ["(A) ₹ 500", "(B) ₹ 1500", "(C) ₹ 2000", "(D) None of these", "(E) ₹ 2500"],
  "correctIndex": 2,
  "explanation": "Let the shares be 5x, 2x, 4x, and 3x.\nGiven C gets ₹ 1000 more than D => 4x - 3x = 1000 => x = 1000\nTotal amount = 14x = 14000\nB's share = 2x = 2 × 1000 = ₹ 2000"
})

import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

with codecs.open(json_path, 'r', 'utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}
if 'quantitative_reasoning_test4' not in data['quantitativeReasoningTests']:
    data['quantitativeReasoningTests']['quantitative_reasoning_test4'] = []

data['quantitativeReasoningTests']['quantitative_reasoning_test4'].extend(q)

with codecs.open(json_path, 'w', 'utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Updated quantitative_reasoning_test4 with Q21-29')
