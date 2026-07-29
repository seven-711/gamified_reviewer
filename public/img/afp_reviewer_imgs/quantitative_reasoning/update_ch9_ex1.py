import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "How many 7s immediately preceded by 6 but not immediately followed by 4 are there in the following series?\n\n7 4 2 7 6 4 3 6 7 5 3 5 7 8 4 3 7 6 7 2 4 0 6 7 4 3",
    "options": ["1", "2", "4", "6", "None of these"],
    "correctIndex": 1,
    "explanation": "Clearly, the numbers satisfying the given conditions can be shown as follows:\n7 4 2 7 6 4 3 6 7 5 3 5 7 8 4 3 7 6 7 2 4 0 6 7 4 3\n\nHere there are two such 7s in the number series which are preceded by 6 and not followed by 4 (6 7 5 and 6 7 2). Therefore, the answer is 2."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "How many 1s are there in the following sequence which are immediately preceded by 9 but not immediately followed by 7?\n\n7 1 9 1 1 7 1 8 9 1 7 1 2 1 3 1 4 5 7 1 3 9 1 7",
    "options": ["One", "Two", "Three", "Four", "None of these"],
    "correctIndex": 0,
    "explanation": "Looking at the sequence: 7 1 9 1 1 7 1 8 9 1 7 1 2 1 3 1 4 5 7 1 3 9 1 7\nThe 1s preceded by 9 are:\n- In '9 1 1', the first 1 is preceded by 9 and followed by 1 (not 7).\n- In '9 1 7', the 1 is followed by 7.\n- In '9 1 7' at the end, the 1 is followed by 7.\nThus, there is only one such 1. Therefore, the answer is One."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "In the following series of numbers, how many times have the figures 9, 1 and 8 appeared together, 1 being in the middle and 9 and 8 being on either side of 1?\n\n2 1 9 8 1 9 8 3 7 1 9 7 8 1 2 9 1 9 8 1 8 2 1 2",
    "options": ["One", "Six", "Three", "Four", "None of these"],
    "correctIndex": 0,
    "explanation": "We look for combinations '9 1 8' or '8 1 9':\nIn the series: 2 1 9 8 1 9 8 3 7 1 9 7 8 1 2 9 1 9 8 1 8 2 1 2\nChecking instances with 1 in the middle, only '8 1 9' appears once. Therefore, the answer is One."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Sajith ranked thirteenth from the top and twenty sixth from the bottom among those who have passed in the annual examination in a class. If six students have failed in the annual examination, what was the total number of students in that class?",
    "options": ["38", "44", "45", "50", "None of these"],
    "correctIndex": 1,
    "explanation": "Number of students passed = (12 + 1 + 25) = 38\nNumber of students failed = 6\nTotal number of students = 38 + 6 = 44."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Sanal's position in a row is 12th from the front side and 7th from the back side. How many persons are standing in that row?",
    "options": ["17", "18", "19", "20", "21"],
    "correctIndex": 1,
    "explanation": "Number of persons in the row = 11 + 6 + 1 = 18 persons."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "The Managing Director entered the conference room ten minutes before 12.30 hours for interviewing. He came 20 minutes before the chairman who was 30 minutes late. At what time were the interviews scheduled?",
    "options": ["12.50", "12.40", "12.20", "12.10", "12.00 Noon"],
    "correctIndex": 3,
    "explanation": "The Managing Director came at 12.20 (10 minutes before 12.30).\nThus the chairman came at 12.40 (20 minutes after MD).\nSince the chairman was late by 30 minutes, interviews were scheduled to be held at 12.10."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "How many 8s are there in the following number sequence which are preceded by 7 but not immediately followed by 4?\n\n2 3 8 2 5 7 8 3 7 8 4 6 9 8 4 3 2 7 8 9 5 7 8 1 5 2 9",
    "options": ["One", "Two", "Three", "Four", "None of these"],
    "correctIndex": 2,
    "explanation": "There are three such 8s which are preceded by 7 but not immediately followed by 4:\n1) ... 7 8 3 ...\n2) ... 7 8 9 ...\n3) ... 7 8 1 ..."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "How many 3s are there in the following number sequence which are immediately preceded by 6 but not immediately followed by 7?\n\n2 3 7 4 3 5 6 3 7 4 6 3 8 9 6 3 5 1 8 3 7 2 4 2 8 6 3 9",
    "options": ["One", "Two", "Three", "Four", "More than four"],
    "correctIndex": 2,
    "explanation": "There are three such 3s which are immediately preceded by 6 but not immediately followed by 7:\n1) ... 6 3 8 ...\n2) ... 6 3 5 ...\n3) ... 6 3 9 ..."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "How many numbers from 11 to 50 are there which are exactly divisible by 7 but not by 3?",
    "options": ["Two", "Four", "Five", "Six", "Seven"],
    "correctIndex": 1,
    "explanation": "No. of numbers which are divisible by 7 from 11 to 50 = (49 - 14)/7 + 1 = 6 (14, 21, 28, 35, 42, 49).\nOut of these, numbers divisible by 3 are 21 and 42.\n∴ Required numbers = 14, 28, 35, 49.\n∴ Required no. of numbers = 4."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "How many numbers from 1 to 100 are there each of which is not only exactly divisible by 4 but also has 4 as a digit?",
    "options": ["7", "10", "20", "21", "More than 21"],
    "correctIndex": 0,
    "explanation": "Numbers from 1 to 100 which are divisible by 4 and have 4 as a digit are 4, 24, 40, 44, 48, 64, 84.\n∴ Required number of numbers = 7."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Abhishek ranks thirteenth in a class of thirty one. What is his rank from the last?",
    "options": ["15th", "17th", "19th", "20th", "None of these"],
    "correctIndex": 2,
    "explanation": "Rank of Abhishek from last = 31 - 13 + 1 = 19th."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "In a row of girls, if Savitha who is tenth from the left and Anita who is ninth from the right interchange their places, Savitha becomes fifteenth from the left. How many girls are there in the row?",
    "options": ["16", "18", "19", "22", "None of these"],
    "correctIndex": 4,
    "explanation": "Savitha's present position = 15th from left = Anita's previous position = 9th from right.\n∴ No. of girls in the row = 15 + 9 - 1 = 23.\nSince 23 is not among choices (a) to (d), the answer is None of these."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "How many days will there be from 26th January, 1988 to 15th May, 1988 (both days included)?",
    "options": ["110", "111", "112", "113", "None of these"],
    "correctIndex": 1,
    "explanation": "1988 is a leap year (February has 29 days).\nNumber of days:\n- January: 6 days (26th to 31st)\n- February: 29 days\n- March: 31 days\n- April: 30 days\n- May: 15 days\nTotal = 6 + 29 + 31 + 30 + 15 = 111 days."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Ram remembers that Lakshman's birthday is after 19th but before 22nd November, whereas Anil remembers that Lakshman's birthday is after 20th but before 24th November. Which day is Lakshman's birthday?",
    "options": ["20th November", "21st November", "22nd November", "23rd November", "None of these"],
    "correctIndex": 1,
    "explanation": "According to Ram, Lakshman's birthday is on 20th or 21st November.\nAccording to Anil, Lakshman's birthday is on 21st, 22nd or 23rd November.\nThe day common in both is 21st November. Therefore, Lakshman's birthday is on 21st November."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "In the series given below, count each 5 which is not immediately preceded by 3 but is immediately followed by 7. How many such 5s are there?\n\n1 5 7 3 5 7 4 7 3 7 2 5 6 5 8 5 7 4 5 6 5 5 7 1 5 7 7 5 5",
    "options": ["1", "2", "3", "4", "5"],
    "correctIndex": 3,
    "explanation": "There are four such 5s in the given series:\n1) 1 5 7 (preceded by 1)\n2) 8 5 7 (preceded by 8)\n3) 5 5 7 (preceded by 5)\n4) 1 5 7 (preceded by 1)\n(Note: 3 5 7 is preceded by 3, so it is excluded)."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Below is given a number series:\n\n1 8 5 7 2 9 8 4 3 6 2 7 5 1 8 9 4 3 6 5 9\n\nHow many instances are there in which an even number is followed by two odd numbers?",
    "options": ["Nil", "One", "Two", "Three", "None of these"],
    "correctIndex": 3,
    "explanation": "There are three such instances in which an even number is followed by two odd numbers:\n1) 8 5 7 (8 even, 5 and 7 odd)\n2) 2 7 5 (2 even, 7 and 5 odd)\n3) 6 5 9 (6 even, 5 and 9 odd)"
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "A number is greater than 3 but less than 8. Also, it is greater than 6 but less than 10. The number is _________",
    "options": ["5", "6", "7", "8", "9"],
    "correctIndex": 2,
    "explanation": "As per first condition: 8 > x > 3.\nAs per second condition: 10 > x > 6.\nTaking both conditions together: 8 > x > 6.\n∴ The number is 7."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "If 16 × 85 = 8651, what is 73 × 42?",
    "options": ["4372", "3723", "4327", "4732", "2734"],
    "correctIndex": 2,
    "explanation": "Given, 16 × 85 = 8651.\nSimilarly 73 × 42 = 4327.\nPattern: digits are arranged by placing tens place of second number (4), units place of first number (3), units place of second number (2), and tens place of first number (7)."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "In a row of 16 boys, when Pramod was shifted by two places towards the left, he became 7th from the left end. What was his earlier position from the right end of the row?",
    "options": ["7th", "8th", "9th", "10th", "None of these"],
    "correctIndex": 1,
    "explanation": "Pramod's new position from left = 7th.\nEarlier position from left = 7 + 2 = 9th.\n∴ His earlier position from right end of row = 16 - 9 + 1 = 8th."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "A bus for Trivandrum leaves every 30 minutes from a bus stand. On enquiring, the clerk told a passenger that the bus had already left ten minutes ago and the next bus will leave at 9.35 am. At what time did the clerk give this information to the passenger?",
    "options": ["9.10 am", "8.55 am", "9.08 am", "9.05 am", "9.15 am"],
    "correctIndex": 4,
    "explanation": "Bus leaves every 30 minutes. Next bus leaves at 9.35 am.\nPrevious bus left at 9.35 am - 30 minutes = 9.05 am.\nClerk gave info 10 minutes after previous bus left: 9.05 am + 10 minutes = 9.15 am."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "In a row of 21 girls, when Anita was shifted by four places towards the right, she became 12th from the left end. What was her earlier position from the right end of the row?",
    "options": ["9th", "10th", "11th", "12th", "14th"],
    "correctIndex": 4,
    "explanation": "Anita's earlier position from left = 12 - 4 = 8th from left end.\n∴ Position from right = 21 - 8 + 1 = 14th."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test26'] = examples
data['quantitativeReasoningTests']['part2_secA_test26'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test26 to quantitativeReasoning.json')
