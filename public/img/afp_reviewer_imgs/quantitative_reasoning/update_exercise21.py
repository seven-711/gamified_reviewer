import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Five friends Sonal, Ratheesh, Manoj, Ashok, Gireesh. Sonal is shorter than Ratheesh but taller than Gireesh. Manoj is tallest. Ashok is shorter than Ratheesh and taller than Sonal. Who is the shortest?",
    "options": ["Gireesh", "Sonal", "Ashok", "Ratheesh", "None of these"],
    "correctIndex": 0,
    "explanation": "Order of heights: Gireesh < Sonal < Ashok < Ratheesh < Manoj. Gireesh is the shortest."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Using same height puzzle (G < S < A < R < M): If they stand in the order of their heights, who will be in the middle?",
    "options": ["Ratheesh", "Gireesh", "Sonal", "Ashok", "None of these"],
    "correctIndex": 3,
    "explanation": "Ashok is in the middle."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Using same height puzzle (G < S < A < R < M): Who is the second tallest?",
    "options": ["Sonal", "Ratheesh", "Ashok", "Gireesh", "None of these"],
    "correctIndex": 1,
    "explanation": "Ratheesh is the second tallest."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Based on family puzzle (6 persons: A,B,C,D,E,F; professions: Prof, Mgr, Lawyer, Jeweller, Doctor, Engr. Doctor grandfather of F (Prof). Manager D married to A. Jeweller C married to Lawyer. B mother of F and E. 2 couples): What is the profession of E?",
    "options": ["Doctor", "Jeweller", "Manager", "Professor", "None of these"],
    "correctIndex": 4,
    "explanation": "E is an Engineer, which is not listed in options (a)-(d), so the answer is None of these."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Based on family puzzle (A, B, C, D, E, F): How is A related to E?",
    "options": ["Brother", "Uncle", "Father", "Grandfather", "None of these"],
    "correctIndex": 3,
    "explanation": "A is the Doctor and grandfather of F and E. So A is the grandfather of E."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Based on family puzzle (A, B, C, D, E, F): How many male members are there in the family?",
    "options": ["One", "Three", "Four", "Data inadequate", "Can't be determined"],
    "correctIndex": 4,
    "explanation": "Since the genders of E and F are not specified, the number of males cannot be determined."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Based on family puzzle (A, B, C, D, E, F): What is the profession of A?",
    "options": ["Doctor", "Lawyer", "Jeweller", "Manager", "None of these"],
    "correctIndex": 0,
    "explanation": "A is the Doctor and grandfather of F."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Based on family puzzle (A, B, C, D, E, F): Which of the following is one of the pairs of couples in the family?",
    "options": ["AB", "AC", "AD", "Can't be determined", "None of these"],
    "correctIndex": 2,
    "explanation": "Manager D is married to A. So AD is one of the couples in the family."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Based on bench seating puzzle (Friends A,B,C,D,E on a bench. A next to B. C next to D. D not with E. E on left end. C 2nd from right. A right of B and E. A & C together): Where is A sitting?",
    "options": ["Between B and D", "Between D and C", "Between E and D", "Between C and E", "Between B and C"],
    "correctIndex": 4,
    "explanation": "The bench seating order from left to right is E, B, A, C, D. A is sitting between B and C."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Based on bench seating puzzle (Order: E, B, A, C, D): Who is sitting in the centre?",
    "options": ["A", "B", "C", "D", "E"],
    "correctIndex": 0,
    "explanation": "A is sitting at position 3 (the centre)."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Based on bench seating puzzle (Order: E, B, A, C, D): C is sitting between",
    "options": ["B and D", "A and E", "D and E", "A and D", "A and B"],
    "correctIndex": 3,
    "explanation": "C is at position 4, sitting between A (pos 3) and D (pos 5)."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Based on bench seating puzzle (Order: E, B, A, C, D): What is the position of D?",
    "options": ["Extreme left", "Extreme right", "Third from left", "Second from left", "None of these"],
    "correctIndex": 1,
    "explanation": "D is at position 5, which is the extreme right."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Based on bench seating puzzle (Order: E, B, A, C, D): What is the position of B?",
    "options": ["Second from right", "Centre", "Extreme left", "Second from left", "None of these"],
    "correctIndex": 3,
    "explanation": "B is at position 2, which is second from left."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Based on schedule puzzle (7 subjects July 22-29; 22:Psychology, 23:Sun Holiday, 24:Philosophy, 25:Economics, 26:Science, 27:Engineering, 28:Sociology, 29:Mechanics): The refresher course will start with which subject?",
    "options": ["Psychology", "Mechanics", "Philosophy", "Economics", "None of these"],
    "correctIndex": 0,
    "explanation": "The course starts on July 22nd with Psychology."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Based on schedule puzzle (July 22-29): Which subject will be on Tuesday (July 25th)?",
    "options": ["Mechanics", "Engineering", "Economics", "Psychology", "None of these"],
    "correctIndex": 2,
    "explanation": "July 23 is Sunday, so July 25 is Tuesday, which is Economics."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Based on schedule puzzle (July 22-29): Which subject precedes Mechanics (July 29th)?",
    "options": ["Economics", "Engineering", "Philosophy", "Psychology", "None of these"],
    "correctIndex": 4,
    "explanation": "Sociology (July 28th) precedes Mechanics. Since Sociology is not in (a)-(d), the answer is None of these."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Based on schedule puzzle (July 22-29): How many day's gap is there between Science (July 26) and Philosophy (July 24)?",
    "options": ["One", "Two", "Three", "No gap", "None of these"],
    "correctIndex": 0,
    "explanation": "Economics is on July 25, so there is a one day gap (July 25) between Philosophy and Science."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Based on schedule puzzle (July 22-29): Which subject is followed by Science (July 26)?",
    "options": ["Engineering", "Psychology", "Philosophy", "Economics", "None of these"],
    "correctIndex": 3,
    "explanation": "Science (July 26) follows Economics (July 25)."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Based on circular seating (6 friends A,B,C,D,E,F facing centre: E left of D; C between A & B; F between E & A): Who is to the left of B?",
    "options": ["A", "C", "D", "E", "None of these"],
    "correctIndex": 2,
    "explanation": "The order around the circle is A-C-B-D-E-F. D is to the left of B."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Based on circular seating (Order: A-C-B-D-E-F): Who is to the right of C?",
    "options": ["A", "B", "D", "E", "F"],
    "correctIndex": 0,
    "explanation": "A is to the right of C."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Based on circular seating (Order: A-C-B-D-E-F): Which of the given 4 statements is superfluous?",
    "options": ["1", "2", "3", "4", "None of these"],
    "correctIndex": 4,
    "explanation": "All four statements are necessary to determine the arrangement. Therefore none of these is superfluous."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test21'] = examples
data['quantitativeReasoningTests']['part2_secA_test21'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test21 with 3 examples and 18 questions to quantitativeReasoning.json')
