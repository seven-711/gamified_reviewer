import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Trigonometry is related to triangles in the same way mensuration is related to _______",
    "options": ["geometry", "circles", "areas", "polygons"],
    "correctIndex": 2,
    "explanation": "Trigonometry is the study of triangles. Similarly, mensuration is the study of areas."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Lotus is related to cuticle in the same way fish is related to _______",
    "options": ["scales", "gills", "tail", "wings"],
    "correctIndex": 0,
    "explanation": "The second is the means to protect the body of the first from water."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Tapeworm is related to taeniasis in the same way plasmodium is related to _______",
    "options": ["malaria", "constipation", "diphtheria", "diarrhoea"],
    "correctIndex": 0,
    "explanation": "The second is the disease caused by the first."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Leaf is related to sap in the same way bone is related to _______",
    "options": ["fluid", "blood", "marrow", "calcium"],
    "correctIndex": 2,
    "explanation": "The second is the fluid contained in the first."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Chlorophyll is related to chloroplast in the same way vulture is related to _______",
    "options": ["flesh", "wings", "air", "bird"],
    "correctIndex": 3,
    "explanation": "Chlorophyll is a type of chloroplast. Similarly, vulture is a type of bird."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Waves are related to air in the same way ripples are related to _______",
    "options": ["wind", "water", "tree", "bud"],
    "correctIndex": 1,
    "explanation": "Waves travel in air; ripples travel in water."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Rung is related to ladder in the same way twig is related to _______",
    "options": ["leaf", "flower", "tree", "bud"],
    "correctIndex": 2,
    "explanation": "The first is a part of the second."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Circle is related to circumference in the same way square is related to _______",
    "options": ["area", "volume", "diagonal", "perimeter"],
    "correctIndex": 3,
    "explanation": "The second is the measure of boundary of the first."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Grain is related to granary in the same way curios is related to _______",
    "options": ["archives", "museum", "library", "zoo"],
    "correctIndex": 1,
    "explanation": "Grain is stored in a granary. Similarly, curios (rare things to be collected) are kept in a museum."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Cat is related to kitten in the same way fish is related to _______",
    "options": ["fry", "fawn", "fin", "foal"],
    "correctIndex": 0,
    "explanation": "The second is the young one of the first."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Orthopaedist is related to bones in the same way chiropodist is related to _______",
    "options": ["nails", "sounds", "feet", "heart"],
    "correctIndex": 2,
    "explanation": "The first is a specialist of the second."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Formula is related to constituent in the same way equation is related to _______",
    "options": ["numbers", "variables", "term", "constant"],
    "correctIndex": 2,
    "explanation": "The second is a unit of the first."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Dog is related to kennel in the same way fowl is related to _______",
    "options": ["barn", "cottage", "nest", "coop"],
    "correctIndex": 3,
    "explanation": "The second is the living place of the first."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Honey is related to wax in the same way milk is related to _______",
    "options": ["cow", "leather", "eggs", "butter"],
    "correctIndex": 1,
    "explanation": "Honey and wax are both obtained from the same organism i.e. bee. Similarly, milk and leather both are obtained from buffalo."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Helm is related to rudder in the same way brain is related to _______",
    "options": ["heart", "ribs", "limbs", "body"],
    "correctIndex": 3,
    "explanation": "Helm regulates the rudder and brain regulates the body."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Crumb is related to bread in the same way morsel is related to _______",
    "options": ["fruit", "biscuit", "food", "cake"],
    "correctIndex": 2,
    "explanation": "The first is a part of the second."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Door is related to bang in the same way chain is related to _______",
    "options": ["thunder", "clinch", "tinkle", "clank"],
    "correctIndex": 3,
    "explanation": "The second is the sound made by the first."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Hong Kong is related to China in the same way Vatican is related to _______",
    "options": ["Canada", "Mexico", "North America", "Rome"],
    "correctIndex": 3,
    "explanation": "Hong Kong is a city of China. Similarly, Vatican is a city of Rome."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Horse is related to hay in the same way cow is related to _______",
    "options": ["leaves", "fodder", "milk", "straw"],
    "correctIndex": 1,
    "explanation": "The second is the food for the first."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Earth is related to axis in the same way wheel is related to _______",
    "options": ["tyre", "car", "road", "hub"],
    "correctIndex": 3,
    "explanation": "The first rotates about the second."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Gravity is related to pull in the same way magnetism is related to _______",
    "options": ["repulsion", "separation", "attraction", "push"],
    "correctIndex": 2,
    "explanation": "The first draws things nearer through the second."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Symphony is related to composer in the same way fresco is related to _______",
    "options": ["painter", "inventor", "singer", "writer"],
    "correctIndex": 0,
    "explanation": "The first is prepared by the second."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "Bull is related to draught in the same way as cow is related to _______",
    "options": ["livestock", "milch", "farm", "fodder"],
    "correctIndex": 1,
    "explanation": "The bull is a draught animal (beast of burden) and the cow is a milch animal (milk yielding)."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Tooth is related to grit in the same way fist is related to _______",
    "options": ["blow", "hand", "open", "clench"],
    "correctIndex": 3,
    "explanation": "The hold of tooth is called grit and the hold of the fist is called clench."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Charminar is related to India in the same way Sphinx is related to _______",
    "options": ["England", "Canada", "Egypt", "Vatican"],
    "correctIndex": 2,
    "explanation": "Charminar is situated in India. Similarly, Sphinx is a monument of Egypt."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Labourer is related to wages in the same way entrepreneur is related to _______",
    "options": ["loan", "interest", "taxes", "profit"],
    "correctIndex": 3,
    "explanation": "The first earns in the form of the second."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Land is related to cape in the same way water is related to _______",
    "options": ["strait", "lagoon", "bay", "island"],
    "correctIndex": 2,
    "explanation": "The cape is the land projected into the water and the bay is the portion of water body projected into land."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Umbrella is related to rain in the same way goggles are related to _______",
    "options": ["light", "glare", "stare", "sight"],
    "correctIndex": 1,
    "explanation": "The first provides protection from the second."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Borrower is related to loan in the same way beggar is related to _______",
    "options": ["alms", "mercy", "money", "gift"],
    "correctIndex": 0,
    "explanation": "The first gets money in the form of the second."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Concert is related to theatre in the same way as banquet is related to _______",
    "options": ["hotel", "party", "feast", "super"],
    "correctIndex": 0,
    "explanation": "The second is the place where the first is held."
  },
  {
    "id": 31,
    "type": "text",
    "prompt": "A bird is related to cage in the same way man is related to _______",
    "options": ["house", "field", "room", "prison"],
    "correctIndex": 3,
    "explanation": "The first is locked up in the second."
  },
  {
    "id": 32,
    "type": "text",
    "prompt": "The Green Revolution is related to plants in the same way the Silver Revolution is related to _______",
    "options": ["poultry", "rubber", "animals", "forests"],
    "correctIndex": 2,
    "explanation": "The first is the name given to increase in the production of the second."
  },
  {
    "id": 33,
    "type": "text",
    "prompt": "Charcoal is related to wood in the same way coke is related to _______",
    "options": ["plastic", "graphite", "soot", "coal"],
    "correctIndex": 3,
    "explanation": "The first is obtained from the second."
  },
  {
    "id": 34,
    "type": "text",
    "prompt": "Joule is related to energy in the same way Pascal is related to _______",
    "options": ["volume", "pressure", "density", "purity"],
    "correctIndex": 1,
    "explanation": "Joule is the unit of energy and Pascal is the unit of pressure."
  },
  {
    "id": 35,
    "type": "text",
    "prompt": "Kindle is related to burn in the same way angry is related to _______",
    "options": ["annoyed", "determined", "resentful", "furious"],
    "correctIndex": 3,
    "explanation": "The second is the larger intensity of the first."
  },
  {
    "id": 36,
    "type": "text",
    "prompt": "Ostrich is related to antelope in the same way egret is related to _______",
    "options": ["cow", "buffalo", "camel", "zebra"],
    "correctIndex": 1,
    "explanation": "Both live together to derive benefits from each other."
  },
  {
    "id": 37,
    "type": "text",
    "prompt": "Blood is related to circulation in the same way hormone is related to _______",
    "options": ["egestion", "control", "co-ordination", "digestion"],
    "correctIndex": 2,
    "explanation": "The second is the function of the first."
  },
  {
    "id": 38,
    "type": "text",
    "prompt": "Man is related to arms in the same way cockroach is related to _______",
    "options": ["wings", "pseudopodia", "legs", "antennae"],
    "correctIndex": 3,
    "explanation": "The first uses the second for the purpose of holding."
  },
  {
    "id": 39,
    "type": "text",
    "prompt": "Transistor is related to radio in the same way television is related to _______",
    "options": ["entertainment", "cinema", "video", "cassette"],
    "correctIndex": 1,
    "explanation": "The second is the enlarged form of the first."
  },
  {
    "id": 40,
    "type": "text",
    "prompt": "Cobra is related to snake in the same way leopard is related to _______",
    "options": ["tiger", "lion", "cat", "zebra"],
    "correctIndex": 2,
    "explanation": "The first belongs to the family of the second."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test8'] = questions[:3]
data['quantitativeReasoningTests']['part2_secA_test8'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test8 with 40 questions to quantitativeReasoning.json')
