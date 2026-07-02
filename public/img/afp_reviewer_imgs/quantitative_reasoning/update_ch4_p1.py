import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')
import re
import codecs

examples = []

examples.append({
  "id": 1,
  "type": "text",
  "prompt": "Find the number which when added to the ratio 7 : 9, makes it equal to 4 : 5.",
  "explanation": "a : b = 7 : 9; c : d = 4 : 5\nThe required number = (ad - bc) / (c - d) = (7×5 - 9×4) / (4 - 5) = -1 / -1 = +1"
})

examples.append({
  "id": 2,
  "type": "text",
  "prompt": "The ratio of incomes of Ajith and Sunil last year was 4 : 5. The ratio of their own incomes of last year and this year are 6 : 7 and 5 : 6 respectively. If the total sum of their present incomes is ₹ 6,400, find the present income of Ajith.",
  "explanation": "The ratio of present income = 4 × 7/6 : 5 × 6/5\n= 28/6 : 30/5 = 14/3 : 6 = 14 : 18 = 7 : 9\nAjith's present income = 7 / (7 + 9) × 6400 = ₹ 2800"
})

examples.append({
  "id": 3,
  "type": "text",
  "prompt": "A bucket contains a mixture of milk and water in the proportion 2 : 1. If 6 litres of mixture is replaced by 6 litres of water, then the ratio of the two liquids becomes 4 : 5, what was the quantity of water contained in the bucket?",
  "explanation": "Let the quantity of mixture be x litres.\nSince milk and water are in the ratio 2 : 1, milk = 2x/3 and water = x/3.\nWhen 6 litres of mixture is replaced by water, milk becomes 2x/3 - (2/3)*6 = 2x/3 - 4.\nWater becomes x/3 - (1/3)*6 + 6 = x/3 + 4.\nNow, (2x/3 - 4) / (x/3 + 4) = 4 / 5\n5(2x/3 - 4) = 4(x/3 + 4)\n10x/3 - 20 = 4x/3 + 16\n6x/3 = 36 => 2x = 36 => x = 18.\nOriginal quantity of water = x/3 = 18/3 = 6 litres."
})

examples.append({
  "id": 4,
  "type": "text",
  "prompt": "A vessel contains milk and water in the ratio 5 : 4. If 27 litres of mixture is removed and the same quantity of water is added, the ratio becomes 4 : 5. What quantity does the vessel contain?",
  "explanation": "Let the vessel contain 5x litres of milk and 4x litres of water.\nThe removed quantity of mixture contains 5/9 × 27 = 15 litres of milk and 27 - 15 = 12 litres of water.\nNow, 5x - 15 : (4x - 12 + 27) = 4 : 5\n(5x - 15) : (4x + 15) = 4 : 5\n(5x - 15) / (4x + 15) = 4/5\n25x - 75 = 16x + 60\n9x = 135 => x = 15\nVessel contains (5 + 4)x = 9 × 15 = 135 litres."
})

examples.append({
  "id": 5,
  "type": "text",
  "prompt": "A sum of ₹ 1,300 is divided amongst P, Q, R and S such that P's share / Q's share = Q's share / R's share = R's share / S's share = 2 / 3. Then P's share is:",
  "explanation": "P/Q = 2/3, Q/R = 2/3, R/S = 2/3\nP : Q = 2 : 3\nQ : R = 2 : 3\nR : S = 2 : 3\nMultiplying ratios to make Q and R common:\nP : Q : R : S = (2×2×2) : (3×2×2) : (3×3×2) : (3×3×3) = 8 : 12 : 18 : 27\nSum of ratios = 8 + 12 + 18 + 27 = 65\nP's share = (8 / 65) × 1300 = ₹ 160."
})


q = []

q.append({
  "id": 1,
  "type": "text",
  "prompt": "If A : B = 7 : 9 and B : C = 8 : 11, find A : B : C.",
  "options": ["(A) 72 : 56 : 99", "(B) 56 : 72 : 99", "(C) 99 : 56 : 72", "(D) 56 : 99 : 72", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Given A : B = 7 : 9; B : C = 8 : 11\nMaking the second proportion equal in both ratios, we get\nA : B = 7 × 8 : 9 × 8 = 56 : 72\nB : C = 8 × 9 : 11 × 9 = 72 : 99\n∴ A : B : C = 56 : 72 : 99"
})

q.append({
  "id": 2,
  "type": "text",
  "prompt": "The sum of two numbers is 25 and their difference is 7 1/2. Find the ratio of the numbers.",
  "options": ["(A) 6 : 13", "(B) 7 : 13", "(C) 13 : 7", "(D) 13 : 6", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Given a + b = 25, a - b = 7 1/2 = 15/2\nUsing Componendo and Dividendo: (a+b)/(a-b) = 25 / (15/2) = 50/15 = 10/3\n(a+b + a-b) / (a+b - (a-b)) = (10+3) / (10-3)\n2a/2b = 13/7\na/b = 13/7"
})

q.append({
  "id": 3,
  "type": "text",
  "prompt": "₹ 120 is divided among 6 men, 8 women and 6 boys so that a man gets as much as 2 boys and 2 women get as much as 3 boys. Find the share of a boy.",
  "options": ["(A) ₹ 3", "(B) ₹ 6", "(C) ₹ 12", "(D) ₹ 4", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Given share to men, women and boys as follows:\nshare for 2 women = share for 3 boys\nshare for 1 man = share for 2 boys\nTotal share = 6(2 boys) + 8/2(3 boys) + 6(boys) share = ₹ 120\ni.e. Share of (12 + 12 + 6) boys = ₹ 120\n30 boys = 120\nShare of a boy = 120 / 30 = ₹ 4"
})

q.append({
  "id": 4,
  "type": "text",
  "prompt": "What should be subtracted from the terms of the ratio 19 : 23 makes it equal to the ratio of 3 : 4",
  "options": ["(A) 7", "(B) 6", "(C) 5", "(D) 4", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "If a number is subtracted from a : b and as a result it becomes c : d, then the number subtracted = (bc - ad) / (c - d)\nHere a : b = 19 : 23; c : d = 3 : 4\nNumber subtracted = (23×3 - 19×4) / (3 - 4) = (69 - 76) / (-1) = 7"
})

q.append({
  "id": 5,
  "type": "text",
  "prompt": "An employer reduces the number of his employees in the ratio 9 : 7 and increases their wages in the ratio 14 : 15. Find the ratio in which the bill of wages increases or decreases.",
  "options": ["(A) 1/3", "(B) 1/4", "(C) 1/5", "(D) 1/8", "(E) None of these"],
  "correctIndex": 4,
  "explanation": "New number of employees = 7/9 of old number of employees.\nNew wages = 15/14 × old wages\nResultant wages = 7/9 × 15/14 × old total wages\n= 5/6 × old total wages\n∴ Bill of wages decrease by 1/6 or 16.17%\nThe ratio is 6 : 5 (decrease)."
})

q.append({
  "id": 6,
  "type": "text",
  "prompt": "When wheat is ₹ 13 per kg, 75 men can be fed for 15 days at a certain cost. How many men can be fed for 45 days at the same cost, when wheat is ₹ 1 per kg?",
  "options": ["(A) 225", "(B) 250", "(C) 325", "(D) 175", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "(75 men × 15 days) / Qw1 = (x men × 45 days) / Qw2\nwhere Qw, quantity of wheat got for ₹ 13/kg.\nLet x be number of men in the second case.\nx = (75 × 15 × 13) / 45 = 25 × 13 = 325 men."
})

q.append({
  "id": 7,
  "type": "text",
  "prompt": "If 1,000 copies of a book of 25 sheets requires 50 reams of paper, how much paper is required for 5,000 copies of a book of 32 sheets?",
  "options": ["(A) 160", "(B) 320", "(C) 480", "(D) 640", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "(1000 × 25) / 50 = (5000 × 32) / x\nx = (5000 × 32 × 50) / (1000 × 25) = 320\n∴ 320 ream of paper is required."
})

q.append({
  "id": 8,
  "type": "text",
  "prompt": "Divide ₹ 1,000 among P, Q and R such that P gets 2/3 of Q's share and R gets 5/3 of Q's share. Then what is the share of Q?",
  "options": ["(A) 100", "(B) 200", "(C) 300", "(D) 400", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Let the share of Q be x.\nThen 2/3 x + x + 5/3 x = 1000\n10/3 x = 1000 => x = (3 × 1000) / 10 = 300\nP's share = 2/3 × 300 = ₹ 200\nQ's share = x = ₹ 300\nR's share = 5/3 × 300 = ₹ 500"
})

q.append({
  "id": 9,
  "type": "text",
  "prompt": "If 0.6 time one number is equal to 0.025 time the other, what is the ratio of two numbers?",
  "options": ["(A) 1/24", "(B) 5/24", "(C) 7/24", "(D) 11/24", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "Let the numbers be x and y.\n0.6 x = 0.025 y\nx/y = 0.025 / 0.6 = 25 / 600 = 1 / 24\n∴ Ratio of 2 numbers = 1 : 24."
})

q.append({
  "id": 10,
  "type": "text",
  "prompt": "Calculate the fourth proportional to the numbers 286, 78, 1342",
  "options": ["(A) 732", "(B) 671", "(C) 183", "(D) 366", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Let the fourth proportional be x.\nNow 286 : 78 = 1342 : x\n286 / 78 = 1342 / x\nCross multiplying, we get 286 × x = 78 × 1342\nx = (78 × 1342) / 286 = 366"
})


import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

with codecs.open(json_path, 'r', 'utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}
if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['quantitative_reasoning_test4'] = examples
data['quantitativeReasoningTests']['quantitative_reasoning_test4'] = q

with codecs.open(json_path, 'w', 'utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Updated quantitative_reasoning_test4 with examples and Q1-10')
