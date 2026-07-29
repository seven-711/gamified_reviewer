import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

dir_1_10 = "Directions: Find the missing number in each of the following:"
dir_11_15 = "Directions: In each of the following questions, numbers have been arranged according to the pattern shown in the sample figure given below. Find the most correct alternative to fill in the space provided by question mark."

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Directions: Find the missing number from among the given alternatives.\n\nTriangle (A): top-left 841, top-right 784, bottom 729 -> center 84\nTriangle (B): top-left 225, top-right 196, bottom 169 -> center ?",
    "options": ["32", "42", "62", "82"],
    "correctIndex": 1,
    "explanation": "In figure (A): √729 = 27, √784 = 28, √841 = 29, and 27 + 28 + 29 = 84.\nSimilarly in figure (B): √169 = 13, √196 = 14, √225 = 15, and 13 + 14 + 15 = 42.\nSo, the answer is 42 (b)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Directions: Find the missing number from among the given alternatives.\n\nCross (i): top 3, left 6, right 2, bottom 4 -> center 25\nCross (ii): top 7, left 11, right 8, bottom 6 -> center 70\nCross (iii): top 1, left 4, right 5, bottom ? -> center -12",
    "options": ["10", "6", "2", "1"],
    "correctIndex": 2,
    "explanation": "In figure (i): (3² + 6²) - (2² + 4²) = (9 + 36) - (4 + 16) = 45 - 20 = 25.\nIn figure (ii): (7² + 11²) - (6² + 8²) = (49 + 121) - (36 + 64) = 170 - 100 = 70.\nIn figure (iii): (1² + 4²) - (5² + x²) = -12 ⇒ 17 - 25 - x² = -12 ⇒ x² = 4 ⇒ x = 2.\nSo, the answer is 2 (c)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Directions: Find the missing number from among the given alternatives.\n\nCircular ring outer numbers: 7, 5, 3, 4, 5, 1, 8, 2\nInner ring squares: (7+5)² = 144, (3+4)² = 49, (5+1)² = 36, (2+8)² = ?",
    "options": ["100", "81", "64", "121"],
    "correctIndex": 0,
    "explanation": "In each sector: (7 + 5)² = 144, (3 + 4)² = 49, (5 + 1)² = 36.\nSimilarly: (2 + 8)² = 100.\nSo, the missing number is 100 (a)."
  }
]

questions_data = [
  {
    "id": 1,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/1.webp",
    "options": ["125", "8", "0", "216"],
    "correctIndex": 3,
    "explanation": "In each sector, the central number is the cube of the difference between the two outer numbers:\nTop-left: (5 - 4)³ = 1³ = 1\nTop-right: (7 - 3)³ = 4³ = 64\nBottom-left: (11 - 8)³ = 3³ = 27\nBottom-right: (8 - 2)³ = 6³ = 216."
  },
  {
    "id": 2,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/2.webp",
    "options": ["19", "17", "15", "13"],
    "correctIndex": 2,
    "explanation": "In each circle, the bottom number is equal to the sum of the top two numbers divided by 7:\nCircle A: (25 + 17) ÷ 7 = 42 ÷ 7 = 6\nCircle B: (38 + 18) ÷ 7 = 56 ÷ 7 = 8\nCircle C: (89 + 16) ÷ 7 = 105 ÷ 7 = 15."
  },
  {
    "id": 3,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/3.webp",
    "options": ["1", "8", "12", "27"],
    "correctIndex": 3,
    "explanation": "In Circle A: 15 + 17 + 8 = 40 (sum of three outer numbers).\nIn Circle B: 6 + 2 + 12 + 8 = 28.\nIn Circle C: (23 + 28 + 13 + 4) - 41 = 27."
  },
  {
    "id": 4,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/4.webp",
    "options": ["27", "19", "89", "5"],
    "correctIndex": 2,
    "explanation": "In each cross figure, the center number is obtained by: (Left × Bottom) + (Top × Right):\nFigure A: (6 × 3) + (5 × 15) = 18 + 75 = 93\nFigure C: (4 × 8) + (18 × 1) = 32 + 18 = 50\nFigure B: (9 × 6) + (7 × 5) = 54 + 35 = 89."
  },
  {
    "id": 5,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/5.webp",
    "options": ["10C", "12C", "14C", "16C"],
    "correctIndex": 3,
    "explanation": "For letters: Each letter A, B, C appears three times in the matrix. A and B already appear three times, so the missing letter is C.\nFor numbers in Row 3: The third number is the average of the first two numbers: (15 + 17) ÷ 2 = 16.\nTherefore, the missing term is 16C."
  },
  {
    "id": 6,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/6.webp",
    "options": ["A = 13, B = 11, C = 9", "A = 13, B = 9, C = 11", "A = 9, B = 11, C = 13", "A = 9, B = 13, C = 11"],
    "correctIndex": 3,
    "explanation": "This is a 3×3 magic square where the sum of each row, column, and diagonal equals 30:\nRow 1: 9 + A + 12 = 30 ⇒ A = 9\nCol 1: 9 + B + 8 = 30 ⇒ B = 13\nRow 3: 8 + C + 11 = 30 ⇒ C = 11\nTherefore, A = 9, B = 13, C = 11."
  },
  {
    "id": 7,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/7.webp",
    "options": ["198", "158", "142", "127"],
    "correctIndex": 2,
    "explanation": "In each figure, the central number is obtained by subtracting the sum of the top-right and bottom-left numbers from the sum of the top-left and bottom-right numbers:\nFigure A: (101 + 15) - (43 + 35) = 116 - 78 = 38\nFigure B: (48 + 184) - (34 + 56) = 232 - 90 = 142."
  },
  {
    "id": 8,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/8.webp",
    "options": ["33", "145", "135", "18"],
    "correctIndex": 2,
    "explanation": "Each inner section value is the product of its adjacent outer sector number and the next clockwise outer number:\nTop: 7 × 9 = 63\nRight: 9 × 15 = 135\nBottom: 15 × 2 = 30\nLeft: 2 × 7 = 14."
  },
  {
    "id": 9,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/9.webp",
    "options": ["64", "512", "16", "24"],
    "correctIndex": 1,
    "explanation": "Each inner triangle contains the cube of the number in its corresponding outer triangle point:\n3³ = 27, 4³ = 64, 5³ = 125, 6³ = 216, 7³ = 343\nFor 8: 8³ = 512."
  },
  {
    "id": 10,
    "prompt": dir_1_10,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/10.webp",
    "options": ["0", "3", "5", "7"],
    "correctIndex": 2,
    "explanation": "In each column, the bottom number is equal to x² - x (or x × (x - 1)) where x is the top number:\nCol 1: 3² - 3 = 6\nCol 2: 8² - 8 = 56\nCol 3: 10² - 10 = 90\nCol 4: 2² - 2 = 2\nCol 6: 1² - 1 = 0\nCol 5: x² - x = 20 ⇒ x = 5 (since 5² - 5 = 20)."
  },
  {
    "id": 11,
    "prompt": dir_11_15,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/11.webp",
    "options": ["10", "11", "12", "13"],
    "correctIndex": 2,
    "explanation": "In each section, the outer number is obtained by applying the pattern to adjacent inner numbers:\nRight lobe: 2² + 1 = 5\nBottom lobe: 3² - 1 = 8\nTop lobe: 1² + 12 = 13\nLeft lobe: 4² - 4 = 12 (or 3 × 4 = 12)."
  },
  {
    "id": 12,
    "prompt": dir_11_15,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/12.webp",
    "options": ["2031", "731", "1625", "1"],
    "correctIndex": 0,
    "explanation": "Moving clockwise, each successive number is obtained by multiplying the previous number by 5 and adding 1:\n3 × 5 + 1 = 16\n16 × 5 + 1 = 81\n81 × 5 + 1 = 406\n406 × 5 + 1 = 2031."
  },
  {
    "id": 13,
    "prompt": dir_11_15,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/13.webp",
    "options": ["11", "13", "15", "17"],
    "correctIndex": 1,
    "explanation": "Notice the relationships:\nRight box = 14² = 196\nTop box = 14 × 11 = 154\nCenter box = 13 × 17 = 221\nTherefore, the missing bottom box number is 13."
  },
  {
    "id": 14,
    "prompt": dir_11_15,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/14.webp",
    "options": ["JL24", "IJ18", "JK18", "JL12"],
    "correctIndex": 0,
    "explanation": "For letters: Moving across rows, the first letter follows B, C, D → E, F, G → H, I, J, and the second letter follows D, E, F → G, H, I → J, K, L. So the letters are JL.\nFor subscripts: In each row, the third subscript is the product of the first two subscripts:\nRow 1: 3 × 5 = 15\nRow 2: 2 × 4 = 8\nRow 3: 4 × 6 = 24\nTherefore, the missing element is JL₂₄."
  },
  {
    "id": 15,
    "prompt": dir_11_15,
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise1Chap14/15.webp",
    "options": ["33", "81", "243", "42"],
    "correctIndex": 1,
    "explanation": "The outer numbers around the cross follow powers of 3 going clockwise:\nLeft = 3¹ = 3\nRight = 3² = 9\nBottom = 3³ = 27\nTop = 3⁴ = 81.\nThe center number (39) is the sum of the surrounding three numbers: 3 + 9 + 27 = 39.\nTherefore, the missing number is 81."
  }
]

questions = []
for q in questions_data:
  questions.append({
    "id": q["id"],
    "type": "text",
    "prompt": q["prompt"],
    "image": q["image"],
    "options": q["options"],
    "correctIndex": q["correctIndex"],
    "explanation": q["explanation"]
  })

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test32'] = examples
data['quantitativeReasoningTests']['part2_secA_test32'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test32 to quantitativeReasoning.json')
