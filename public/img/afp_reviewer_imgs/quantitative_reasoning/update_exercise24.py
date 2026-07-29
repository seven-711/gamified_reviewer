import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Binoj's school bus is facing north when it reaches his school. After starting from Binoj's house, it turns right twice and then left before reaching the school. What direction was the bus facing when it left the bus stop in front of Binoj's house?",
    "options": ["South", "North", "East", "West", "None of these"],
    "correctIndex": 3,
    "explanation": "Working backwards from North: before reaching school, bus turned Left (was facing East). Before that, turned Right (was facing North). Before that, turned Right (was facing West). Thus, bus started facing West."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Binoj's school bus is facing north when it reaches his school. After starting from Binoj's house, it turns right twice and then left before reaching the school. What direction was the bus facing when it left the bus stop in front of Binoj's house?",
    "options": ["South", "North", "East", "West", "None of these"],
    "correctIndex": 3,
    "explanation": "Working backwards from North: before reaching school, bus turned Left (was facing East). Before that, turned Right (was facing North). Before that, turned Right (was facing West). Thus, bus started facing West."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "A, B, C, and D are playing cards. A and B are partners. D faces towards north. If A faces west, then who faces south?",
    "options": ["C", "B", "D", "Data inadequate", "None of these"],
    "correctIndex": 0,
    "explanation": "D faces North (so partner faces South). A faces West (partner B faces East). Partner of D is C, so C faces South."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Four persons P, Q, R, T. Q is SW of P; R is East of Q and SE of P; T is North of R in line with QP. In which direction of P is T located?",
    "options": ["South-east", "North", "North-east", "East"],
    "correctIndex": 2,
    "explanation": "Extending line QP from SW through P goes towards North-East. T is North-East of P."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "A and B start 200 m apart. B walks 60 m, turns left 20 m, turns right 40 m, turns right 20 m back to road. If A and B walk with same speed (140 m each), what is distance between them now?",
    "options": ["50 m", "40 m", "30 m", "20 m"],
    "correctIndex": 1,
    "explanation": "B is at 60 + 40 = 100 m along the road. A walked 140 m along the road from opposite end. Distance between them = 140 - 100 = 40 m."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "2 ladies and 2 men play cards at North, East, South, West of table. No lady faces East. Opposite persons are different sexes. One man faces South. Which directions are the ladies facing?",
    "options": ["East and west", "South and east", "North and east", "North and west", "None of these"],
    "correctIndex": 3,
    "explanation": "No lady faces East -> Man faces East, so opposite lady faces West. Man faces South -> opposite lady faces North. Ladies face North and West."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "One morning after sunrise, Vishakh and Satheesh stood back-to-back in a lawn. Vishakh's shadow fell towards his left hand side. Which direction was Satheesh facing?",
    "options": ["East", "West", "North", "South"],
    "correctIndex": 3,
    "explanation": "In morning (sun in East), shadow to left means facing North. Vishakh faces North, so Satheesh (back-to-back) faces South."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Post office is East of school; house is South of school; market is North of post office. Distance market-post office = house-school. Direction of market with respect to school?",
    "options": ["North", "East", "North-east", "South-west"],
    "correctIndex": 2,
    "explanation": "Market is East and North of school, so it is in the North-East direction."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Square layout (C NW, B NE, A SW, D SE). A and C move diagonally to opposite corners and then 1 side clockwise/anticlockwise. D & B move 2 sides each. Where is A now?",
    "options": ["At the north-west corner", "At the north-east corner", "At the south-east corner", "At the south-west corner", "Midway between original position of B and D"],
    "correctIndex": 2,
    "explanation": "A moves diagonally from SW to NE, then 1 side clockwise to SE corner."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Original layout ADBC (A SW, D SE, B NE, C NW). A & B move 1 arm clockwise then diagonal opposite. C & D move 1 arm anticlockwise then diagonal opposite. Original ADBC changed to:",
    "options": ["CBDA", "BDAC", "DACB", "ACBD", "BCAD"],
    "correctIndex": 2,
    "explanation": "Tracking the position shifts of each person changes configuration ADBC to DACB."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Facing East, Rajesh turned left (North) 10 m, left (West) 10 m, then turned 45° right (North-West) and walked 25 m. In which direction from starting point is he?",
    "options": ["South-west", "South-east", "North-west", "North-east", "East"],
    "correctIndex": 3,
    "explanation": "From initial point P, after 10 m North, 10 m West, and 25 m at 45° North-West, final position P' is North-East of P."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test24'] = examples
data['quantitativeReasoningTests']['part2_secA_test24'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test24 with 1 example and 10 questions to quantitativeReasoning.json')
