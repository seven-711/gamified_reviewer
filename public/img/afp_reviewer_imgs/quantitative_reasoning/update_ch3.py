import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')
import re
import codecs

q = []

# Question 1
q.append({
  "id": 1,
  "type": "text",
  "prompt": "A bag contains 7 black and 5 white balls. A ball is drawn out and replaced in the bag. Then a ball is drawn again. What is the probability that (i) both the balls drawn were white? (ii) both balls were black? (iii) the first ball was black and the second white? (iv) the first ball was white and the second black?",
  "options": ["(A) (i) 49/144, (ii) 25/144, (iii) 35/144, (iv) 65/144", "(B) (i) 25/144, (ii) 49/144, (iii) 35/144, (iv) 35/144", "(C) (i) 36/144, (ii) 49/144, (iii) 65/144, (iv) 45/144", "(D) (i) 64/144, (ii) 64/144, (iii) 55/144, (iv) 35/144", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "(i) Both balls were white = 5/12 × 5/12 = 25/144\n(ii) Both balls were black = 7/12 × 7/12 = 49/144\n(iii) The first ball was black and the second white = 7/12 × 5/12 = 35/144\n(iv) The first ball was white and the second black = 5/12 × 7/12 = 35/144"
})

# Question 2
q.append({
  "id": 2,
  "type": "text",
  "prompt": "A box contains 5 red, 4 green and 3 black balls. 3 balls were drawn at random. What is the probability that they are not of the same colour?",
  "options": ["(A) 13/55", "(B) 41/44", "(C) 13/44", "(D) 52/55", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "Total number of balls = 5 + 4 + 3 = 12\nP(balls are not of the same colour) = ?\nn(S) = 12C3 = (12×11×10)/(1×2×3) = 220\ni.e. 3 balls can be drawn from the given 12 balls in 220 ways.\nIf all are of same colour, it can be done in 5C3 + 4C3 + 3C3 = 10 + 4 + 1 = 15 ways.\nP(all balls are of same colour) + P(all balls are not of same colour) = 1.\n∴ P(all balls are not of same colour) = 1 - P(all balls are not of same colour) = 1 - 15/220 = 205/220 = 41/44."
})

# Question 3
q.append({
  "id": 3,
  "type": "text",
  "prompt": "A positive integer is selected at random and is divided by 9. What is the probability that the remainder is (i) equal to 1? (ii) not 1?",
  "options": ["(A) (i) 4/9, (ii) 4/9", "(B) (i) 3/9, (ii) 2/9", "(C) (i) 2/9, (ii) 8/9", "(D) (i) 1/9, (ii) 8/9", "(E) None of these"],
  "correctIndex": 3,
  "explanation": "When a positive integer is divided by 9, the remainder may be any integer from 0 to 8.\n∴ n(S) = 9\n(i) E(1) = {1}; n(E) = 1; ∴ P(E) = 1/9\n(ii) E(not 1) = {0, 2, 3, 4, 5, 6, 7, 8}; i.e. n(E) = 8; ∴ P(E) = 8/9"
})

# Question 4
q.append({
  "id": 4,
  "type": "text",
  "prompt": "Two coins are tossed. What is the probability of appearing of (i) atmost one head? (ii) atmost two heads?",
  "options": ["(A) (i) 1/4, (ii) 1/4", "(B) (i) 2/4, (ii) 2/4", "(C) (i) 3/4, (ii) 1", "(D) (i) 3/4, (ii) 3/4", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "n(S) = 4 = {(H, H), (H, T), (T, H), (T, T)}\n(i) E(appearing at most one head) = {HT, TH, TT}\n∴ n(E) = 3; ∴ P(E) = 3/4\n(ii) E (appearing atmost two heads) = {HH, HT, TH, TT}\n∴ n(E) = 4; ∴ P(E) = 4/4 = 1"
})

# Question 5
q.append({
  "id": 5,
  "type": "text",
  "prompt": "What is the chance that a leap year selected randomly will have 53 Wednesdays? (ii) What is the chance, if the year selected is not a leap year?",
  "options": ["(A) (i) 1/7, (ii) 4/7", "(B) (i) 2/7, (ii) 1/7", "(C) (i) 3/7, (ii) 1/7", "(D) (i) 4/7, (ii) 2/7", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "(i) A leap year has 366 days and, therefore, it has 52 weeks and 2 more days. Two days can be {(Sunday, Monday), (Monday, Tuesday), (Tuesday, Wednesday), (Wednesday, Thursday), (Thursday, Friday), (Friday, Saturday), (Saturday, Sunday)}.\n∴ n(S) = 7.\nOut of the above 7 cases, cases favourable for more Wednesdays are {(Tuesday, Wednesday), (Wednesday, Thursday)}\ni.e. n(E) = 2; ∴ P(E) = 2/7\n(ii) When the year is not a leap year, it has 52 complete weeks and 1 more day. It can be {Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday}\n∴ n(S) = 7\n∴ From the above 7 cases, cases favourable for one more Wednesday is {Wednesday}. i.e. n(E) = 1. ∴ P(E) = 1/7"
})

# Question 6
q.append({
  "id": 6,
  "type": "text",
  "prompt": "When two dice are thrown simultaneously, what is the probability that: (i) the sum of numbers appeared is an odd number? (ii) the sum of numbers appeared is an even number? (iii) the sum of numbers appeared is a multiple of 3? (iv) the sum of numbers appeared ≤ 10? (v) the sum of numbers appeared is 6 and 7? (vi) numbers appeared are equal?",
  "options": ["(A) (i) 1/4, (ii) 1/4, (iii) 2/3, (iv) 5/12, (v) 5/6, (vi) 2/6", "(B) (i) 1/2, (ii) 1/2, (iii) 1/3, (iv) 11/12, (v) 5/36 and 1/6, (vi) 1/6", "(C) (i) 3/4, (ii) 1/2, (iii) 1, (iv) 6/12, (v) 4/6, (vi) 3/6", "(D) (i) 1, (ii) 1, (iii) 1/3, (iv) 7/12, (v) 1/6, (vi) 4/6"],
  "correctIndex": 1,
  "explanation": "n(s) = 6 × 6 = 36\n(i) Required probability = 18/36 = 1/2\n(ii) Required probability = 18/36 = 1/2\n(iii) Required probability = 12/36 = 1/3\n(iv) Required probability = 33/36 = 11/12\n(v) for 6, n(E) = 5. for 7, n(E) = 6. Required probability = 5/36 and 1/6\n(vi) Required probability = 6/36 = 1/6"
})

# Question 7
q.append({
  "id": 7,
  "type": "text",
  "prompt": "A box contains 6 white and 8 red balls. Two balls are drawn at random in succession. What is the probability that one of them is white and the other red?",
  "options": ["(A) 72/91", "(B) 24/91", "(C) 48/91", "(D) 36/91", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "The number of ways that two balls can be drawn from (6 + 8) or 14 balls is 14C2 = (14×13)/(1×2) = 91\nThe number of ways in which one white ball can be drawn from the six white balls is 6C1 = 6\nThe number of ways in which one red ball can be drawn from the eight red balls is 8C1 = 8\n∴ The number of ways in which one white and one red ball are drawn is (6C1 × 8C1)/14C2 = (6×8)/91 = 48/91"
})

# Question 8
q.append({
  "id": 8,
  "type": "text",
  "prompt": "A group of 4 students is to be formed from among 4 girls and 6 boys. What is the probability that the group has less number of boys than the number of girls.",
  "options": ["(A) 9/42", "(B) 11/42", "(C) 5/42", "(D) 13/42", "(E) None of these"],
  "correctIndex": 2,
  "explanation": "The selection of 1 boy and 3 girls can be done in 6C1 × 4C3 = 6 × 4 = 24 ways\nSelection of 4 girls and no boy can be done in 6C0 × 4C4 = 1 × 1 = 1 way.\n∴ n(E) = 24 + 1 = 25 ways.\nWithout any restriction the group can be formed in 10C4 = (10×9×8×7)/(1×2×3×4) = 210 ways\n∴ P(E) = n(E)/n(S) = 25/210 = 5/42"
})

# Question 9
q.append({
  "id": 9,
  "type": "text",
  "prompt": "You are given digits 2, 3, 4, 6 and 7. In how many ways you can form a 3-digit number without repetition of digits which is odd and greater than 300?",
  "options": ["(A) 27", "(B) 18", "(C) 12", "(D) 15", "(E) None of these"],
  "correctIndex": 1,
  "explanation": "The given digits are 2, 3, 4, 6 and 7.\nBox 1 can be filled in 4 ways, i.e. 3, 4, 6 and 7.\nWhen box 1 is having 3, box '3' can be filled in using 7 only and box '2' can be filled in 3 ways. So the number of such numbers formed = 1 × 3 × 1 = 3\nWhen box 1 is having 4, box '3' can be filled in 2 ways (i.e. 3 or 7), box '2' can be filled in 3 ways. So the number of such numbers formed = 1 × 3 × 2 = 6\nWhen box 1 is having 6, box '3' can be filled in 2 ways (i.e. 3 or 7), box '2' can be filled in 3 ways. So the number of such numbers formed = 1 × 3 × 2 = 6\nWhen box 1 is having 7, box '3' can be filled in 1 way (i.e. 3 only), box '2' can be filled in 3 ways. The number of such numbers formed = 1 × 3 × 1 = 3\n∴ The total number of such numbers = 3 + 6 + 6 + 3 = 18"
})

# Question 10
q.append({
  "id": 10,
  "type": "text",
  "prompt": "From a pack of 52 cards, 4 cards are drawn. What is the probability that it has (i) no queen? (ii) one ace, one king, one queen and one jack? (iii) two digit-cards and one honours card of black and red suit?",
  "options": ["(A) (i) 53/54145, (ii) 64/54145, (iii) 1125/7735", "(B) (i) 52/54145, (ii) 128/54145, (iii) 1512/7735", "(C) (i) 104/54145, (ii) 256/54145, (iii) 1152/7735", "(D) (i) 208/54145, (ii) 512/54145, (iii) 2511/7735", "(E) None of these"],
  "correctIndex": 4,
  "explanation": "For all cases, n(S) = 52C4 = (52×51×50×49)/(1×2×3×4) = 13 × 17 × 25 × 49\n(i) n(E) = 48C4 = (48×47×46×45)/(1×2×3×4) = 2 × 47 × 46 × 45\nP(E) = (2×47×46×45) / (13×17×25×49) = 39916/54145\n(ii) n(E) = 4C1 × 4C1 × 4C1 × 4C1 = 4 × 4 × 4 × 4 = 256\nP(E) = (4×4×4×4) / (13×17×25×49) = 256/270725\n(iii) n(E) = 36C2 × 8C1 × 8C1 = (36×35)/(1×2) × 8 × 8 = 18 × 35 × 8 × 8\n∴ P(E) = (18×35×8×8) / (13×17×25×49) = (18×8×8) / (13×17×35) = 1152/7735"
})

# Question 11
q.append({
  "id": 11,
  "type": "text",
  "prompt": "In a box, there are 8 red, 7 blue and 6 green balls. One ball is picked up at random. What is the probability that it is neither red nor green?",
  "options": ["(A) 1/3", "(B) 3/4", "(C) 7/19", "(D) 8/21", "(E) 9/21"],
  "correctIndex": 0,
  "explanation": "Total number of favourable events n(S) = 8 + 7 + 6 = 21\nTotal number of possible events = 7\nE = event of getting neither red nor green = event of getting blue.\n∴ P(E) = 7/21 = 1/3"
})

# Question 12
q.append({
  "id": 12,
  "type": "text",
  "prompt": "A bag contains 2 red, 3 green and 2 blue balls. Two balls are drawn at random. What is the probability that none of the balls drawn is blue?",
  "options": ["(A) 10/21", "(B) 11/21", "(C) 2/7", "(D) 5/7"],
  "correctIndex": 0,
  "explanation": "Total number of possible events = 2 + 3 + 2 = 7\nThe number of ways in which 2 balls can be drawn out of given 7 = 7C2 = (7×6)/(1×2) = 21\ni.e. n(S) = 21\nE = event of getting balls not to be blue\nn(E) = ways of drawing 2 balls from given 5 = 5C2 = (5×4)/(1×2) = 10\n∴ P(E) = n(E)/n(S) = 10/21"
})

# Question 13
q.append({
  "id": 13,
  "type": "text",
  "prompt": "A box contains 5 green, 4 yellow and 3 white marbles. Three marbles are drawn at random. What is the probability that they are not of the same colour?",
  "options": ["(A) 3/44", "(B) 3/55", "(C) 52/55", "(D) 41/44"],
  "correctIndex": 3,
  "explanation": "The number of ways in which 3 green marble can be drawn from the given 5 = 5C3 = 5C2 = (5×4)/(1×2) = 10\nSimilarly, from 4 yellow marbles, marble can be drawn in 4C3 = 4C1 = 4 ways\nSimilarly, from 3 white marbles, 3 white marble can be drawn in 3C3 = 1 way\nThe number of ways in which 3 marbles can be drawn from 5 + 4 + 3 = 12 marbles given = 12C3 = (12×11×10)/(1×2×3) = 220\n∴ Required probability = 1 - Probability (of getting all the three with same colour)\n= 1 - (5C3 + 4C3 + 3C3)/220 = 1 - (10+4+1)/220 = 1 - 3/44 = 41/44"
})

# Question 14
q.append({
  "id": 14,
  "type": "text",
  "prompt": "What is the probability of getting a sum 9 from two throws of a dice?",
  "options": ["(A) 1/6", "(B) 1/8", "(C) 1/9", "(D) 1/12"],
  "correctIndex": 2,
  "explanation": "The number of possible events when a dice is thrown twice = 6 × 6 = 36;\nNumber of possible events to get a sum 9 when a dice is thrown twice = {(3, 6), (4, 5), (5, 4), (6, 3)}\nE = Event of getting sum 9\n∴ P(E) = 4/36 = 1/9"
})

# Question 15
q.append({
  "id": 15,
  "type": "text",
  "prompt": "From a pack of 52 cards, two cards are drawn together at random. What is the probability of both cards being kings?",
  "options": ["(A) 1/15", "(B) 25/57", "(C) 35/256", "(D) 1/221"],
  "correctIndex": 3,
  "explanation": "The number of possible events when two cards are drawn together from a pack of 52 cards = 52C2 = (52×51)/(1×2) = 26 × 51 = 1326\nThe number of possible events when two cards are drawn together to get both cards of king suit = 4C2 = (4×3)/(1×2) = 6\nE = Event of getting both cards of king suit.\n∴ P(E) = 6/1326 = 1/221"
})

# Question 16
q.append({
  "id": 16,
  "type": "text",
  "prompt": "Two cards are drawn together from a pack of 52 cards. The probability that one is a spade and one is a heart, is",
  "options": ["(A) 3/20", "(B) 29/34", "(C) 47/100", "(D) 13/102"],
  "correctIndex": 3,
  "explanation": "The number of possible events when two cards are drawn together from a pack of 52 cards = 52C2 = (52×51)/(1×2) = 26 × 51 = 1326\nNumber of possible events to draw a spade = 13C1 = 13 ways.\nNumber of possible events to draw a heart = 13C1 = 13 ways.\nE = Event of getting 1 spade and 1 heart\nn(E) = 13 × 13 = 169\n∴ P(E) = n(E)/n(S) = 169/1326 = 13/102"
})

# Question 17
q.append({
  "id": 17,
  "type": "text",
  "prompt": "A bag contains 4 white, 5 red and 6 blue balls. Three balls are drawn at random. What is the probability that all of them are red?",
  "options": ["(A) 1/22", "(B) 3/22", "(C) 2/91", "(D) 2/77"],
  "correctIndex": 2,
  "explanation": "Number of possible events to draw three balls from 4 white, 5 red and 6 blue balls = 15C3 = (15×14×13)/(1×2×3) = 5 × 7 × 13 = 455\nE = Event of getting 3 balls red\nThe number of favourable event to get 3 red balls = 5C3 = (5×4)/(1×2) = 10\n∴ P(E) = n(E)/n(S) = 10/455 = 2/91"
})

# Question 18
q.append({
  "id": 18,
  "type": "text",
  "prompt": "In a class, 30% of students passed English, 20% passed French and 10% passed both. If a student is selected at random, what is the probability that he has passed English or French?",
  "options": ["(A) 2/5", "(B) 3/4", "(C) 3/5", "(D) 3/10"],
  "correctIndex": 0,
  "explanation": "Probability that student passed in English P(E) = 30/100 = 3/10;\nProbability that student passed in French P(F) = 20/100 = 2/10 = 1/5;\nProbability that student passed both English and French P(E ∩ F) = 10/100 = 1/10;\n∴ P(E or F) = P(E) + P(F) - P(E ∩ F) = 3/10 + 1/5 - 1/10 = (3+2-1)/10 = 4/10 = 2/5"
})

# Question 19
q.append({
  "id": 19,
  "type": "text",
  "prompt": "Four persons are selected at random from a group of 3 men, 2 women and 4 children. The chance that exactly two of them are children is",
  "options": ["(A) 1/9", "(B) 1/5", "(C) 1/12", "(D) 10/21"],
  "correctIndex": 3,
  "explanation": "The number of possible ways to select 4 persons from 3 men, 2 women and 4 children = 9C4 = (9×8×7×6)/(1×2×3×4) = 9 × 7 × 2 = 126\nThe number of ways in which 2 children can be drawn from given 4 children = 4C2 = (4×3)/(1×2) = 6\nNumber of ways in which 2 person can be drawn from 3 men and 2 women = 5C2 = (5×4)/(1×2) = 10\nE = Event of selecting 4 persons with exactly two children\nP(E) = (4C2 × 5C2) / 9C4 = (6×10)/126 = 60/126 = 10/21"
})

# Question 20
q.append({
  "id": 20,
  "type": "text",
  "prompt": "A box contains 4 red balls, 5 green balls and 6 white balls. A ball is drawn at random from the box. What is the probability that the ball drawn is either red or green?",
  "options": ["(A) 2/5", "(B) 3/5", "(C) 1/5", "(D) 7/15"],
  "correctIndex": 1,
  "explanation": "The number of possible events to draw a ball from 4 red, 5 green and 6 white balls = 15C1 = 15\nThe number of ways in which a red ball is drawn from given 4 red balls = 4C1 = 4\nThe number of ways in which a green ball is drawn from 5 green balls = 5C1 = 5\n∴ Total number of favourable events = 4 + 5 = 9\nE = Event of getting either a red or a green ball\nP(E) = n(E)/n(S) = (4+5)/15 = 9/15 = 3/5"
})

# Question 21
q.append({
  "id": 21,
  "type": "text",
  "prompt": "A box contains 6 black and 4 red balls. Three balls are drawn at random. What is the probability that one ball is red and the other two are black?",
  "options": ["(A) 1/2", "(B) 1/12", "(C) 3/10", "(D) 7/12"],
  "correctIndex": 0,
  "explanation": "Number of possible ways to draw three balls from 6 black and 4 red balls = 10C3 = (10×9×8)/(1×2×3) = 10 × 3 × 4 = 120\nNumber of favourable ways to get one red ball from given 4 red balls = 4C1 = 4\nNumber of favourable ways to get two black balls from given 6 black balls = 6C2 = (6×5)/(1×2) = 15\nE = event of getting one red and two black balls\nP(E) = n(E)/n(S) = (4C1 × 6C2) / 10C3 = (4×15)/120 = 1/2"
})

# Question 22
q.append({
  "id": 22,
  "type": "text",
  "prompt": "Two dice are thrown simultaneously. What is the probability of getting two numbers whose product is even?",
  "options": ["(A) 1/2", "(B) 3/4", "(C) 3/8", "(D) 5/16"],
  "correctIndex": 1,
  "explanation": "Number of possible events = 36\nE = Event of getting product of 2 results even\nNumber of favourable events = {(1, 6), (1, 4), (1, 2), (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),\n(3, 2), (3, 4), (3, 6), (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6),\n(5, 2), (5, 4), (5, 6), (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6)} = 27\n∴ P(E) = n(E)/n(S) = 27/36 = 3/4"
})


import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

with codecs.open(json_path, 'r', 'utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningTests']['quantitative_reasoning_test3'] = q

with codecs.open(json_path, 'w', 'utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Updated quantitative_reasoning_test3')
