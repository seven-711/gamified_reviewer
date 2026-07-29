import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If in a certain language, TAP is coded as SZO, then how will FREEZE be coded?",
    "options": ["ESDFYF", "GQFDYF", "EQDFYG", "EQDDYD"],
    "correctIndex": 3,
    "explanation": "Clearly, each letter in the code is the alphabet before the corresponding letter in the word. Thus, in FREEZE, F is coded as E, R as Q, E as D and Z as Y. So, the answer is EQDDYD."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If in a certain language GAMBLE is coded as FBLCKF, how will FLOWER be coded in that code?",
    "options": ["GKPVFQ", "EMNXDS", "GMPVDS", "HNQYGT", "EKNVDQ"],
    "correctIndex": 1,
    "explanation": "The letters preceding the letters at odd places of the word and those succeeding the even places of the word in the alphabets form the code. Hence the answer is EMNXDS."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If in a certain language PENSION is coded as NEISNOP, how will FOLIAGE be coded in that code?",
    "options": ["OFILGAE", "EOAILGF", "FGLIAOE", "EGAILOF", "FILOGAE"],
    "correctIndex": 1,
    "explanation": "In the code, first and last letters are reversed, second and second last letters are the same, third and third last letters are reversed and the middle letter remains the same. Hence the answer is EOAILGF."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If PLANE is coded as OKZMD in a certain language, how will TRAIN be coded?",
    "options": ["SQZHM", "UQBHO", "SQZJM", "USBJM", "USBJO"],
    "correctIndex": 0,
    "explanation": "The letter preceding each letter of the given word in the alphabet is taken as the subsequent letter of its code."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If in a certain language; SPACE is coded as TQBDF, how will PURSE be coded in that code?",
    "options": ["QTSRF", "OVQTD", "QVSTF", "ESRUP", "OTQRD"],
    "correctIndex": 2,
    "explanation": "Each letter of the given word is moved one step ahead to obtain the subsequent letter of its code."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If in a certain language NATURE is coded as MASUQE, how is FAMINE coded in that code?",
    "options": ["FBMJND", "FZMHND", "GANIOE", "EALIME", "FZNJME"],
    "correctIndex": 3,
    "explanation": "The letters preceding the letters at odd places in the given word are taken as the corresponding letters of the code while those at even places remain the same."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If in a certain language SECURE is coded as ERUCES, how is SALINE coded in that code?",
    "options": ["SALIQE", "EALINS", "ENILAS", "ERUCES", "SLANIE"],
    "correctIndex": 2,
    "explanation": "The word is wholly reversed in the code."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "If in a certain language MECHANICS is coded as HCEMASCIN, how is POSTER coded in that code?",
    "options": ["OPTSRE", "SOPRET", "RETSOP", "TERPOS", "POTSER"],
    "correctIndex": 1,
    "explanation": "In the code the first four and the last four letters are reversed in order."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "If in a certain language DISPEL is coded as IDPSLE, how is EFFECT coded in that language?",
    "options": ["FEEFTC", "CTFEEF", "EFFFTC", "ECTEFF", "EEFFCT"],
    "correctIndex": 0,
    "explanation": "In the code, every two letters are reversed in order."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "If BATCH is coded as ABSDG, how is FORSAKE coded in that code?",
    "options": ["ABDGS", "EPQTZLD", "EQPZLTD", "GDSBA", "None of these"],
    "correctIndex": 1,
    "explanation": "In the code, the letters at odd places are one place before and those at even place are one place after the corresponding letter in the word."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "In a certain code, GOODNESS is coded as HNPCODTR. How is GREATNESS coded in that code?",
    "options": ["HQFZUODTR", "HQFZUMFRT", "HQFZSMFRT", "FSDBSODTR", "HQFZUFRT"],
    "correctIndex": 1,
    "explanation": "In the code the letters at odd places are one alphabet ahead and those at even places are one alphabet before the corresponding letter in the word."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If FOUGHT is coded as EQRKCZ, how will MALE be coded?",
    "options": ["LCH", "NZMD", "KCMI", "NBIF", "LBID"],
    "correctIndex": 0,
    "explanation": "In the code the first letter is one place before, the second letter is two places ahead the third letter is three places before, the fourth letter is four places ahead, and so on."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "If in a certain language BLEMISH is coded as AODPHVG, how will CHAPTER be coded in that code?",
    "options": ["DEBOVTDR", "BKZSSHQ", "CAHTPRE", "BGAQMFP", "ADGIQFS"],
    "correctIndex": 1,
    "explanation": "In the code, the letters at odd places are one place before and those at even places are three places ahead of the corresponding letters in the word."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test15'] = examples
data['quantitativeReasoningTests']['part2_secA_test15'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test15 with 3 examples and 10 questions to quantitativeReasoning.json')
