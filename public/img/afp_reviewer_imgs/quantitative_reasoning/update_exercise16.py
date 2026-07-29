import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If in a certain code, ALMIRAH is written as BNPMWGO, which word would be written as DNRWLUA?",
    "options": ["COSGOLT", "TOGSOLC", "TOGCLOS", "CLOSGOT", "COLSTOG"],
    "correctIndex": 3,
    "explanation": "In the code, the first letter is one place ahead, the second letter is two places ahead and so on than the corresponding letter in the word. So apply the same in the reverse direction to the given code so as to find the word. Therefore the answer is CLOSGOT."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If in a certain code, SWITCH is written as TVJSDG, which word would be written as CQFZE?",
    "options": ["BARED", "BRAED", "BREAD", "BRADE", "BRDAE"],
    "correctIndex": 2,
    "explanation": "Each letter in the code is one place ahead in odd places and one place before in even places from the corresponding letters of the word. So the answer is BREAD."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "In a certain code language, REFRIGERATOR is coded as ROTAREGIRFER. Which word would be coded as NOITINUMMA?",
    "options": ["ANMOMIUTNI", "AMNTOMUIIN", "AMMUNITION", "NMMUNITIOA", "None of these"],
    "correctIndex": 2,
    "explanation": "The order of letters of the word is reversed in the code. So, reverse the letters in the code to get the word. So the answer is AMMUNITION."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If in a certain language, UTENSIL is coded as WVGPUKN, which word would be coded as DMSFXG?",
    "options": ["BKQEVE", "BKQDWE", "BKQDWF", "BKQDVF", "BKQDVE"],
    "correctIndex": 4,
    "explanation": "Each letter of the word is two place behind the corresponding letters of the code. So the answer is BKQDVE."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If in a certain code language, REMOTE is coded as ROTEME, which word would be coded as PNIICC?",
    "options": ["NPIICC", "PICCIN", "PINCIC", "PICNIC", "PICINC"],
    "correctIndex": 3,
    "explanation": "The groups of second and third letters and fourth and fifth letters in the word interchange places in the code."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If in a certain language, SHIFT is coded as RFFBO, which word would be coded as LKUMB?",
    "options": ["MMXQG", "MLVNC", "KJVLA", "MJVLC", "KJTLA"],
    "correctIndex": 0,
    "explanation": "The first, second, third, fourth and fifth letters of the word are respectively one, two, three, four and five places ahead of the corresponding letters of the code."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If in a certain language, TRIANGLE is coded as SQHZMFKD, which word would be coded as DWZLOKD?",
    "options": ["EXAMPLE", "FIGMENT", "DISMISS", "DISJOIN", "None of these"],
    "correctIndex": 0,
    "explanation": "Each letter of word is one place ahead of corresponding letter of the code."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "If in a certain language GRASP is coded as BMVNK, which word would be coded as CRANE?",
    "options": ["FUDQH", "HWFSJ", "GVERI", "XMVIZ", "BQZMD"],
    "correctIndex": 1,
    "explanation": "Each letter of the word is five place ahead of the corresponding letter of the code."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "If in a certain language, MACHINE is coded as LBBIHOD, which word would be coded as SLTMFNB?",
    "options": ["RKSLEMA", "TKULGMC", "RMSNEOA", "TMUNGOC", "TMUNGMC"],
    "correctIndex": 1,
    "explanation": "In the code, we have alternatively one letter one place behind and the other one place ahead of the corresponding letter in the word."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "If in a certain language PORCELAIN is coded as QOSCFLBJO, which word is coded as BKMOUSPP?",
    "options": ["ALTOLROPY", "ALLOTROPY", "ALOTROLPY", "ATLOROPLY", "None of these"],
    "correctIndex": 1,
    "explanation": "In the code, we have one letter one place ahead of the corresponding letter in the word and the other letter coming in the even places remain unchanged."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "If in a certain language LBAEHC is the code for the word BLEACH, then which of the following is coded as NBOLZKMH?",
    "options": ["OBNKLHM", "LOBNHMKZ", "OCPMALNI", "MANKYJLG", "BNLOKZHM"],
    "correctIndex": 4,
    "explanation": "The word is formed into pairs of letters and letters in each pair is reversed."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If in a certain language POPULAR is coded as QPQVMBS, which word would be coded as GBNPVT?",
    "options": ["FAMOSU", "FAMOUS", "FASOUM", "FOSAUM", "FAMSUO"],
    "correctIndex": 1,
    "explanation": "Each letter of the word is one place behind the corresponding letter of the code."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "If in a certain language, CRICKET is coded as FULFNHW, then EULGH is the code for which word?",
    "options": ["PRIDE", "BRIDE", "BLADE", "BLIND", "None of these"],
    "correctIndex": 1,
    "explanation": "Each letter of the word is three places behind the corresponding letter of the code."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test16'] = examples
data['quantitativeReasoningTests']['part2_secA_test16'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test16 with 3 examples and 10 questions to quantitativeReasoning.json')
