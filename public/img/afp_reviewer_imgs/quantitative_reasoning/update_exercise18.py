import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Pointing to a photograph, a man tells his friend, 'She is the daughter of the only son of my father's wife'. How is the girl in the photograph related to the man?",
    "options": ["Daughter", "Cousin", "Mother", "Sister", "Niece"],
    "correctIndex": 0,
    "explanation": "Father's wife—mother; mother's only son—himself. So the girl is man's daughter."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Pointing to a lady, Suresh said, 'She is the daughter of the woman, who is the mother of the husband of my mother'? What is the relation of the lady to Suresh?",
    "options": ["Aunt", "Granddaughter", "Daughter", "Sister", "Sister-in-law"],
    "correctIndex": 0,
    "explanation": "Mother's husband—Father; Father's mother—Grandmother; Grandmother's daughter—Father's sister; Father's sister is Aunt. So the lady is Suresh's aunt."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "A girl introduced a boy as the son of the daughter of the father of her uncle. The boy is girl's _______",
    "options": ["Brother", "Son", "Uncle", "Son-in-law", "Nephew"],
    "correctIndex": 0,
    "explanation": "Father of uncle—Grandfather; Daughter of grandfather—Uncle's sister or mother; Son of mother—Brother. So the answer is Brother."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Introducing a man to her husband, a woman said his brother's father is the only son of my grandfather. How is the woman related to this man?",
    "options": ["Mother", "Aunt", "Sister", "Daughter", "Grandmother"],
    "correctIndex": 2,
    "explanation": "Only son of her grandfather—her father; man's brother's father — man's father; So man's father is her father. i.e. She is man's sister."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Pointing to a lady a girl said, 'She is the daughter-in-law of the grandmother of my father's only son'. How is the lady related to the girl?",
    "options": ["Sister-in-law", "Mother", "Aunt", "Mother-in-law", "Cousin"],
    "correctIndex": 1,
    "explanation": "My father's only son—My brother; grandmother of my brother—My grandmother; Daughter-in-law of my grandmother—My mother. So the lady is girl's mother."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Introducing a man a woman said, 'He is the only son of my mother's mother'. How is the woman related to the man?",
    "options": ["Mother", "Aunt", "Sister", "Niece", "None of these"],
    "correctIndex": 3,
    "explanation": "My mother's mother—my grandmother; My grandmother's only son—my maternal uncle. So, the woman is man's niece."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Introducing a man, a woman said, 'His wife is the only daughter of my father'. How was that man related to the woman?",
    "options": ["Brother", "Father-in-law", "Maternal uncle", "Husband", "None of these"],
    "correctIndex": 3,
    "explanation": "Only daughter of my father—myself; So, man is woman's husband."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Showing a lady in the park, Ashok said, 'She is the daughter of my grandfather's only son'. How is Ashok related to that lady?",
    "options": ["Brother", "Cousin", "Father", "Uncle", "None of these"],
    "correctIndex": 0,
    "explanation": "Grandfather's only son—father; Daughter of father—sister. So Ashok is lady's brother."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Pointing to a man in a photograph, a woman said, 'His brother's father is the only son of my grandfather'. How is the woman related to the man in the photograph?",
    "options": ["Mother", "Aunt", "Sister", "Daughter", "Grandmother"],
    "correctIndex": 2,
    "explanation": "Only son of woman's grandfather—woman's father; Man's brother's father—Man's father. So, the woman is man's sister."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Pointing to a person a man said to a woman, 'His mother is the only daughter of your father'. How was the woman related to the person?",
    "options": ["Aunt", "Mother", "Wife", "Daughter", "None of these"],
    "correctIndex": 0,
    "explanation": "Only daughter of your father—your sister; Person's mother—woman's sister. So the woman is person's aunt."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Arun said, 'This girl is the wife of the grandson of my mother'. Who is Arun to the girl?",
    "options": ["Father", "Grandfather", "Husband", "Father-in-law", "None of these"],
    "correctIndex": 3,
    "explanation": "Mother's grandson—son; Son's wife—daughter-in-law. So, Arun is the father-in-law of the girl."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Pointing to a lady, a man said, 'The son of her only brother is the brother of my wife'. How is the lady related to the man?",
    "options": ["Mother's sister", "Grandmother", "Mother-in-law", "Sister of father-in-law", "Maternal aunt"],
    "correctIndex": 3,
    "explanation": "Brother of my wife—My brother-in-law; Son of lady's brother is brother-in-law of man. So lady's brother is man's father-in-law. i.e. Lady is sister of man's father-in-law."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Pointing to a lady on the platform, Anju said, 'She is the sister of the father of my mother's son'. Who is the lady to Anju?",
    "options": ["Mother", "Sister", "Aunt", "Niece", "None of these"],
    "correctIndex": 2,
    "explanation": "Mother's son—brother; My brother's father—father; my father's sister—aunt; So the lady is Anju's aunt."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test18'] = examples
data['quantitativeReasoningTests']['part2_secA_test18'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test18 with 3 examples and 10 questions to quantitativeReasoning.json')
