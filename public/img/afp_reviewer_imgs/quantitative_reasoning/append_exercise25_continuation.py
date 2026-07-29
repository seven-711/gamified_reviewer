import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

new_questions = [
  {
    "id": 23,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Protons, electrons, atoms",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Protons and electrons are entirely different particles, but both are components of atoms. Thus, two separate circles inside one large circle (Diagram b)."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Sun, planets, earth",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "Earth is a planet (concentric circles), while the Sun is a star and entirely separate from the two (Diagram a)."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Dog, animal, pet",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 2,
    "explanation": "Some dogs are pets and some pets are dogs. Both dogs and pets belong to the class of animals (two overlapping circles inside one large circle - Diagram c)."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Science, physics, chemistry",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Physics and chemistry are distinct subjects, but both are branches of science (two separate circles inside one large circle - Diagram b)."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Atmosphere, hydrogen, oxygen",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Hydrogen and oxygen are distinct gases, but both are constituent parts of the atmosphere (two separate circles inside one large circle - Diagram b)."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Wheat, grains, maize",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Wheat and maize are two different agricultural items, but both belong to the class of grains (two separate circles inside one large circle - Diagram b)."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Machine, lathe, mathematics",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "A lathe is a specific type of machine (concentric circles), while Mathematics is an academic discipline entirely separate from the two (Diagram a)."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Biology, botany, zoology",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/30.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Botany and zoology are distinct fields of study, but both are branches of biology (two separate circles inside one large circle - Diagram b)."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Append questions 23-30 to part2_secA_test25
existing_questions = data['quantitativeReasoningTests']['part2_secA_test25']
# Filter out any existing item with id >= 23 if re-run
filtered = [q for q in existing_questions if q['id'] < 23]
filtered.extend(new_questions)
data['quantitativeReasoningTests']['part2_secA_test25'] = filtered

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Successfully updated part2_secA_test25 to {len(filtered)} total questions.')
