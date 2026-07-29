import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Find the wrong number in the series: 3, 8, 15, 24, 34, 48, 63",
    "options": ["15", "24", "34", "48", "63"],
    "correctIndex": 2,
    "explanation": "The difference between consecutive terms of the given series are respectively 5, 7, 9, 11 and 13. So 34 is the wrong number."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Find the wrong number in the series: 10, 26, 74, 218, 654, 1946, 5834",
    "options": ["26", "74", "218", "654", "1946"],
    "correctIndex": 3,
    "explanation": "Each term is obtained by multiplying the preceding term by 3 and then subtracting 4 from it. So, 26 = (10 × 3) - 4; 74 = (26 × 3) - 4; 218 = (74 × 3) - 4 and so on. So the wrong number is 654."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Find the wrong term in the series: 8, 14, 26, 48, 98, 194, 386",
    "options": ["194", "98", "14", "48", "386"],
    "correctIndex": 3,
    "explanation": "Each term in the series is less than twice the preceding term by 2. So, 48 is wrong, correct term = (26)2 - 2 = 52 - 2 = 50."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Find the wrong term in the series: 8, 13, 21, 32, 47, 63, 83",
    "options": ["21", "13", "32", "83", "47"],
    "correctIndex": 4,
    "explanation": "The sequence is +5, +8, +11, +14, and so on. Here 47 is wrong. Correct term = 32 + 14 = 46."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Find the wrong term in the series: 3, 7, 15, 39, 63, 127, 255, 511",
    "options": ["39", "15", "7", "63", "127"],
    "correctIndex": 0,
    "explanation": "Each number in the series is multiplied by 2 and the result increased by 1 to obtain the next number. ∴ 39 is wrong. The correct term = (15 × 2) + 1 = 31."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Find the wrong term in the series: 445, 221, 109, 46, 25, 11, 4",
    "options": ["221", "109", "46", "25", "11"],
    "correctIndex": 2,
    "explanation": "Each number is obtained by dividing the preceding number by 2 after subtracting 3 from it. i.e. 221 = (445 - 3)/2; 109 = (221 - 3)/2 and so on. ∴ 46 is wrong. The correct term is (109 - 3)/2 = 53."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Find the wrong term in the series: 1, 2, 6, 15, 31, 56, 91",
    "options": ["31", "15", "56", "91", "2"],
    "correctIndex": 3,
    "explanation": "The sequence is +1², +2², +3², +4², +5², +6². ∴ 91 is wrong. The correct number is 56 + 6² = 56 + 36 = 92."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Find the wrong term in the series: 2, 5, 10, 17, 26, 37, 50, 64",
    "options": ["50", "17", "26", "37", "64"],
    "correctIndex": 4,
    "explanation": "The numbers are 1² + 1, 2² + 1, 3² + 1 and so on. ∴ 64 is wrong. The correct term is 8² + 1 = 65."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Find the wrong term in the series: 46080, 3840, 384, 48, 24, 2, 1",
    "options": ["1", "2", "24", "48", "384"],
    "correctIndex": 2,
    "explanation": "The terms are successively divided by 12, 10, 8, 6 etc. So, 24 is wrong. Correct term = 48/6 = 8."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Find the wrong term in the series: 52, 51, 48, 43, 34, 27, 16",
    "options": ["51", "48", "34", "27", "16"],
    "correctIndex": 2,
    "explanation": "The sequence is -1, -3, -5, -7, -9, -11, etc. So, 34 is wrong. Correct term = 43 - 7 = 36."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Find the wrong term in the series: 325, 259, 202, 160, 127, 105, 94",
    "options": ["94", "127", "105", "202", "259"],
    "correctIndex": 3,
    "explanation": "The sequence is -66, -55, -44, -33, -22, -11. So, 202 is wrong. Correct term = 259 - 55 = 204."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Find the wrong term in the series: 125, 126, 124, 127, 123, 129",
    "options": ["123", "124", "126", "127", "129"],
    "correctIndex": 4,
    "explanation": "Sequence is +1, -2, +3, -4, +5. So, 129 is wrong. Correct term = 123 + 5 = 128."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Find the wrong term in the series: 3, 4, 10, 32, 136, 685, 4116",
    "options": ["136", "10", "4116", "685", "32"],
    "correctIndex": 4,
    "explanation": "Sequence is obtained by adding 1 to preceding term and then multiplying successively by 1, 2, 3, and so on. So, 32 is wrong. Correct term = (10 + 1)3 = 33."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Find the wrong term in the series: 25, 36, 49, 81, 121, 169, 225",
    "options": ["36", "49", "121", "169", "225"],
    "correctIndex": 0,
    "explanation": "The correct sequence is a set of squares of consecutive odd numbers. i.e. 5², 7², 9², 11², 13², 15². So, 36 is wrong in the series."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Find the wrong term in the series: 56, 72, 90, 110, 132, 150",
    "options": ["72", "90", "110", "132", "150"],
    "correctIndex": 4,
    "explanation": "The sequence is +16, +18, +20, +22, +24. So, 150 is wrong. Correct term = 132 + 24 = 156."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Find the wrong term in the series: 6, 13, 18, 25, 30, 37, 40",
    "options": ["25", "30", "37", "40", "13"],
    "correctIndex": 3,
    "explanation": "This is an alternate series. i.e. +7, +5, +7, +5 and so on. So, 40 is wrong. Correct term = 37 + 5 = 42."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Find the wrong term in the series: 10, 14, 28, 32, 64, 68, 132",
    "options": ["32", "68", "64", "132", "28"],
    "correctIndex": 3,
    "explanation": "Sequence is: 2nd term = 1st + 4 = 14; 3rd = 2nd × 2 = 28; 4th = 3rd + 4 = 32; 5th = 4th × 2 = 64 and so on. So, 132 is wrong. Correct term = 68 × 2 = 136."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test12'] = examples
data['quantitativeReasoningTests']['part2_secA_test12'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test12 with 2 examples and 15 questions to quantitativeReasoning.json')
