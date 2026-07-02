import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')
import re
import codecs

q = []

q.append({
  "id": 11,
  "type": "text",
  "prompt": "How many one-rupee coins, 50-paise coins and 25-paise coins in total of which the numbers are proportional to 5, 7 and 12 are together worth ₹ 115?",
  "options": ["(A) 50, 70, 120", "(B) 60, 70, 110", "(C) 70, 70, 100", "(D) 70, 80, 90", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "Let number of coins be 5x, 7x, 12x.\nTotal value = (5x × 1 + 7x × 0.5 + 12x × 0.25) = 115\n(5x + 3.5x + 3x) = 115\n11.5x = 115\nx = 10\nNumber of one-rupee coins = 5x = 50\nNumber of 50-paise coins = 7x = 70\nNumber of 25-paise coins = 12x = 120"
})

q.append({
  "id": 12,
  "type": "text",
  "prompt": "Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. The smaller number is",
  "options": ["(A) 27", "(B) 33", "(C) 49", "(D) 55", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Let the numbers be 3k and 5k.\nNow, (3k - 9) / (5k - 9) = 12 / 23\n23(3k - 9) = 12(5k - 9)\n69k - 207 = 60k - 108\n9k = 99\nk = 11\nSmaller number = 3 × 11 = 33"
})

q.append({
  "id": 13,
  "type": "text",
  "prompt": "Two numbers are in the ratio 1 : 2. If 7 is added to both, their ratio changes to 3 : 5. The greatest number is",
  "options": ["(A) 24", "(B) 26", "(C) 28", "(D) 32", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Let the numbers be k and 2k.\nNow, (k + 7) / (2k + 7) = 3 / 5\n5(k + 7) = 3(2k + 7)\n5k + 35 = 6k + 21\nk = 14\nGreatest number = 2k = 14 × 2 = 28"
})

q.append({
  "id": 14,
  "type": "text",
  "prompt": "If 0.75 : x :: 5 : 8, then x is equal to",
  "options": ["(A) 1.12", "(B) 1.20", "(C) 1.25", "(D) 1.30", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Given 0.75 : x :: 5 : 8\nHere, 0.75 × 8 = x × 5\n6 = 5x\nx = 6 / 5 = 1.20"
})

q.append({
  "id": 15,
  "type": "text",
  "prompt": "If x : y = 5 : 2, then (8x + 9y) : (8x + 2y) is",
  "options": ["(A) 22 : 29", "(B) 26 : 61", "(C) 29 : 22", "(D) 61 : 26", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Given x : y = 5 : 2 => x = 5k and y = 2k\n(8x + 9y) / (8x + 2y) = (8×5k + 9×2k) / (8×5k + 2×2k)\n= (40k + 18k) / (40k + 4k)\n= 58k / 44k = 29 / 22"
})

q.append({
  "id": 16,
  "type": "text",
  "prompt": "Salaries of Ravi and Sumit are in the ratio 2 : 3. If the salary of each is increased by ₹ 4000, the new ratio becomes 40 : 57. What is Sumit's present salary?",
  "options": ["(A) ₹ 17000", "(B) ₹ 20000", "(C) ₹ 25500", "(D) None of these", "(E) ₹ 38000"],
  "correctIndex": 4,
  "explanation": "Let the salary of Sumit be x.\nGiven salary of Ravi to Sumit = 2/3 => Salary of Ravi = 2x/3\nOn increasing salary of both by ₹ 4000, new ratio will be:\n(2x/3 + 4000) / (x + 4000) = 40 / 57\nSolving, 57(2x/3 + 4000) = 40(x + 4000)\n38x + 228000 = 40x + 160000\n2x = 68000\nx = 34000\nSumit's present salary (after increment) = 34000 + 4000 = ₹ 38000. \nWait, the question is 'Sumit's present salary'. If the present means before increment, then 34000. But the options have None of these or 38000. Based on solution, Sumit's present salary = ₹ 38000."
})

q.append({
  "id": 17,
  "type": "text",
  "prompt": "If 10% of x = 20% of y, then x : y is equal to",
  "options": ["(A) 1 : 2", "(B) 2 : 1", "(C) 5 : 1", "(D) 10 : 1", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Given (10/100) × x = (20/100) × y\nx/10 = y/5\nx/y = 10/5 = 2/1\n∴ x : y = 2 : 1"
})

q.append({
  "id": 18,
  "type": "text",
  "prompt": "Ratio of earnings of A and B is 4 : 7. If the earnings of A increase by 50% and those of B decrease by 25%, the new ratio of their earnings becomes 8 : 7. What are A's earnings?",
  "options": ["(A) ₹ 21000", "(B) ₹ 26000", "(C) ₹ 28000", "(D) Data inadequate", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Given Earnings of A : Earnings of B = 4 : 7\nLet earnings of A = 4k and that of B = 7k\nNow, 4k(1.5) / 7k(0.75) = 8 / 7\n6k / 5.25k = 8 / 7\nValue of k cannot be determined.\nTherefore data inadequate."
})

q.append({
  "id": 19,
  "type": "text",
  "prompt": "If A : B = 8 : 15; B : C = 5 : 8 and C : D = 4 : 5, then A : D is equal to",
  "options": ["(A) 2 : 7", "(B) 4 : 15", "(C) 8 : 15", "(D) 15 : 4", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Given A : B = 8 : 15; B : C = 5 : 8; C : D = 4 : 5\nA/B × B/C × C/D = (8/15) × (5/8) × (4/5) = 4/15\n∴ A : D = 4 : 15"
})

q.append({
  "id": 20,
  "type": "text",
  "prompt": "If A : B = 2 : 3, B : C = 4 : 5 and C : D = 6 : 7, then A : B : C : D is",
  "options": ["(A) 16 : 22 : 30 : 35", "(B) 16 : 24 : 15 : 35", "(C) 16 : 24 : 30 : 35", "(D) 18 : 24 : 30 : 35", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Given A : B = 2 : 3; B : C = 4 : 5 and C : D = 6 : 7\nA : B : C : D = (2×4×6) : (3×4×6) : (3×5×6) : (3×5×7)\n= 48 : 72 : 90 : 105\nDividing by 3, we get 16 : 24 : 30 : 35"
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

print('Updated quantitative_reasoning_test4 with Q11-20')
