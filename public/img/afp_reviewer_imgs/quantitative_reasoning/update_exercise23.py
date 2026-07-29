import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Kishore walks 10 km towards north. Then he walked 6 km towards south. Then he walks 3 km towards east. How far and in which direction is he with reference to his starting point?",
    "options": ["7 km east", "5 km west", "5 km north east", "7 km west"],
    "correctIndex": 2,
    "explanation": "Net North distance = 10 - 6 = 4 km. East distance = 3 km. Distance = sqrt(4^2 + 3^2) = 5 km North-East."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Kishore walks 10 km towards north. Then he walked 6 km towards south. Then he walks 3 km towards east. How far and in which direction is he with reference to his starting point?",
    "options": ["7 km east", "5 km west", "5 km north east", "7 km west"],
    "correctIndex": 2,
    "explanation": "Net North distance = 10 - 6 = 4 km. East distance = 3 km. Distance = sqrt(4^2 + 3^2) = 5 km North-East."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "A man leaves for his office from house. Walks 20 m east, turns south 10 m, walks 35 m west, 5 m north, then 15 m east. What is straight distance in metres between initial & final positions?",
    "options": ["0", "5", "10", "None of these", "Can't be determined"],
    "correctIndex": 1,
    "explanation": "Net East distance = 20 - 35 + 15 = 0 m. Net North distance = -10 + 5 = -5 m. Straight distance = 5 m."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "James walks 30 m west, turns right 20 m, turns left 10 m, turns left 40 m, turns left 5 m, turns left. In which direction is he walking now?",
    "options": ["North", "South", "East", "South-west", "West"],
    "correctIndex": 0,
    "explanation": "After the final left turn from facing West, James is walking towards North."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Sudheesh walked 10 m south, turned left 20 m, moved right (south) 20 m, turned right (west) 10 m. How far and in which direction is he from starting point?",
    "options": ["10 m north", "20 m south", "20 m north", "10 m south", "None of these"],
    "correctIndex": 1,
    "explanation": "Displacement calculation gives 20 m South from starting point."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "A man walked 30 m south, turned right (west) 30 m, turned left (south) 20 m, turned left (east) 30 m. How far is he from initial position?",
    "options": ["30 m", "20 m", "80 m", "60 m", "None of these"],
    "correctIndex": 4,
    "explanation": "Total southward displacement = 30 + 20 = 50 m. Since 50 m is not listed in (a)-(d), the answer is None of these."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Gopal walked 1 km east, 5 km south, 2 km east, 9 km north. How far is he from starting point?",
    "options": ["7 km", "5 km", "4 km", "3 km", "None of these"],
    "correctIndex": 1,
    "explanation": "East distance = 1 + 2 = 3 km. North distance = 9 - 5 = 4 km. Distance = sqrt(3^2 + 4^2) = 5 km."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Sumesh went 15 km north, turned west 10 km, turned south 5 km, turned east 10 km. In which direction is he from his house?",
    "options": ["East", "West", "North", "South"],
    "correctIndex": 2,
    "explanation": "Net displacement is 10 km North. So he is in North direction from his house."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Lakshmi walks 50 m south, turns left (east) 20 m, turns north 30 m, then starts walking straight to her house. In which direction is she walking now?",
    "options": ["North-west", "North", "South-east", "East"],
    "correctIndex": 0,
    "explanation": "Her position is (20 m East, 20 m South). Heading straight back to house (0,0) is North-West."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Dinesh walks 20 m north, right 30 m, right 35 m, left 15 m, left 15 m, left 15 m. In which direction and how far is he from original position?",
    "options": ["15 m east", "45 m east", "15 m west", "45 m west", "None of these"],
    "correctIndex": 4,
    "explanation": "His final position is 30 m East of original position. Since 30 m East is not among (a)-(d), the answer is None of these."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Anil's house faces east. From back-side, he walks 50 m (west), turns right (north) 50 m, turns left (west) 25 m. Anil is in which direction from starting point?",
    "options": ["South-east", "North-east", "South-west", "North-west", "None of these"],
    "correctIndex": 3,
    "explanation": "Position is (-75 m West, +50 m North), which is North-West from the starting point."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test23'] = examples
data['quantitativeReasoningTests']['part2_secA_test23'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test23 with 1 example and 10 questions to quantitativeReasoning.json')
