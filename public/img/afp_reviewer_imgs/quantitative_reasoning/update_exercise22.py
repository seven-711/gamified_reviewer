import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Examine family of 6 (A,B,C,D,E,F): Equal males & females. A & E sons of F. D mother of 2 (boy & girl). B son of A. 1 married couple. Which reference can be drawn?",
    "options": ["A, B and C are all females", "A is the husband of D", "E and F are the children of D", "D is the granddaughter of F"],
    "correctIndex": 1,
    "explanation": "Since A and E are sons of F, B is son of A, and D is mother of two, D is married to A. Thus A is the husband of D."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Examine family of 6 (A,B,C,D,E,F): Equal males & females. A & E sons of F. D mother of 2 (boy & girl). B son of A. 1 married couple. Which reference can be drawn?",
    "options": ["A, B and C are all females", "A is the husband of D", "E and F are the children of D", "D is the granddaughter of F"],
    "correctIndex": 1,
    "explanation": "Since A and E are sons of F, B is son of A, and D is mother of two, D is married to A. Thus A is the husband of D."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "6 chairs around round table (A,B,C,D,E,F): A between D & F; C opposite D; D & E not neighbours. Which must be true?",
    "options": ["A is the opposite to B", "D is the opposite to E", "C and B are neighbours", "B and E are neighbours"],
    "correctIndex": 3,
    "explanation": "Arranging around the circle based on conditions places B and E in adjacent/neighbouring chairs."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "6 chairs around round table: A between D & F; C opposite D; D & E not neighbours. Which pair must be sitting on neighbouring chairs?",
    "options": ["A and B", "C and E", "B and F", "A and C"],
    "correctIndex": 1,
    "explanation": "From the circle arrangement, C and E must be sitting on neighbouring chairs."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Family of 7 (4 adults, 3 children; F & G girls). A & D brothers (A doctor). E engineer married to one brother with 2 children. B married to D and G is their child. Who is C?",
    "options": ["G's brother", "F's father", "E's daughter", "A's son"],
    "correctIndex": 3,
    "explanation": "E is married to A and has two children C and F. Thus C is A's son."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Swimming race (7 persons P,Q,R,S,T,U,V): V ahead of P; P ahead of Q. Either (R 1st & T last) or (S 1st & U/Q last). If V finished 5th, which is true?",
    "options": ["S finishes first", "R finishes second", "T finishes third", "R finishes fourth"],
    "correctIndex": 0,
    "explanation": "If V is 5th, then P is 6th and Q is 7th (last). Since Q finishes last, S must finish first."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "4 Collectors (Saxena, David, Jain, Kumar) transferred at P, Q, R, S in 1970, 1972, 1973. What next round of transfers lets all 4 serve in all 4 places?",
    "options": [
      "Interchange Saxena and David as well as Jain and Kumar.",
      "Interchange Saxena and Kumar as well as David and Jain.",
      "Interchange David and Kumar as well as Saxena and Jain",
      "It is not possible for all the four persons to have been posted at all the four places."
    ],
    "correctIndex": 2,
    "explanation": "Interchanging David & Kumar as well as Saxena & Jain ensures every collector visits all four locations."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "6 women (4 dancers, 4 vocalists, 1 actress, 3 violinists): Girija & Vanaja violinists; Jalaja & Shailaja non-violinists; Shailaja & Thanuja dancers; Jalaja, Vanaja, Shailaja, Thanuja vocalists. Pooja actress. Who is both dancer & violinist?",
    "options": ["Jalaja", "Shailaja", "Thanuja", "Pooja"],
    "correctIndex": 2,
    "explanation": "Thanuja is a dancer, vocalist, and violinist."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "6 women: 4 table tennis, 4 PG economics, 1 PG commerce, 3 bank employees. Vimala & Kamala bank; Amala & Komala unemployed; Komala & Nirmala TT. Amala, Kamala, Komala, Nirmala PG economics (2 bank). Shyamala PG commerce. Who is TT player & bank employee?",
    "options": ["Nirmala", "Vimala", "Amala", "Komala"],
    "correctIndex": 0,
    "explanation": "Nirmala plays table tennis and is a bank employee."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "A seated between D and F at round table. C (not E) seated opposite D. Who sits opposite to B?",
    "options": ["A", "D", "C", "F"],
    "correctIndex": 0,
    "explanation": "Arranging around the circle puts A directly opposite to B."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "5 bus stops A,B,C,D,E. C not middle. A & E not terminal. C twice as many stops before D in upward as B after A. D 1st in downward. Downward sequence?",
    "options": ["DEACB", "DAECB", "DACEB", "DCBAE"],
    "correctIndex": 0,
    "explanation": "The downward sequence of stops is DEACB."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "5 people: K,L,M ambitious; M,N,R honest; L,M,N intelligent; K,N,R industrious. Neither industrious nor ambitious includes:",
    "options": ["K alone", "L and R", "M and N", "None in the group"],
    "correctIndex": 3,
    "explanation": "Every member in the group is either ambitious or industrious."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "6 roads X,Y,Z,1,2,3. Storm blocks Y. Floods affect X,1,2. Road 1 blocked -> Z blocked. During floods AND storm, which road(s) can be used?",
    "options": ["Z and 2", "Only Z", "Only 3", "Only Y"],
    "correctIndex": 2,
    "explanation": "Y is blocked by storm; X, 1, 2, Z are blocked by floods. Only road 3 remains open."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Truck, car, motorcycle have equal kinetic energies. Equal stopping forces applied, stopping after X, Y, Z. Then:",
    "options": ["X > Y > Z", "X < Y < Z", "X = Y = Z", "X = 4Y = 8Z"],
    "correctIndex": 0,
    "explanation": "By work-energy theorem, stopping distance depends on kinetic energy and force. Answer is X > Y > Z."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "7 men A,B,C,D,E,F,G in queue. Caps: violet, indigo, blue, green, yellow, orange, red. D sees green & blue in front. E sees violet & yellow. G sees all except orange. If E wears indigo, F wears:",
    "options": ["Blue", "Violet", "Red", "Orange"],
    "correctIndex": 2,
    "explanation": "Deduction of cap colors visible to each person in queue yields Red for F."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Group of 5 (A,B,C,D,E: professor, businessman, artist). A, D unmarried non-working ladies. Married couple husband E. B brother of A (neither businessman nor artist). E's wife artist. Who is professor?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 1,
    "explanation": "B is the brother of A and not a businessman or artist, so B is the professor."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Based on 5 persons puzzle (A,B,C,D,E): Who is the artist?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2,
    "explanation": "C is the wife of E and she is the artist."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Based on 5 persons puzzle (A,B,C,D,E): Who is the wife of E?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2,
    "explanation": "C is the wife of E."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Based on 5 persons puzzle (A,B,C,D,E): Which of the following groups include all the men?",
    "options": ["BE", "ABC", "BCD", "None of these"],
    "correctIndex": 0,
    "explanation": "A & D are ladies, C is wife of E (lady). So B and E are the men."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "5 persons in bus queue (A teacher right of D advocate; B scientist left of E electrician; 2 between B & A; C banker right of A). Who is in middle?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 3,
    "explanation": "Queue order from left to right: B, E, D, A, C. D is in the middle (3rd position)."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Bus queue (B, E, D, A, C): Who is to the extreme left?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 1,
    "explanation": "B is at position 1 (extreme left)."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Bus queue (B, E, D, A, C): Who is to the extreme right?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2,
    "explanation": "C is at position 5 (extreme right)."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Bus queue (B, E, D, A, C): How many persons are there to the right of E?",
    "options": ["4", "3", "2", "1"],
    "correctIndex": 1,
    "explanation": "E is at position 2, so D, A, C (3 persons) are to his right."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "6 persons in circle (A,B,C,D,E,F): B between D & C; A between E & C; F right of D. Who is between A and F?",
    "options": ["B", "C", "D", "E"],
    "correctIndex": 3,
    "explanation": "Seating order in circle places E between A and F."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "300 meeting participants (120 foreigners, 180 Indians). Indian non-judge men = 110; Indian men or judges = 160; Indian women judges = 35. No foreign judges. How many Indian women attended?",
    "options": ["45", "55", "35", "60"],
    "correctIndex": 1,
    "explanation": "Total Indian women attending the meeting is 55."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Exam matching paper (5 items List A, 5 List B). No examinee correct; no 2 examinees identical. Number of examinees attended test paper?",
    "options": ["24", "26", "119", "129"],
    "correctIndex": 0,
    "explanation": "Number of incorrect matching permutations (derangements) is 24."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test22'] = examples
data['quantitativeReasoningTests']['part2_secA_test22'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test22 with 1 example and 25 questions to quantitativeReasoning.json')
