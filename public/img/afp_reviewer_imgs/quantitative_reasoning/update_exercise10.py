import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Choose the word which is least like the other words in the group.",
    "options": ["Copper", "Tin", "Brass", "Platinum", "Zinc"],
    "correctIndex": 2,
    "explanation": "Here, all except brass are metal while brass is an alloy. Hence the answer is (c)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Choose the word which is least like the other words in the group.",
    "options": ["Calf", "Cub", "Piglet", "Duckling", "Hireling"],
    "correctIndex": 4,
    "explanation": "Here, all except Hireling, are young ones of animals. Hence the answer is (e)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Choose the word which is least like the other words in the group.",
    "options": ["Curd", "Butter", "Oil", "Cheese", "Cream"],
    "correctIndex": 2,
    "explanation": "Here, all except, oil are products obtained from milk. Hence the answer is (c)."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Choose the word which is least like the other words in the group.",
    "options": ["Magnalium", "Germanium", "Duralumin", "Bronze", "Brass"],
    "correctIndex": 1,
    "explanation": "All, except germanium, are alloys, while germanium is a metal. So, the answer is (b)."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Choose the word which is least like the other words in the group.",
    "options": ["Garnet", "Ruby", "Graphite", "Emerald", "Topaz"],
    "correctIndex": 2,
    "explanation": "All, except graphite, are precious stones. So the answer is (c)."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Nephrology", "Entomology", "Astrology", "Mycology", "Pathology"],
    "correctIndex": 2,
    "explanation": "All except astrology are concerned with biology."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Whale", "Dolphin", "Shark", "Cod", "Starfish"],
    "correctIndex": 0,
    "explanation": "All except whale belong to the family of fishes, while whale is a mammal."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Indigo", "Orange", "Yellow", "Pink", "Green"],
    "correctIndex": 3,
    "explanation": "All except pink are colours seen in a rainbow."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Tarapur", "Kota", "Kalpakkam", "Paradeep", "Narora"],
    "correctIndex": 3,
    "explanation": "All except Paradeep are atomic power stations, whereas Paradeep is a port."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Brick", "Heart", "Diamond", "Spade", "Club"],
    "correctIndex": 0,
    "explanation": "All except brick are suits of cards."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Cataract", "Hypermetropia", "Trachoma", "Eczema", "Glaucoma"],
    "correctIndex": 3,
    "explanation": "All except eczema are eye infections, whereas eczema is a skin infection."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Radium", "Thorium", "Sodium", "Polonium", "Uranium"],
    "correctIndex": 2,
    "explanation": "All except sodium are radio isotopes, whereas sodium is a metal."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Bishop", "Knight", "Pawn", "Rook", "Jockey"],
    "correctIndex": 4,
    "explanation": "All except jockey are chessmen, whereas jockey is a professional horse rider."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Mongolia", "China", "Burma", "Afghanistan", "Bangladesh"],
    "correctIndex": 0,
    "explanation": "All except Mongolia are neighbouring countries of India."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Wise", "Gentle", "Honest", "Rude", "Arrogance"],
    "correctIndex": 4,
    "explanation": "All except arrogance are adjectives, whereas arrogance is a noun."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Pituitary", "Pancreas", "Thalamus", "Adrenal", "Testis"],
    "correctIndex": 2,
    "explanation": "All except thalamus are hormone secreting glands."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Nun", "Knight", "Monk", "Priest", "Padre"],
    "correctIndex": 1,
    "explanation": "All except knight are religious persons, whereas knight is a warrior."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Granite", "Lignite", "Peat", "Anthracite", "Bituminous"],
    "correctIndex": 0,
    "explanation": "All except granite are different types of coal, whereas granite is a rock."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Gasoline", "Methane", "Asphalt", "Paraffin wax", "Diesel"],
    "correctIndex": 1,
    "explanation": "All except methane are products obtained from petroleum."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Galileo", "Copernicus", "Columbus", "Bhaskara", "Aryabhatta"],
    "correctIndex": 2,
    "explanation": "All except Columbus were astronomers, whereas Columbus was an explorer."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Cricket", "Baseball", "Football", "Billiards", "Badminton"],
    "correctIndex": 3,
    "explanation": "All except billiards are outdoor games."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Rigveda", "Yajurveda", "Atharvaveda", "Ayurveda", "Samaveda"],
    "correctIndex": 3,
    "explanation": "All except Ayurveda are names of holy scriptures, the four vedas, Ayurveda is a branch of medicine."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Producer", "Director", "Investor", "Financier", "Entrepreneur"],
    "correctIndex": 1,
    "explanation": "All except director spend money."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Flute", "Guitar", "Sitar", "Violin", "Veena"],
    "correctIndex": 0,
    "explanation": "All except flute are string instruments."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Kiwi", "Eagle", "Emu", "Penguin", "Ostrich"],
    "correctIndex": 1,
    "explanation": "All except eagle are flightless birds."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Tortoise", "Snail", "Turtle", "Spider", "Oyster"],
    "correctIndex": 3,
    "explanation": "All except spider have hard protective shells."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Epicentre", "Seismology", "Focus", "Crater", "Richter Scale"],
    "correctIndex": 3,
    "explanation": "All except crater are terms associated with the earthquake."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Arrow", "Missile", "Sword", "Bullet", "Spear"],
    "correctIndex": 2,
    "explanation": "All except sword strike the target at a distance."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Nerves", "Auricle", "Artery", "Valve", "Aorta"],
    "correctIndex": 0,
    "explanation": "All except nerves are parts of the heart."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Konark", "Madurai", "Ellora", "Khajuraho", "Dilwara"],
    "correctIndex": 2,
    "explanation": "All except Ellora are famous for temples whereas Ellora is famous for caves."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Akbar", "Jahangir", "Shah Jahan", "Vikramaditya", "Aurangazeb"],
    "correctIndex": 3,
    "explanation": "All except Vikramaditya were Mughal rulers."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Manipur", "Sikkim", "Maharashtra", "Haryana", "Lakshadweep"],
    "correctIndex": 4,
    "explanation": "All except Lakshadweep are states of India, whereas Lakshadweep is a Union Territory."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Sial", "Mantle", "Core", "Sima", "Pengia"],
    "correctIndex": 4,
    "explanation": "All except pengia are layers of earth."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Turtle", "Lamb", "Colt", "Bitch", "Farrow"],
    "correctIndex": 3,
    "explanation": "All except bitch are young ones of animals, whereas bitch is a female dog."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Choose the odd one out.",
    "options": ["Mettur", "Aswan", "Hirakund", "Sutlej", "Pong"],
    "correctIndex": 3,
    "explanation": "All except Sutlej are dams, whereas Sutlej is a river."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test10'] = examples
data['quantitativeReasoningTests']['part2_secA_test10'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test10 with 5 examples and 30 questions to quantitativeReasoning.json')
