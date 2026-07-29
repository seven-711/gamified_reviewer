import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

dir_text = "Directions: Arrange the given words in a meaningful sequence and then choose the most appropriate sequence from amongst the alternatives provided below each question:"

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Arrange the following in a logical order:\n1. Birth  2. Marriage  3. Death  4. Funeral  5. Education",
    "options": ["1, 4, 2, 5, 3", "1, 5, 2, 3, 4", "3, 4, 2, 5, 1", "2, 5, 4, 1, 3"],
    "correctIndex": 1,
    "explanation": "The given words when arranged in the order of various events occurring in a person's life form the sequence: Birth, Education, Marriage, Death, Funeral (1, 5, 2, 3, 4). So, the answer is (b)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Arrange the following in a meaningful sequence:\n1. Doctor  2. Fever  3. Prescribe  4. Diagnose  5. Medicine",
    "options": ["1, 4, 3, 2, 5", "2, 1, 3, 4, 5", "2, 1, 4, 3, 5", "2, 4, 3, 5, 1"],
    "correctIndex": 2,
    "explanation": "Fever occurs first. One then goes to a doctor. After diagnosing, the doctor prescribes medicine: Fever, Doctor, Diagnose, Prescribe, Medicine (2, 1, 4, 3, 5). So, the answer is (c)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Arrange the following in a logical order:\n1. Leaf  2. Fruit  3. Stem  4. Root  5. Flower",
    "options": ["3, 4, 5, 1, 2", "4, 1, 3, 5, 2", "4, 3, 1, 2, 5", "4, 3, 1, 5, 2"],
    "correctIndex": 3,
    "explanation": "Arranging plant parts from bottom to top in order of occurrence: Root, Stem, Leaf, Flower, Fruit (4, 3, 1, 5, 2). So, the answer is (d)."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Arrange the following in a meaningful order, from particular to general:\n1. District  2. Village  3. Country  4. Town  5. State",
    "options": ["2, 4, 1, 5, 3", "2, 1, 4, 5, 3", "5, 3, 2, 1, 4", "2, 5, 3, 4, 1"],
    "correctIndex": 0,
    "explanation": "Smallest to largest administrative area: Village, Town, District, State, Country (2, 4, 1, 5, 3). So, the answer is (a)."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Arrange the following in a logical order:\n1. Gold  2. Iron  3. Silver  4. Platinum  5. Diamond",
    "options": ["3, 4, 2, 5, 1", "2, 3, 1, 5, 4", "4, 5, 1, 2, 3", "5, 4, 2, 3, 1"],
    "correctIndex": 1,
    "explanation": "Arranged in order of increasing monetary value (from cheapest to costliest): Iron, Silver, Gold, Diamond, Platinum (2, 3, 1, 5, 4). So, the answer is (b)."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Arrange the following in a logical sequence from small to big:\n1. Elephant  2. Cat  3. Mosquito  4. Tiger  5. Whale",
    "options": ["1, 3, 5, 4, 2", "2, 5, 1, 4, 3", "3, 2, 4, 1, 5", "5, 3, 1, 2, 4"],
    "correctIndex": 2,
    "explanation": "Arranged by body size from smallest to largest: Mosquito, Cat, Tiger, Elephant, Whale (3, 2, 4, 1, 5). So, the answer is (c)."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Arrange the following in a logical order:\n1. Book  2. Pulp  3. Timber  4. Jungle  5. Paper",
    "options": ["2, 5, 1, 4, 3", "3, 2, 5, 1, 4", "4, 3, 2, 5, 1", "5, 4, 3, 1, 2"],
    "correctIndex": 2,
    "explanation": "Manufacturing chain of book production: Jungle → Timber → Pulp → Paper → Book (4, 3, 2, 5, 1). So, the answer is (c)."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": dir_text + "\n\n1. Sentence  2. Chapter  3. Letter  4. Book  5. Word  6. Paragraph",
    "options": ["4, 2, 1, 6, 5, 3", "4, 2, 6, 1, 5, 3", "4, 6, 1, 2, 3, 5", "4, 6, 2, 5, 1, 3"],
    "correctIndex": 1,
    "explanation": "Words are arranged such that each successive term constitutes part of the preceding item: Book → Chapter → Paragraph → Sentence → Word → Letter (4, 2, 6, 1, 5, 3)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": dir_text + "\n\n1. Police  2. Punishment  3. Crime  4. Justice  5. Judgement",
    "options": ["1, 2, 3, 4, 5", "3, 1, 2, 4, 5", "3, 1, 4, 5, 2", "5, 4, 3, 2, 1"],
    "correctIndex": 2,
    "explanation": "Legal process order of events: Crime occurs first → Police intervenes → Case brought to Justice → Court issues Judgement → Criminal receives Punishment (3, 1, 4, 5, 2)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": dir_text + "\n\n1. College  2. Child  3. Salary  4. School  5. Employment",
    "options": ["1, 2, 4, 3, 5", "2, 4, 1, 5, 3", "4, 1, 3, 5, 2", "5, 3, 2, 1, 4"],
    "correctIndex": 1,
    "explanation": "Life stages progression: Child → School → College → Employment → Salary (2, 4, 1, 5, 3)."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": dir_text + "\n\n1. Mother  2. Child  3. Milk  4. Cry  5. Smile",
    "options": ["1, 5, 2, 4, 3", "2, 4, 1, 3, 5", "2, 4, 3, 1, 5", "3, 2, 1, 5, 4"],
    "correctIndex": 1,
    "explanation": "Behavioral reaction chain: Child → Cry → Mother → Milk → Smile (2, 4, 1, 3, 5)."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": dir_text + "\n\n1. Atomic Age  2. Metallic Age  3. Stone Age  4. Alloy Age",
    "options": ["1, 3, 4, 2", "2, 3, 1, 4", "3, 2, 4, 1", "4, 3, 2, 1"],
    "correctIndex": 2,
    "explanation": "Chronological historical eras: Stone Age → Metallic Age → Alloy Age → Atomic Age (3, 2, 4, 1)."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": dir_text + "\n\n1. Heel  2. Shoulder  3. Skull  4. Neck  5. Knee  6. Chest  7. Thigh  8. Stomach  9. Face  10. Hand",
    "options": [
      "2, 4, 7, 10, 1, 5, 8, 9, 6, 3",
      "3, 4, 7, 9, 2, 5, 8, 10, 6, 1",
      "4, 7, 10, 1, 9, 6, 3, 2, 5, 8",
      "3, 9, 4, 2, 10, 6, 8, 7, 5, 1"
    ],
    "correctIndex": 3,
    "explanation": "Anatomical arrangement from top (head) to bottom (feet): Skull → Face → Neck → Shoulder → Hand → Chest → Stomach → Thigh → Knee → Heel (3, 9, 4, 2, 10, 6, 8, 7, 5, 1)."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": dir_text + "\n\n1. Rain  2. Monsoon  3. Rescue  4. Flood  5. Shelter  6. Relief",
    "options": ["1, 2, 3, 4, 5, 6", "1, 2, 4, 5, 3, 6", "2, 1, 4, 3, 5, 6", "4, 1, 2, 3, 5, 6"],
    "correctIndex": 2,
    "explanation": "Climatic event progression: Monsoon → Rain → Flood → Rescue → Shelter → Relief (2, 1, 4, 3, 5, 6)."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": dir_text + "\n\n1. Never  2. Sometimes  3. Generally  4. Seldom  5. Always",
    "options": ["5, 2, 1, 3, 4", "5, 2, 4, 3, 1", "5, 3, 1, 2, 4", "5, 3, 2, 4, 1"],
    "correctIndex": 3,
    "explanation": "Frequency order in decreasing intensity: Always → Generally → Sometimes → Seldom → Never (5, 3, 2, 4, 1)."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": dir_text + "\n\n1. Butterfly  2. Cocoon  3. Egg  4. Worm",
    "options": ["1, 3, 4, 2", "2, 4, 1, 3", "1, 4, 3, 2", "3, 4, 2, 1"],
    "correctIndex": 3,
    "explanation": "Biological life cycle of a butterfly: Egg → Worm (Caterpillar) → Cocoon (Pupa) → Butterfly (3, 4, 2, 1)."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": dir_text + "\n\n1. Site  2. Plan  3. Rent  4. Money  5. Building  6. Construction",
    "options": ["1, 2, 3, 6, 5, 4", "2, 3, 6, 5, 1, 4", "3, 4, 2, 6, 5, 1", "4, 1, 2, 6, 5, 3"],
    "correctIndex": 3,
    "explanation": "Construction process steps: Money → Site → Plan → Construction → Building → Rent (4, 1, 2, 6, 5, 3)."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test33'] = examples
data['quantitativeReasoningTests']['part2_secA_test33'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test33 to quantitativeReasoning.json')
