import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

q = []

# Question 1
q.append({
  "id": 1,
  "type": "text",
  "prompt": "How many words can be formed out of the letters of the word 'EDUCATION' such that vowels occupy the odd positions?",
  "options": ["(A) 1440", "(B) 2880", "(C) 2840", "(D) 2480", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Out of the nine letters, five are vowels and other four are consonants. Therefore, 5 vowels can be arranged in 5 odd positions in 5P5 = 5! ways. Similarly, 4 consonants can be arranged in 4 alternate positions (even positions) in 4! ways.\nTotal number of words = 5! × 4! = 2880."
})

# Question 2
q.append({
  "id": 2,
  "type": "text",
  "prompt": "A candidate is required to answer 6 out of 10 questions which are divided into two groups each containing 5 questions and he is not permitted to attempt more than 4 from each group. In how many ways can he make his choice?",
  "options": ["(A) 160", "(B) 180", "(C) 192", "(D) 200", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "There are 10 questions in total from two groups A and B each consisting of 5 questions. A candidate can attempt a maximum of 4 questions from one group and 6 questions altogether.\nGroup A: 4, 3, 2\nGroup B: 2, 3, 4\nNumber of possible combinations = 5C4 × 5C2 + 5C3 × 5C3 + 5C2 × 5C4\n= 5 × 10 + 10 × 10 + 10 × 5\n= 50 + 100 + 50 = 200"
})

# Question 3
q.append({
  "id": 3,
  "type": "text",
  "prompt": "How many numbers of five digits can be formed with the digits 0, 1, 2, 3, 5 and 6?",
  "options": ["(A) 480", "(B) 540", "(C) 600", "(D) 660", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Required number of numbers = 5P1 × 5P4 = 5 × 5! = 5 × 120 = 600"
})

# Question 4
q.append({
  "id": 4,
  "type": "text",
  "prompt": "How many odd numbers of four digits can be formed with the digits 0, 1, 2, 3, 4, 7 and 8?",
  "options": ["(A) 150", "(B) 180", "(C) 120", "(D) 210", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "The unit place of the number can be filled in 3P1 = 3 ways.\nThe thousandth place of the number can be filled in 5P1 = 5 ways. (Because 0 is excluded from selection to the thousandth position.)\nThe remaining two places can be filled in 5P2 = (5×4)/(1×2) = 10 ways.\nTherefore The total number of 4 digit odd numbers 3 × 5 × 10 = 150."
})

# Question 5
q.append({
  "id": 5,
  "type": "text",
  "prompt": "How many numbers of 4 digits, divisible by 5, can be formed with the digits 0, 3, 5, 7 and 9?",
  "options": ["(A) 120", "(B) 90", "(C) 60", "(D) 30", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "For a 4-digit number to be divisible by 5, it should end with either '5' or '0'. Therefore, the unit place of the number can be filled in 2P1 = 2 ways.\nCase (a): The remaining 3 positions can be filled in 4P3 ways = 4! ways (if 0 is filled in the units place)\n∴ Required number of numbers = 2 × 4! = 48.\nCase (b): The remaining 3 positions can be filled in 3P3 ways = 3! ways (if 0 is not filled in the units place)\n∴ Required number of numbers = 2 × 3! = 12.\n∴ Total number of such numbers = 48 + 12 = 60."
})

# Question 6
q.append({
  "id": 6,
  "type": "text",
  "prompt": "From 8 men and 6 women, a group of seven persons is to be formed. In how many ways the group can be formed such that the group should include at least two ladies?",
  "options": ["(A) 3256", "(B) 1628", "(C) 6512", "(D) 4884", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "A group of seven persons is to be formed from 8 men and 6 women. It is given that there should be at least two women in the group.\nThe possible combinations are (2W, 5M), (3W, 4M), (4W, 3M), (5W, 2M) and (6W, 1M)\nThe number of combinations\n= 6C2 × 8C5 + 6C3 × 8C4 + 6C4 × 8C3 + 6C5 × 8C2 + 6C6 × 8C1\n= 15 × 56 + 20 × 70 + 15 × 56 + 6 × 28 + 1 × 8 = 840 + 1400 + 840 + 168 + 8 = 3256\n∴ Required number of groups = 3256"
})

# Question 7
q.append({
  "id": 7,
  "type": "text",
  "prompt": "How many words of 4 letters beginning with 'A' or 'E' can be formed with the letters of the word 'EQUATOR'?",
  "options": ["(A) 280", "(B) 160", "(C) 240", "(D) 180", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Since the 4-letter word has to begin with 'A' or 'E', the first letter can be arranged in 2P1 = 2 ways.\nThe remaining 3 letters can be arranged from the six letters of the word 'EQUATOR' in 6P3 = 6 × 5 × 4 = 120 ways.\n∴ Required number of words = 2 × 120 = 240."
})

# Question 8
q.append({
  "id": 8,
  "type": "text",
  "prompt": "In how many ways can the letters of the word 'EXCELLENT' be arranged?",
  "options": ["(A) 30024", "(B) 34200", "(C) 30420", "(D) 30240", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "The given word contains six different letters with the letter 'E' repeating thrice and 'L' repeating twice.\n∴ Required number of arrangements = 9! / (3! × 2!) = 30240."
})

# Question 9
q.append({
  "id": 9,
  "type": "text",
  "prompt": "How many groups can be selected for playing football out of 5 ladies and 4 gentlemen such that there should be one lady and one gentleman on each side?",
  "options": ["(A) 420", "(B) 240", "(C) 360", "(D) 120", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "The groups that are possible from 5 ladies and 4 gentlemen are\n1 lady, 1 gentleman groups from 4 ladies and 3 gentlemen\nSide A: One lady and one gentleman can be selected in 5C1 × 4C1 ways = 5 × 4 = 20 ways.\nSide B: For selection of one lady and one gentleman in side (B), there are only 4 ladies and 3 gentlemen.\n∴ Required number of selection = 4C1 × 3C1 = 4 × 3 = 12\n∴ Total number of ways of selection for forming the team = 20 × 12 = 240"
})

# Question 10
q.append({
  "id": 10,
  "type": "text",
  "prompt": "In how many ways can 15 different books be divided equally among (i) 3 sets or groups (ii) 5 sets or groups?",
  "options": ["(A) (i) 261126, (ii) 4104100", "(B) (i) 121626, (ii) 1401400", "(C) (i) 122661, (ii) 1041040", "(D) (i) 126126, (ii) 1401400", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "(i) Required number of ways = (15C5 × 10C5 × 5C5) / 3! = 126126\n(ii) Required number of ways = (15C3 × 12C3 × 9C3 × 6C3 × 3C3) / 5! = 1401400"
})

# Question 11
q.append({
  "id": 11,
  "type": "text",
  "prompt": "There are six members in a group which are to be sent abroad. The total number of members is 12. In how many ways can the selection be made such that a particular member is always (i) included (ii) excluded?",
  "options": ["(A) (i) 426, (ii) 264", "(B) (i) 462, (ii) 462", "(C) (i) 246, (ii) 462", "(D) (i) 462, (ii) 426", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "(i) Here six members are to be selected from 12 members and a particular member is to be included.\nThe selection of one particular member can be done in 1C1 or 1 way.\nThe selection of remaining 5 members from the 11 members can be done in 11C5 ways.\n∴ The required number of ways of selection = 1C1 × 11C5 = 462\n(ii) When a particular member is to be excluded the required number of ways of selection = 11C6 = 462."
})

# Question 12
q.append({
  "id": 12,
  "type": "text",
  "prompt": "Find the number of triangles formed by 12 points (out of which 4 are collinear) in a plane:",
  "options": ["(A) 216", "(B) 126", "(C) 612", "(D) 621", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "The number of triangles which can be formed from 12 points when all of them are not collinear = 12C3\n∵ 4 points are collinear, the number of triangles that have to be formed = 4C3.\n∴ The number of triangles formed = 12C3 - 4C3 = (12×11×10)/(1×2×3) - 4 = 220 - 4 = 216"
})

# Question 13
q.append({
  "id": 13,
  "type": "text",
  "prompt": "A box contains 2 white balls, 3 black balls and 4 red balls. In how many ways can 3 balls be drawn from the box, if at least one black ball is to be included in the draw?",
  "options": ["(A) 32", "(B) 48", "(C) 64", "(D) 96", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Required selection can be (1 black and 2 non-black) or (2 black and 1 non-black) or 3 black.\n∴ The required number of ways in which balls can be drawn = (3C1 × 6C2) + 3C2 × 6C1 + 3C3\n= 3 × (6×5)/(1×2) + 3×6 + 1 = 45 + 18 + 1 = 64"
})

# Question 14
q.append({
  "id": 14,
  "type": "text",
  "prompt": "In how many ways, can a group of 5 men and 2 women be made out of a total of 7 men and 3 women?",
  "options": ["(A) 63", "(B) 90", "(C) 126", "(D) 45", "(E) 135"],
  "correctIndex": 0,
  "explanation": "5 men can be selected from 7 men in 7C5 ways.\n2 women can be selected from 3 women in 3C2 ways.\n∴ Total number of ways in which group can be formed = 7C5 × 3C2\n= 7C2 × 3C1 = (7×6)/(1×2) × 3 = 63 ways"
})

# Question 15
q.append({
  "id": 15,
  "type": "text",
  "prompt": "From a group of 7 men and 6 women, five persons are to be selected to form a committee so that at least 3 men are there on the committee. In how many ways can it be done?",
  "options": ["(A) 564", "(B) 645", "(C) 735", "(D) 756", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "Required grouping can be (3 men, 2 women) or (4 men, 1 woman) or 5 men.\n∴ The number of ways in which above grouping can be made\n= (7C3 × 6C2) + (7C4 × 6C1) + (7C5 × 6C0)\n= 35 × 15 + 35 × 6 + 21 = 525 + 210 + 21 = 756"
})

# Question 16
q.append({
  "id": 16,
  "type": "text",
  "prompt": "How many three digit numbers can be formed from the digits 2, 3, 5, 6, 7 and 9, which are divisible by 5 and none of the digits is repeated?",
  "options": ["(A) 5", "(B) 10", "(C) 15", "(D) 20"],
  "correctIndex": 3,
  "explanation": "Here 6 digits are given and you have to select 3 at a time.\nSince the number is divisible by 5,\nBox 3 can be filled with '5' in only one way.\nBox 2 can be filled in 5C1 = 5 ways\nBox 1 can be filled in 4C1 = 4 ways\n∴ Total number of 3 digit numbers divisible by 5 = 1 × 5 × 4 = 20"
})

# Question 17
q.append({
  "id": 17,
  "type": "text",
  "prompt": "How many words can be formed by using all the letters of the word 'TRIVANDRUM' using each letter exactly once?",
  "options": ["(A) 10!", "(B) 8!", "(C) 9!", "(D) 6!"],
  "correctIndex": 2,
  "explanation": "'TRIVANDRUM' consists of 10 characters in which R repeats twice.\nTherefore, 9 different letters are available. By taking all characters at a time without repetition, the number of words that can be formed = 9!"
})

# Question 18
q.append({
  "id": 18,
  "type": "text",
  "prompt": "In how many ways can the letters of the word 'LEADER' be arranged?",
  "options": ["(A) 72", "(B) 144", "(C) 360", "(D) 720", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "'LEADER' consists of 6 letters namely L, E, A, D and R in which E repeats twice.\n∴ Required number of ways = 6! / 2! = 5! × 3 = 360"
})

# Question 19
q.append({
  "id": 19,
  "type": "text",
  "prompt": "In how many ways a committee, consisting of 5 men and 6 women, can be formed from 8 men and 10 women?",
  "options": ["(A) 266", "(B) 5040", "(C) 11760", "(D) 86400", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "5 men can be selected from 8 men in 8C5 way. 6 women can be selected from 10 women in 10C6 ways.\n∴ Total number of groups that can be formed = 8C5 × 10C6 = 8C3 × 10C4\n= (8×7×6)/(1×2×3) × (10×9×8×7)/(1×2×3×4) = 56 × 210 = 11760"
})

# Question 20
q.append({
  "id": 20,
  "type": "text",
  "prompt": "In how many different ways can the letters of the word 'AUCTION' be arranged in such a way that the vowels always come together?",
  "options": ["(A) 30", "(B) 48", "(C) 144", "(D) 576", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "In the word 'AUCTION', there are 7 characters in which 4 are vowels. i.e., 4 vowels and 3 consonants.\nTaking 4 vowels together, there are four characters and that can be arranged in 4! ways.\nAmong 4 vowels, it can be arranged among them in 4! ways.\n∴ Total number of ways = 4! × 4! = 24 × 24 = 576 ways."
})

# Question 21
q.append({
  "id": 21,
  "type": "text",
  "prompt": "Out of 7 consonants and 4 vowels, how many words of 3 consonants and 2 vowels can be formed?",
  "options": ["(A) 210", "(B) 1050", "(C) 25200", "(D) 21400", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "3 consonants can be selected from the given 7 consonants in 7C3 ways.\n2 vowels can be selected from the given 4 vowels in 4C2 ways.\n∴ Total number of ways = 7C3 × 7C2 = (7×6×5)/(1×2×3) × (4×3)/(1×2) = 35 × 6 = 210"
})

# Question 22
q.append({
  "id": 22,
  "type": "text",
  "prompt": "In a group of 6 boys and 4 girls, four children are to be selected. In how many different ways can they be selected such that at least one boy should be there?",
  "options": ["(A) 159", "(B) 194", "(C) 205", "(D) 209", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "The required selection can be (1 boy, 3 girls) or (2 boys, 2 girls) or (3 boys, 1 girl) or 4 boys.\n∴ Number of ways = (6C1 × 4C3) + (6C2 × 4C2) + (6C3 × 4C1) + (6C4 × 4C0)\n= (6 × 4) + (15 × 6) + (20 × 4) + (15 × 1)\n= 24 + 90 + 80 + 15 = 209"
})

# Question 23
q.append({
  "id": 23,
  "type": "text",
  "prompt": "In how many different ways can the letters of the word 'BANKING' be arranged so that the vowels always come together?",
  "options": ["(A) 120", "(B) 240", "(C) 360", "(D) 540", "(E) 720"],
  "correctIndex": 4,
  "explanation": "In the word 'BANKING', there are 7 characters in total in which 'N' repeats twice and there are two vowels.\nLetters can be grouped such that 6 characters can be arranged in 6! ways and as 'N' repeats twice.\nNumber of grouping = 6! / 2! ways\n∵ Two vowels, come together, it can be arranged among themselves in 2! = 2 ways.\n∴ Total number of ways = 6!/2! × 2! = 6! ways = 720 ways"
})

# Question 24
q.append({
  "id": 24,
  "type": "text",
  "prompt": "In how many different ways can the letters of the word 'JUDGE' be arranged in such a way that the vowels always come together?",
  "options": ["(A) 48", "(B) 120", "(C) 124", "(D) 160", "(E) None of these"],
  "correctIndex": 0,
  "explanation": "Required number of arrangements of 3 consonants + (2 vowels group) = 4! × 2 = 48 ways"
})

# Question 25
q.append({
  "id": 25,
  "type": "text",
  "prompt": "In how many different ways can the letters of the word 'OPTICAL' be arranged so that the vowels always come together?",
  "options": ["(A) 120", "(B) 720", "(C) 4320", "(D) 2160", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Required number of arrangements = 5! × 3! = 120 × 6 = 720 ways"
})

# Question 26
q.append({
  "id": 26,
  "type": "text",
  "prompt": "In how many ways, a committee of 3 members can be selected from 5 men and 4 women, consisting of 2 men and 1 woman?",
  "options": ["(A) 60", "(B) 72", "(C) 40", "(D) 32"],
  "correctIndex": 2,
  "explanation": "2 men can be selected from 5 men in 5C2 ways\n1 woman can be selected from 4 women in 4C1 ways\n∴ Total number of ways = 5C2 × 4C1 = (5×4)/(1×2) × 4 = 10 × 4 = 40 ways"
})

# Question 27
q.append({
  "id": 27,
  "type": "text",
  "prompt": "In how many ways a team of 11 members can be formed from a group of 15 persons?",
  "options": ["(A) 3270", "(B) 2730", "(C) 1365", "(D) 1635", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Required number of ways = 15C11 = 15C4 = (15 × 14 × 13 × 12) / (1 × 2 × 3 × 4) = 15 × 7 × 13 = 1365"
})

# Question 28
q.append({
  "id": 28,
  "type": "text",
  "prompt": "How many 3-letter words can be formed from the letters of the word 'EXPERTISE', if repetition of letters is not allowed?",
  "options": ["(A) 420", "(B) 240", "(C) 210", "(D) 120", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "Here, word 'EXPERTISE' contains 9 characters in which 'E' repeats thrice.\n∴ Box 1 can be filled in 7C1 = 7 ways\nBox 2 can be filled in 6C1 = 6 ways\nBox 3 can be filled in 5C1 = 5 ways\n∴ Required number of 3-letter words so formed = 7 × 6 × 5 = 210"
})

# Question 29
q.append({
  "id": 29,
  "type": "text",
  "prompt": "In how many ways can 21 books on Sanskrit and 19 books on French be placed in a row on a shelf such that two books on French may not be together?",
  "options": ["(A) 3990", "(B) 1540", "(C) 1995", "(D) 3672", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Here Sanskrit and French books are to be placed in alternate positions.\n∴ For 21 books in Sanskrit, alternately placed, there will be 22 places for French books.\nTaking 19 places out of 22, number of arrangements = 22C19 = 22C3 = (22×21×20)/(1×2×3) = 1540 ways"
})

# Question 30
q.append({
  "id": 30,
  "type": "text",
  "prompt": "In how many different ways can the letters of the word 'DETAIL' be arranged in such a way that the vowels occupy only the odd positions?",
  "options": ["(A) 32", "(B) 48", "(C) 36", "(D) 60", "(E) 120"],
  "correctIndex": 2,
  "explanation": "Here 6 characters are there, in which 3 are vowels.\n∴ Vowels can be placed in positions marked 1, 3 and 5.\n∴ No. of arrangements = 3P3 = 3! = 6\n3 consonants can be arranged at positions marked 2, 4 and 6.\n∴ Number of arrangements = 3P3 = 3! = 6\n∴ Total number of ways = 6 × 6 = 36"
})

import codecs
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

with codecs.open(json_path, 'r', 'utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningTests']['quantitative_reasoning_test2'] = q

with codecs.open(json_path, 'w', 'utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Updated quantitative_reasoning_test2')
