import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Which of the following diagrams correctly represents elephants, wolves, animals?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/1.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "Both elephants and wolves are animals, but elephants and wolves are entirely separate species. Thus, two separate circles inside one big circle (Diagram a)."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Which of the following diagrams correctly represents elephants, wolves, animals?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/1.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "Both elephants and wolves belong to the class of animals, but they are entirely separate species. So the relation is represented by two separate circles inside a large circle."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Which one of the following diagrams correctly represents the relationship among tennis fans, cricket players and students?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/2.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "A student can be a tennis fan as well as a cricket player. A cricket player can also be a tennis fan. So all three groups intersect each other."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Which is the most suitable Venn diagram among the following, which represents interrelationship among anti-social elements, pickpockets and blackmailers?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/3.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 2,
    "explanation": "Pickpockets and blackmailers are both anti-social elements, and some pickpockets can also be blackmailers. So two overlapping circles inside a large circle."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If animals that live on land and animals that live in water are represented by two big circles and animals that live in both water and land are represented by a small circle, the combination is represented as:",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/4.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 1,
    "explanation": "Animals living in both water and land (amphibians) lie in the intersection of land animals and water animals."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Which of the following gives the proper relation of tall men, black haired people, Indians?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/5.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 3,
    "explanation": "An Indian can be tall and/or black-haired. All three categories partially overlap one another."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Choose from the four diagrams given below, the one that illustrates the relationship among languages, French, German.",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/6.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 2,
    "explanation": "French and German are two distinct languages, both of which are completely contained inside Languages."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "In a dinner party both fish and meat were served. Some took only fish, some only meat. Vegetarians took neither. The rest took both fish and meat. Which diagram reflects this?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/7.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "Fish eaters and meat eaters form two overlapping circles, while vegetarians form a completely separate circle."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "In a survey of 1,000 persons on knowledge of English, French and German, the Venn diagram shows language distribution. What is the ratio of those who know NO language to those who know ALL THREE?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/8.webp",
    "options": ["1/27", "1/25", "1/550", "175/1000"],
    "correctIndex": 1,
    "explanation": "Total knowing at least one language = 170+180+200+105+85+78+175 = 993. Know no language = 1000 - 993 = 7. Know all 3 = 175. Ratio = 7/175 = 1/25."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Which one of the following Venn diagrams correctly illustrates the relationship among the classes: carrot, food, vegetable?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/9.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "Carrot is a vegetable, and all vegetables are food. This forms three concentric circles."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Triangle = girls, Square = sports persons, Circle = coaches. Which region represents girls who are sports persons but NOT coaches?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/10-11.webp",
    "options": ["A", "B", "D", "E"],
    "correctIndex": 1,
    "explanation": "Region B is inside both the Triangle (girls) and Square (sports persons), but outside the Circle (coaches)."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Circle A = Physics teachers, Circle B = Chemistry teachers, Circle C = Mathematics teachers. Which region represents teachers who can teach Physics and Mathematics but NOT Chemistry?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/10-11.webp",
    "options": ["v", "u", "s", "t"],
    "correctIndex": 1,
    "explanation": "Region u lies in the intersection of Circle A (Physics) and Circle C (Maths), outside Circle B (Chemistry)."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Which diagram correctly represents the relationship between Musicians, Instrumentalists, Violinists?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/12.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "All violinists are instrumentalists, and all instrumentalists are musicians. Three concentric circles."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Venn diagram indicates persons reading newspapers out of 50 surveyed. In a population of 10,000, how many can be expected to read at least two newspapers?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/13.webp",
    "options": ["5000", "6250", "6000", "5400"],
    "correctIndex": 3,
    "explanation": "Persons reading at least two newspapers = 12 + 8 + 5 + 2 = 27 out of 50. Expected in 10,000 = (27/50) * 10,000 = 5,400."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Triangle = urban, Square = hard working, Circle = educated. Which region represents urban educated who are NOT hardworking?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/14.webp",
    "options": ["II", "I", "IV", "III"],
    "correctIndex": 2,
    "explanation": "Region IV is inside Triangle (urban) and Circle (educated), but outside Square (hardworking)."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Which one of the following Venn diagrams best illustrates the three classes: rhombus, quadrilaterals and polygons?",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/15.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "All rhombuses are quadrilaterals, and all quadrilaterals are polygons. Three concentric circles."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Select from the four alternative diagrams, the one that best illustrates the relationship among the three classes: pigeons, birds, dogs.",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/16.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)"],
    "correctIndex": 0,
    "explanation": "All pigeons are birds (concentric circles), while dogs are completely separate."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Diseases, leprosy, scurvy",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 0,
    "explanation": "Both leprosy and scurvy are distinct diseases, represented by two separate circles inside a large circle (Diagram a)."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Hockey, cricket, games",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 0,
    "explanation": "Both hockey and cricket are distinct games, represented by two separate circles inside one big circle (Diagram a)."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Yak, zebra, bear",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 1,
    "explanation": "Yak, zebra, and bear are three completely separate animal species (Diagram b)."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Sun, moon, stars",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 2,
    "explanation": "Sun is a star (concentric circle), while Moon is a satellite (separate circle) -> Diagram (c)."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Animals, men, plants",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 2,
    "explanation": "Men belong to the animal kingdom (concentric circle), while plants form a completely separate group -> Diagram (c)."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Choose the Venn diagram which best illustrates the relationship among: Mercury, mars, planets",
    "image": "/img/afp_reviewer_imgs/quantitative_reasoning/quanPartII_exercise3/17-22.webp",
    "options": ["Diagram (a)", "Diagram (b)", "Diagram (c)", "Diagram (d)", "Diagram (e)"],
    "correctIndex": 0,
    "explanation": "Mercury and Mars are both distinct planets, represented by two separate circles inside a large circle (Diagram a)."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test25'] = examples
data['quantitativeReasoningTests']['part2_secA_test25'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test25 with 1 example and 22 questions to quantitativeReasoning.json')
