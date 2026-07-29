import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "What will be the next term in: BKS, DJT, FIU, HHV, (...)",
    "options": ["IJX", "IGX", "JGW", "IGU", "JGU"],
    "correctIndex": 2,
    "explanation": "In each term, the first letter is moved forward by 2 letters, the second letter backward by 1 letter and the third letter moved forward by 1 letter. So the missing term is JGW."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Choose the alternative that will complete the series: aku, fpz, kue, (...), ueo, zjt",
    "options": ["pzj", "jtd", "jue", "kve", "ukv"],
    "correctIndex": 0,
    "explanation": "The letters in each term in all the positions are moved forward by 5. So the missing term = pzj."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "What terms will fill in the blank spaces? Y W U S Q (...) (...)",
    "options": ["N, J", "M, L", "J, R", "L, M", "O, M"],
    "correctIndex": 4,
    "explanation": "The given series consists of alphabet in the reverse order moved by 2 in each step. So the missing terms are O and M."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: AZ, BY, CX, ?",
    "options": ["EF", "GH", "IJ", "DE", "DW"],
    "correctIndex": 4,
    "explanation": "In each term, the first letter is moved 1 step forward and the second letter is moved 1 step backward to obtain the corresponding letters of the successive terms."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: DEF HIJ MNO ?",
    "options": ["STU", "RST", "RTV", "SRQ", "TUV"],
    "correctIndex": 0,
    "explanation": "The letters in each term are consecutive. There is a gap of one letter between the last letter of the first term and the first letter of the second term. In the successive terms the gap increases by one. So the last term is STU, which is having a gap of 3 letters from the last letter of the previous term."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: BXJ ETL HPN KLP ?",
    "options": ["NHR", "MHQ", "MIP", "NIR", "None of these"],
    "correctIndex": 0,
    "explanation": "The first, second and third letters of each term are moved three steps forward, four steps backward and two steps forward respectively to obtain the corresponding letters of the successive terms."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: AB DEF HIJK ? STUVWX",
    "options": ["MNOPQ", "LMNOP", "LMNO", "QRSTU", "None of these"],
    "correctIndex": 0,
    "explanation": "The number of letters in the terms increases by one at every step. Each term consists of letters in the alphabetical order. There is a gap of one letter between the last letter of a term and first letter of next term."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Choose the missing terms in the letter series: A Z X B V T C R (?), (?)",
    "options": ["P, D", "E, O", "Q, E", "O, Q", "Q, O"],
    "correctIndex": 0,
    "explanation": "The first, fourth and seventh letters are in alphabetical order. So the tenth letter would be the letter after C. i.e., D. The second and third are alternate and in the reverse order and so are the fifth and sixth and eighth and ninth. So 9th letter = R - 2 = P. So the answer is P, D."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: G, H, J, M, (?), V",
    "options": ["T", "S", "R", "U", "Q"],
    "correctIndex": 4,
    "explanation": "The first, second, third, fourth and fifth terms are moved one, two, three, four and five steps respectively forward to obtain the successive terms so, M + 4 = Q."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Choose the missing term in the series: P3C, R5F, T8I, V12L, ?",
    "options": ["Y17O", "X17M", "X17O", "X16O", "None of these"],
    "correctIndex": 2,
    "explanation": "The first letters of the terms are alternate. The last letters of the terms are three steps ahead of last letter of the preceding term. The middle letter of the term follows the pattern +2, +3, +4, +5. So the next term = X17O."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: AYD BVF DRH ? KGL",
    "options": ["FMI", "GMJ", "HLK", "GLJ", "None of these"],
    "correctIndex": 1,
    "explanation": "The first letters of the term are moved one, two, three and four steps forward respectively to obtain the first letter of the successive terms. The second letters of the term are moved three, four, five, and six steps backward respectively to obtain the second letters of the successive terms. The last letters of the terms are alternate."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: CX FU IR ? OL RI",
    "options": ["LO", "MN", "NO", "OP", "OR"],
    "correctIndex": 0,
    "explanation": "The first letter of each term is moved three steps forward and the second letter is moved three steps backward to obtain the corresponding letters of the next term."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: DEB IJG NOL ? XYV",
    "options": ["RSP", "STP", "RSQ", "STQ", "STO"],
    "correctIndex": 3,
    "explanation": "The letters in each term are moved five steps forward to obtain the letters of the next term."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: A CD GHI ? UVWXY",
    "options": ["LMNO", "MNO", "NOPQ", "NOP", "MNOP"],
    "correctIndex": 4,
    "explanation": "The first term consists of one letter, the second term consists of two letters and the third letter consists of three letters. So, the required term consists of four letters. The last letter of first term and the first letter of the second term differ by two letters. Similarly, a gap of two letters is there between the last letter of second term and the first letter of the third term. So the first letter of required term would be four steps ahead from the last letter of third term (MNOP)."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: EJOT DHLP CFIL ?",
    "options": ["BDFH", "BHLH", "DEIJ", "DGKL", "HFDB"],
    "correctIndex": 0,
    "explanation": "The letters of each term are moved one step backward to obtain the corresponding letters of the next term."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: OTE PUF QVG RWH ?",
    "options": ["SYJ", "TXI", "SXJ", "SXI", "TYJ"],
    "correctIndex": 3,
    "explanation": "The first letters of the terms are in alphabetical order, and so are the second and third letters."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: DCXW FEVU HGTS ?",
    "options": ["LKPO", "ABYZ", "JIRQ", "LMRS", "JRIQ"],
    "correctIndex": 2,
    "explanation": "The first two letters of the term are in the reverse order. Similarly, the third and fourth letters of the term are also in the reverse order. Besides, the second letter of each term is the letter next to the first letter of the preceding term."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Choose the missing terms in the letter series: R, M, (?), F, D, (?)",
    "options": ["C, B", "J, H", "B, H", "H, C", "I, C"],
    "correctIndex": 4,
    "explanation": "The letters are in the reverse order in which letters are moved 1, 2, 3, 4 and 5 steps from the last."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: C, B, A, E, D, Z, G, F, (?)",
    "options": ["X", "Y", "V", "H", "J"],
    "correctIndex": 1,
    "explanation": "The third, sixth and ninth letters of the series are in reverse alphabetical order."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: CMW, HRB, (?), RBL, WGQ, BLV",
    "options": ["MWG", "LVF", "LWG", "MXG", "WMX"],
    "correctIndex": 0,
    "explanation": "All the letters of each term are moved five steps forward to obtain the corresponding letters of the next term."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: HS, JQ, LO, NM, (?)",
    "options": ["PK", "RH", "PL", "TG", "RT"],
    "correctIndex": 0,
    "explanation": "The first letter of each term is moved two steps forward and the second letter is moved two steps backward to obtain the corresponding letters of the next term."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: QPO, SRQ, UTS, WVU, (?)",
    "options": ["XVZ", "ZYA", "YXW", "VWX", "AZY"],
    "correctIndex": 2,
    "explanation": "Each term in the series consists of three consecutive letters in the reverse order. The first letter of each term and the last letter of the next term are the same."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Choose the missing term in the letter series: ABP, CDQ, EFR, (?)",
    "options": ["GHS", "GHT", "HGS", "GHR", "GSH"],
    "correctIndex": 0,
    "explanation": "The first and second letters of each term are moved two steps forward to obtain the corresponding letters of the next term. The third letter of the terms are consecutive terms in the alphabet."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test13'] = examples
data['quantitativeReasoningTests']['part2_secA_test13'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test13 with 3 examples and 20 questions to quantitativeReasoning.json')
