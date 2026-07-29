import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Hygrometer is to humidity as sphygmomanometer is to _______",
    "options": ["pressure", "blood pressure", "precipitation", "heart beat"],
    "correctIndex": 1,
    "explanation": "The first is an instrument used to measure the second."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Steel is to Bokaro as hosiery is to _______",
    "options": ["Chennai", "Patna", "Vishakhapatnam", "Ludhiana"],
    "correctIndex": 3,
    "explanation": "Bokaro is famous for steel industry and Ludhiana is famous for hosiery works."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Milk is to water as ghee is to _______",
    "options": ["vanaspati", "mustard oil", "argemone", "cream"],
    "correctIndex": 0,
    "explanation": "The first is adulterated by using the second."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Insulin is to hormone as trypsin is to _______",
    "options": ["juice", "liver", "enzyme", "digestion"],
    "correctIndex": 2,
    "explanation": "The second denotes the class to which the first belongs. Thus, insulin is a hormone and trypsin is an enzyme."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Ploughing is to aeration as manuring is to _______",
    "options": ["fertile", "replenishment", "earthing", "agriculture"],
    "correctIndex": 1,
    "explanation": "Ploughing is done for the aeration of soil and manuring is done for the replenishment of soil."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Infestation is to food as infection is to _______",
    "options": ["germs", "diseases", "body", "microbes"],
    "correctIndex": 2,
    "explanation": "The contamination of food by germs is called infestation. Similarly, attack on body by germs is called infection."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Book is to publisher as film is to _______",
    "options": ["writer", "editor", "director", "producer"],
    "correctIndex": 3,
    "explanation": "The production of the first is done by the second."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Bicycle is to pedal as boat is to _______",
    "options": ["steering", "water", "oar", "sail"],
    "correctIndex": 2,
    "explanation": "The second is the tool which is acted upon to move the first."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Latex is to rubber as flax is to _______",
    "options": ["linen", "wool", "jute", "cotton"],
    "correctIndex": 0,
    "explanation": "The first is the raw material used to obtain the second."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Cattle is to fodder as fish is to _______",
    "options": ["hay", "insects", "feed", "plankton"],
    "correctIndex": 3,
    "explanation": "The second is the food eaten by the first."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Algae is to water as virus is to _______",
    "options": ["man", "host", "surroundings", "soil"],
    "correctIndex": 1,
    "explanation": "The second is the dwelling place for the first."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Insomnia is to lead as minamata is to _______",
    "options": ["tobacco", "mercury", "alcohol", "chromium"],
    "correctIndex": 1,
    "explanation": "The poisoning by the second causes the first."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Orange is to peel as tooth is to _______",
    "options": ["gums", "clove", "enamel", "joints"],
    "correctIndex": 2,
    "explanation": "The second is the protective covering over the first."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Hear is to deaf as speak is to _______",
    "options": ["quiet", "silent", "mumb", "dumb"],
    "correctIndex": 3,
    "explanation": "One who cannot hear is deaf. Similarly, one who cannot speak is dumb."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Exercise is to obesity as water is to _______",
    "options": ["thirst", "alcohol", "drink", "purity"],
    "correctIndex": 0,
    "explanation": "The first eliminates the second."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Food is to fad as religion is to _______",
    "options": ["crucification", "notion", "superstition", "mythology"],
    "correctIndex": 2,
    "explanation": "The second is the name given to wrong notions about the first."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Sulphur is to vulcanisation as chlorine is to _______",
    "options": ["extraction", "bleaching", "metallurgy", "allotropy"],
    "correctIndex": 1,
    "explanation": "Sulphur is used for vulcanisation of rubber. Likewise, chlorine is used for bleaching."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Magnalium is to aluminium as brass is to _______",
    "options": ["lead", "magnetism", "iron", "copper"],
    "correctIndex": 3,
    "explanation": "Magnalium is an ore of aluminium and brass is an ore of copper."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Infrared is to heat as ultraviolet is to _______",
    "options": ["cancer", "blisters", "mutation", "ozone"],
    "correctIndex": 0,
    "explanation": "The second is the effect produced by the first."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Zinc is to galvanisation as nickel is to _______",
    "options": ["aircraft", "corrosion", "electroplating", "filament"],
    "correctIndex": 2,
    "explanation": "The second is the purpose for which first is used."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Memory is to amnesia as movement is to _______",
    "options": ["lubrication", "lethargy", "paralysis", "hermit"],
    "correctIndex": 2,
    "explanation": "The lack of memory is amnesia and lack of movement is paralysis."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Liquid is to fluidity as comedian is to _______",
    "options": ["ridicule", "humour", "solemnity", "companion"],
    "correctIndex": 1,
    "explanation": "The second is the defining characteristic of the first."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "Kilometre is to distance as poundal is to _______",
    "options": ["density", "acceleration", "momentum", "force"],
    "correctIndex": 3,
    "explanation": "Kilometre is a unit of distance and poundal is a unit of force."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Truthfulness is to liar as loyalty is to _______",
    "options": ["worker", "traitor", "diligent", "faithful"],
    "correctIndex": 1,
    "explanation": "The lack of first is the defining characteristic of the second."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Preface is to book as overture is to _______",
    "options": ["opera", "ballad", "novel", "symphony"],
    "correctIndex": 0,
    "explanation": "The first is an opening comment on the second."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Aluminium is to bauxite as iron is to _______",
    "options": ["pyrite", "magnesite", "pyrolusite", "haematite"],
    "correctIndex": 3,
    "explanation": "The second is the ore used for extraction of the first."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Tempest is to storm as slim is to _______",
    "options": ["fat", "plump", "slender", "beautiful"],
    "correctIndex": 2,
    "explanation": "The first is of the higher intensity than the second."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Amorphousness is to definition as lassitude is to _______",
    "options": ["energy", "awareness", "uniformity", "companionship"],
    "correctIndex": 0,
    "explanation": "The given words are opposite to each other."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Tiff is to battle as frugal is to _______",
    "options": ["sprint", "vague", "miserly", "vital"],
    "correctIndex": 2,
    "explanation": "The second is of higher intensity than the first."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Exculpate is to acquit as precise is to _______",
    "options": ["concise", "conceal", "brief", "particular"],
    "correctIndex": 3,
    "explanation": "The given words are synonyms of each other."
  },
  {
    "id": 31,
    "type": "text",
    "prompt": "Burma is to Pagodas as Pakistan is to _______",
    "options": ["Rivers", "Canals", "Agriculture", "Dams"],
    "correctIndex": 1,
    "explanation": "Burma is famous for pagodas and Pakistan is famous for canals."
  },
  {
    "id": 32,
    "type": "text",
    "prompt": "Bhakra is to Sutlej as Aswan is to _______",
    "options": ["Indus", "Damodar", "Volga", "Nile"],
    "correctIndex": 3,
    "explanation": "Bhakra is a dam situated on the Sutlej river. Similarly, Aswan is a dam situated on Nile river."
  },
  {
    "id": 33,
    "type": "text",
    "prompt": "Sparrow is to seed as silkworm is to _______",
    "options": ["silk", "maple", "mulberry", "pune"],
    "correctIndex": 2,
    "explanation": "The first feeds on the second."
  },
  {
    "id": 34,
    "type": "text",
    "prompt": "Pineapple is to jelly as tomato is to _______",
    "options": ["jam", "pury", "squash", "pickles"],
    "correctIndex": 1,
    "explanation": "The first is preserved in the form of the second."
  },
  {
    "id": 35,
    "type": "text",
    "prompt": "Aseel is to poultry as salmon is to _______",
    "options": ["cow", "camel", "fish", "horse"],
    "correctIndex": 2,
    "explanation": "Aseel is a breed of poultry and salmon is a breed of fish."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test9'] = questions[:3]
data['quantitativeReasoningTests']['part2_secA_test9'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test9 with 35 questions to quantitativeReasoning.json')
