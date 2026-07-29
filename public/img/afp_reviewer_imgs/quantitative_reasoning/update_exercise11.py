import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Tick the number that will come next in the sequence: 4, 6, 12, 14, 28, 30, (...)",
    "options": ["32", "64", "62", "60"],
    "correctIndex": 3,
    "explanation": "The given sequence is a combination of two series 4, 12, 28, (...) and 6, 14, 30. The number pattern followed in the first series is +8, +16, +32, .... So, the missing number = 28 + 32 = 60."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Complete the series: 4, -8, 16, -32, 64, (...)",
    "options": ["128", "-128", "192", "-192"],
    "correctIndex": 1,
    "explanation": "Each number in the series is got by multiplying the preceding number by -2. ∴ Missing term = 64 × (-2) = -128."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Which number would replace the question mark in the series 2, 7, 14, 23, ?, 47.",
    "options": ["28", "34", "31", "38"],
    "correctIndex": 1,
    "explanation": "The given sequence is +5, +7, +9, ... i.e. 2 + 5 = 7; 7 + 7 = 14; 14 + 9 = 23. ∴ Missing number = 23 + 11 = 34."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Complete the series: 2, 6, 11, 17, (...), 32",
    "options": ["22", "23", "24", "28"],
    "correctIndex": 2,
    "explanation": "The sequence is +4, +5, +6 ... ∴ Missing term = 17 + 7 = 24."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Complete the series: 3, 10, 20, 33, 49, 68, (...)",
    "options": ["75", "85", "90", "91"],
    "correctIndex": 2,
    "explanation": "The sequence is +7, +10, +13, +16, +19 ... ∴ Missing number = 68 + 22 = 90."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Complete the series: 3, 7, 15, 31, 63, (...)",
    "options": ["92", "127", "115", "131"],
    "correctIndex": 1,
    "explanation": "Each number in the series is the preceding number multiplied by 2 and then increased by 1. Thus (3 × 2) + 1 = 7; (7 × 2) + 1 = 15; (15 × 2) + 1 = 31 and so on."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Complete the series: 6, 24, 12, (...), 18, 8, 24",
    "options": ["4", "8", "16", "6"],
    "correctIndex": 2,
    "explanation": "The given sequence is a combination of two series 6, 12, 18, 24, and 24, (...), 8. The first series consists of consecutive multiples of 6 and the second series consists of multiples of 8. Thus, the missing number is a multiple of 8 which lies between 8 and 24, which is 16."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Complete the series: 212, 179, 146, 113, (...)",
    "options": ["91", "79", "112", "80"],
    "correctIndex": 3,
    "explanation": "33 is subtracted from each term of the series to obtain the next term. ∴ Missing term = 113 - 33 = 80."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Complete the series: 2, 6, 3, 4, 20, 5, 6, (...), 7",
    "options": ["25", "30", "42", "28"],
    "correctIndex": 2,
    "explanation": "The arrangement of series is as follows: 2 × 3 = 6; 4 × 5 = 20, and so on. Here from each three consecutive term, middle term = product of two end terms. So the missing number = 6 × 7 = 42."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Complete the series: 2, 5, 9, 19, 37, (...)",
    "options": ["76", "75", "74", "72"],
    "correctIndex": 1,
    "explanation": "Here, the numbers in the even position are equal to the numbers in the odd position multiplied by 2 and added by 1. The numbers in the odd positions are got by multiplying numbers in the even position by 2 and subtracting 1 from it. So the answer is 37 × 2 + 1 = 75."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Complete the series: 2, 6, 12, 20, 30, 42, 56, (...)",
    "options": ["60", "64", "70", "72"],
    "correctIndex": 3,
    "explanation": "The sequence is 1 × 2, 2 × 3, 3 × 4, 4 × 5, 5 × 6, 6 × 7, 7 × 8. ∴ Next number = 8 × 9 = 72."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Complete the series: 8, 24, 12, 36, 18, 54, (...)",
    "options": ["27", "68", "72", "108"],
    "correctIndex": 0,
    "explanation": "This series is got by alternatively multiplying by 3 and dividing by 2. So, 8 × 3 = 24; 24 ÷ 2 = 12, 12 × 3 = 36; 36 ÷ 2 = 18 and so on. ∴ The missing term = 54 ÷ 2 = 27."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Complete the series: 165, 195, 255, 285, 345, (...)",
    "options": ["375", "420", "435", "390"],
    "correctIndex": 2,
    "explanation": "This series is a multiple of consecutive prime numbers. i.e. 15 × 11, 15 × 13, 15 × 17, 15 × 19, 15 × 23. ∴ The missing term = 15 × 29 = 435."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Complete the series: 71, 76, 69, 74, 67, 72, (...)",
    "options": ["65", "76", "77", "80"],
    "correctIndex": 0,
    "explanation": "Here the series is got by addition of 5 and subtraction of 7 to terms alternately. Here, 71 + 5 = 76; 76 - 7 = 69; 69 + 5 = 74; 74 - 7 = 67 and so on. So the missing term = 72 - 7 = 65."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Complete the series: 9, 12, 11, 14, 13, (...), 15",
    "options": ["12", "16", "10", "17"],
    "correctIndex": 1,
    "explanation": "Alternately, add 3 and subtract 1. So 9 + 3 = 12; 12 - 1 = 11; 11 + 3 = 14; 14 - 1 = 13. So the missing term = 13 + 3 = 16."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Complete the series: 3, 15, 35, (...), 99, 143",
    "options": ["48", "63", "80", "95"],
    "correctIndex": 1,
    "explanation": "The terms of the series are 2² - 1, 4² - 1, 6² - 1, ..., 10² - 1, 12² - 1. So, the missing number = 8² - 1 = 64 - 1 = 63."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Complete the series: 3, 10, 20, 33, 49, 68, (...)",
    "options": ["75", "85", "90", "91"],
    "correctIndex": 2,
    "explanation": "The sequence is +7, +10, +13, +16, +19, ... So, the missing number = 68 + 22 = 90."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Complete the series: 1, 3, 4, 8, 15, 27, (...)",
    "options": ["37", "44", "50", "55"],
    "correctIndex": 2,
    "explanation": "The sum of any three consecutive terms of the series gives the next term. So, 1 + 3 + 4 = 8; 3 + 4 + 8 = 15; 4 + 8 + 15 = 27 and so on. ∴ The missing number = 8 + 15 + 27 = 50."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Complete the series: 66, 36, 18, (...)",
    "options": ["9", "3", "6", "8"],
    "correctIndex": 3,
    "explanation": "Each number in the series is the product of the digits of the preceding number. i.e. 6 × 6 = 36; 3 × 6 = 18 and so on. ∴ The missing number = 1 × 8 = 8."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Complete the series: 11, 13, 17, 19, 23, 25, (...)",
    "options": ["25", "27", "29", "31"],
    "correctIndex": 2,
    "explanation": "The sequence is +2, +4, +2, +4, +2, ... ∴ The missing number = 25 + 4 = 29."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Complete the series: 2, 4, 7, 11, 16, (...)",
    "options": ["18", "20", "22", "25"],
    "correctIndex": 2,
    "explanation": "The difference between consecutive numbers increases by 1. Thus, the sequence is +2, +3, +4, +5 ... ∴ The missing number = 16 + 6 = 22."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Complete the series: 0, 2, 6, (...), 20, 30, 42",
    "options": ["8", "10", "12", "14"],
    "correctIndex": 2,
    "explanation": "The sequence is +2, +4, +6, +8, +10, +12. So, the missing number = 6 + 6 = 12."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Complete the series: 5, 16, 13, 26, 29, 58, 61, (...)",
    "options": ["122", "125", "128", "64"],
    "correctIndex": 0,
    "explanation": "The numbers are alternately multiplied by 2 and increased by 3. So, 5 × 2 = 10; 10 + 3 = 13; 13 × 2 = 26; 26 + 3 = 29 and so on. ∴ The missing number = 61 × 2 = 122."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Complete the series: 2, 9, 28, 65, 126, (...)",
    "options": ["137", "223", "217", "199"],
    "correctIndex": 2,
    "explanation": "The sequence is 1³ + 1, 2³ + 1, 3³ + 1, 4³ + 1, 5³ + 1, ... ∴ The missing number = 6³ + 1 = 216 + 1 = 217."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Complete the series: 4, 9, 13, 22, 35, (...)",
    "options": ["57", "70", "63", "75"],
    "correctIndex": 0,
    "explanation": "The sum of two consecutive numbers of the series gives the next number. Thus, 4 + 9 = 13; 9 + 13 = 22; 13 + 22 = 35 and so on. ∴ The missing number = 22 + 35 = 57."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "Complete the series: 1, 8, 27, 64, 125, 216, (...)",
    "options": ["354", "343", "392", "245"],
    "correctIndex": 1,
    "explanation": "The numbers are 1³, 2³, 3³, 4³, 5³, 6³ and so on. ∴ The missing number = 7³ = 343."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Complete the series: 1, 2, 3, 6, 9, 18, (...), 54",
    "options": ["18", "36", "81", "27"],
    "correctIndex": 3,
    "explanation": "The numbers are alternately multiplied by 2 and 3/2. Thus, 1 × 2 = 2; 2 × 3/2 = 3; 3 × 2 = 6; 6 × 3/2 = 9, and so on. ∴ The missing number = 18 × 3/2 = 27."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Complete the series: 11, 13, 17, 19, 23, 29, 31, 37, 41, (...)",
    "options": ["43", "47", "51", "53"],
    "correctIndex": 0,
    "explanation": "The series consists of prime numbers. ∴ The missing number is the next prime number, which is 43."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Complete the series: 2, 5, 11, 23, 47, (...)",
    "options": ["49", "52", "95", "106"],
    "correctIndex": 2,
    "explanation": "The sequence is +3, +6, +12, +24 ... ∴ The missing number = 47 + 48 = 95."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Complete the series: 4, 9, 5, 12, 7, 15, 8, (...), 10",
    "options": ["25", "18", "21", "24"],
    "correctIndex": 1,
    "explanation": "The given sequence is a combination of two series 4, 5, 7, 8, 10 and 9, 12, 15, (...) ∴ The missing term = 15 + 3 = 18."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Complete the series: 10, 5, 13, 10, 16, 20, 19, (...)",
    "options": ["22", "23", "38", "40"],
    "correctIndex": 3,
    "explanation": "The given sequence consists of two series: 10, 13, 16, 19 and 5, 10, 20, (...) ∴ The missing number = 20 × 2 = 40."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Complete the series: 2, 6, 12, 20, 30, 42, 56, (...)",
    "options": ["60", "64", "70", "72"],
    "correctIndex": 3,
    "explanation": "The sequence is 1 × 2, 2 × 3, 3 × 4, 4 × 5, 5 × 6, 6 × 7, 7 × 8. ∴ The missing term = 8 × 9 = 72."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Complete the series: 2, 3, 5, 7, 11, (...), 17",
    "options": ["12", "13", "14", "15"],
    "correctIndex": 1,
    "explanation": "The given series consists of prime numbers starting from 2. The prime number after 11 is 13. So, 13 is the missing number."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test11'] = examples
data['quantitativeReasoningTests']['part2_secA_test11'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test11 with 3 examples and 30 questions to quantitativeReasoning.json')
