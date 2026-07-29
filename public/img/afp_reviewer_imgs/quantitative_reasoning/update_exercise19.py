import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "A and B are married couple. X and Y are brothers. X is the brother of A. How is Y related to B?",
    "options": ["Brother-in-law", "Brother", "Son-in-law", "Cousin", "None of these"],
    "correctIndex": 0,
    "explanation": "A and B are husband and wife. Since X and Y are brothers, and X is the brother of A, Y is also the brother of A. Thus Y is the brother-in-law of B."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "A and B are brothers, C and D are sisters. A's son is D's brother. How is B related to C?",
    "options": ["Father", "Brother", "Grandfather", "Uncle", "None of these"],
    "correctIndex": 3,
    "explanation": "Clearly, B is the brother of A. A's son is D's brother. i.e. D is the daughter of A and hence C is also the daughter of A. So, B is the uncle of C."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Based on: 'A is the son of B; C, B's sister has a son D and a daughter E; F is the maternal uncle of D.' How is A related to D?",
    "options": ["Cousin", "Nephew", "Uncle", "Brother", "None of these"],
    "correctIndex": 0,
    "explanation": "A is the son of B. D is the son of B's sister. So A is the cousin of D."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Based on: 'A is the son of B; C, B's sister has a son D and a daughter E; F is the maternal uncle of D.' How is E related to F?",
    "options": ["Sister", "Daughter", "Niece", "Wife", "None of these"],
    "correctIndex": 2,
    "explanation": "E is the daughter of C and D is the son of C. So, F, who is the maternal uncle of D, is also maternal uncle of E. Thus, E is the niece of F."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Based on: 'A is the son of B; C, B's sister has a son D and a daughter E; F is the maternal uncle of D.' How many nephews does F have?",
    "options": ["Nil", "One", "Two", "Three", "None of these"],
    "correctIndex": 2,
    "explanation": "Clearly, F is the maternal uncle of D means F is the brother of D's mother, i.e. F is the brother of C. C is the sister of B. So, F is the brother of B, who is mother of A. Thus, F is the maternal uncle of A. So, A and D are the nephews of F. i.e. F has two nephews."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Based on: 'A is the son of B; C, B's sister has a son D and a daughter E; F is the maternal uncle of D.' How is F related to E?",
    "options": ["Uncle", "Brother", "Maternal uncle", "Nephew", "None of these"],
    "correctIndex": 0,
    "explanation": "From Q. 2, E is the niece of F, who is a male. So, F is the uncle of E."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "P is the son of Q while Q and R are the sisters to one another. T is the mother of R. If S is the son of T, which of the following statement is correct?",
    "options": ["T is the brother of Q", "S is the cousin of P", "Q and S are sisters", "S is the maternal uncle of P", "R is the grandfather of P"],
    "correctIndex": 3,
    "explanation": "Q and R are sisters. So, T is the mother of R means T is the mother of Q and R. S is the son of T means S is the brother of Q. Thus, P is the son of Q means S is the maternal uncle of P."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "P is the brother of Q and R. S is R's mother. T is father of P. Which of the following statement cannot be definitely true?",
    "options": ["T is father of Q", "S is mother of P", "P is son of S", "T is husband of S", "Q is son of T"],
    "correctIndex": 4,
    "explanation": "P, Q and R are children of the same parents. So, S who is mother of R and T, who is father of P will be mother and father of all three. However, it is not mentioned whether Q is male or female. So 'Q is son of T' cannot be definitely true."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "A and B both are children of C. If C is the mother of A, A is the son of C but B is not the daughter of C, how are A and B mutually related?",
    "options": ["A is the brother of B", "A is the sister of B", "A is the cousin of B", "A is the nephew of B", "None of these"],
    "correctIndex": 0,
    "explanation": "B is the child of C, but not daughter means B is the son of C. Also, A is the son of C. So, A is the brother of B."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "E is the son of A. D is the son of B. E is married to C. C is daughter of B. How is D related to E?",
    "options": ["Brother", "Uncle", "Father-in-law", "Brother-in-law", "None of these"],
    "correctIndex": 3,
    "explanation": "C is B's daughter and D is B's son. So, D is the brother of C. E is a male married to C. So, E is the husband of C, whose brother is D. So, D is the brother-in-law of E."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "A woman walking with a boy meets another woman and on being asked about her relationship with the boy, she says, 'My maternal uncle and his maternal uncle's maternal uncle are brothers'. How is the boy related to the woman?",
    "options": ["Nephew", "Son", "Grandson", "Husband", "Brother-in-law"],
    "correctIndex": 1,
    "explanation": "Boy's maternal uncle will be brother of boy's mother. Maternal uncle of mother's brother and maternal uncle of lady are brothers means lady is sister to mother's brother. i.e., lady is the mother of the boy. So, the boy is woman's son."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "P is the brother of D. X is the sister of P. A is the brother of F. F is the daughter of D. M is the father of X. Who is the uncle of A?",
    "options": ["X", "P", "F", "M", "None of these"],
    "correctIndex": 1,
    "explanation": "A is the brother of F who is the daughter of D. So, A is the son of D. P is the brother of D. So, P is the uncle of A."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Based on: 'Five persons P, Q, X, Y, Z are in a park. P is mother of X who is wife of Z. Y is brother of P and Q is husband of P.' How is P related to Z?",
    "options": ["Mother", "Aunt", "Sister", "Mother-in-law", "None of these"],
    "correctIndex": 3,
    "explanation": "P is the mother of X who is the wife of Z. So, P is the mother-in-law of Z."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Based on: 'P is mother of X who is wife of Z. Y is brother of P and Q is husband of P.' How is Y related to Q?",
    "options": ["Brother", "Brother-in-law", "Cousin", "Uncle", "Son"],
    "correctIndex": 1,
    "explanation": "Q is the husband of P means P is the wife of Q. So, Y is the brother of P who is the wife of Q. Thus, Y is the brother-in-law of Q."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Based on: 'P is mother of X who is wife of Z. Y is brother of P and Q is husband of P.' How is X related to Q?",
    "options": ["Daughter", "Daughter-in-law", "Niece", "Aunt", "Mother"],
    "correctIndex": 0,
    "explanation": "P is the mother of X who is a female. So, X is the daughter of P. Q is the husband of P. Thus, X is the daughter of Q."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Based on: 'P is mother of X who is wife of Z. Y is brother of P and Q is husband of P.' How is Q related to Z?",
    "options": ["Father-in-law", "Brother-in-law", "Father", "Mother-in-law", "None of these"],
    "correctIndex": 0,
    "explanation": "P is the mother-in-law of Z. So, Q, the husband of P will be father-in-law of Z."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Based on family of 6 (A, B, C, D, E, F: lawyer, doctor, teacher, salesman, engineer, accountant): How is E related to F?",
    "options": ["Brother", "Sister", "Cousin", "Can't be determined", "None of these"],
    "correctIndex": 3,
    "explanation": "From the given data, E is the unmarried engineer and brother/sister status between E and F is not specified, so relation cannot be determined."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Based on family of 6 (A, B, C, D, E, F: lawyer, doctor, teacher, salesman, engineer, accountant): What is the profession of B?",
    "options": ["Teacher", "Doctor", "Lawyer", "Can't be determined", "None of these"],
    "correctIndex": 1,
    "explanation": "C, the lawyer, is married to the doctor B. So B is a doctor."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Based on family of 6 (A, B, C, D, E, F: lawyer, doctor, teacher, salesman, engineer, accountant): Which is the profession of A?",
    "options": ["Lawyer", "Teacher", "Doctor", "Can't be determined", "None of these"],
    "correctIndex": 1,
    "explanation": "D, the salesman, is married to the lady teacher A. So A is the lady teacher."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Based on family of 6 (A, B, C, D, E, F: lawyer, doctor, teacher, salesman, engineer, accountant): Which of the following is one of the couples?",
    "options": ["F and D", "D and B", "E and A", "A and C", "None of these"],
    "correctIndex": 4,
    "explanation": "The two couples are C & B and D & A, neither of which is explicitly listed in choices (a)-(d). So the answer is None of these."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Based on family of 6 (A, B, C, D, E, F: lawyer, doctor, teacher, salesman, engineer, accountant): How is D related to F?",
    "options": ["Grandfather", "Father", "Uncle", "Brother", "None of these"],
    "correctIndex": 0,
    "explanation": "D is the salesman father of B and husband of grandmother A. So D is the grandfather of F."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): Who is the brother-in-law of R?",
    "options": ["P", "Z", "Y", "X", "None of these"],
    "correctIndex": 1,
    "explanation": "R is the husband of P and Z is the brother of P. So, Z is the brother-in-law of R."
  },
  {
    "id": 21,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): Who is the father of Q?",
    "options": ["P", "Z", "R", "Can't be determined", "None of these"],
    "correctIndex": 2,
    "explanation": "Q is the son of R and R is not the mother, so R is the father of Q."
  },
  {
    "id": 22,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): How many children does P have?",
    "options": ["Four", "Three", "Two", "One", "None of these"],
    "correctIndex": 2,
    "explanation": "Q is the son of P and X is the daughter of P. So P has two children."
  },
  {
    "id": 23,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): How many female members are there in the family?",
    "options": ["One", "Two", "Three", "Four", "Five"],
    "correctIndex": 1,
    "explanation": "There are two females only—mother P and daughter X."
  },
  {
    "id": 24,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): How is Q related to X?",
    "options": ["Uncle", "Brother", "Father", "Husband", "None of these"],
    "correctIndex": 1,
    "explanation": "X is the sister of Q who is a male. So, Q is the brother of X."
  },
  {
    "id": 25,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, X, Y, Z: Q is son of R but R not mother; P, R married; Y brother of R; X daughter of P; Z brother of P): Which is a pair of brothers?",
    "options": ["R and Y", "Q and X", "P and Z", "P and X", "None of these"],
    "correctIndex": 0,
    "explanation": "Y is the brother of R who is a male. So, Y and R are a pair of brothers."
  },
  {
    "id": 26,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, S, T, U: Q doctor father of T; U contractor grandfather of R; S housewife grandmother of T): Who is the husband of P?",
    "options": ["R", "U", "Q", "S", "T"],
    "correctIndex": 2,
    "explanation": "Q, the doctor father of T, is married to P (the nurse). So the husband of P is Q."
  },
  {
    "id": 27,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, S, T, U: Q doctor father of T; U contractor grandfather of R; S housewife grandmother of T): Who is the sister of T?",
    "options": ["R", "U", "T", "Can't be determined", "None of these"],
    "correctIndex": 0,
    "explanation": "R and T are children of the same parents (Q & P). So R will be the sister of T."
  },
  {
    "id": 28,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, S, T, U: Q doctor father of T; U contractor grandfather of R; S housewife grandmother of T): What is the profession of P?",
    "options": ["Doctor", "Nurse", "Doctor or Nurse", "Housewife", "None of these"],
    "correctIndex": 1,
    "explanation": "P remains as the wife of doctor Q and her profession is Nurse."
  },
  {
    "id": 29,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, S, T, U: Q doctor father of T; U contractor grandfather of R; S housewife grandmother of T): Which of the following are two married couples?",
    "options": ["US, QT", "US, QP", "TS, RU", "US, RP", "None of these"],
    "correctIndex": 1,
    "explanation": "The two married couples in the family are U & S and Q & P."
  },
  {
    "id": 30,
    "type": "text",
    "prompt": "Based on family of 6 (P, Q, R, S, T, U: Q doctor father of T; U contractor grandfather of R; S housewife grandmother of T): Which of the following is definitely a group of male members?",
    "options": ["QU", "QUT", "QUP", "UT", "None of these"],
    "correctIndex": 0,
    "explanation": "Clearly, Q (the father) and U (the grandfather) are definitely males."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test19'] = examples
data['quantitativeReasoningTests']['part2_secA_test19'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test19 with 2 examples and 30 questions to quantitativeReasoning.json')
