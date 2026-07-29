import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

directions = (
    "Directions: Study the following criteria for admission to medical courses in a college:\n\n"
    "Criteria:\n"
    "1. Passed XII standard examination in science with at least 60% marks.\n"
    "2. At least 18 years old as on 23.3.1993.\n"
    "3. Obtained at least 71% marks in the entrance examination.\n"
    "4. Able to pay monthly tuition fee of ₹ 560.\n"
    "5. Able to pay one-time deposit of ₹ 18,000.\n\n"
    "Exceptions:\n"
    "- Case (6): Satisfies all conditions except (5) and can pay one-time deposit up to ₹ 12,000 -> Case to be referred to the Director of the Institute.\n"
    "- Case (7): Satisfies all criteria except (1) -> Case to be referred to the Chairman.\n"
    "- Case (8): Satisfies all criteria but has not yet received the result of the final examination of XII std. -> May be provisionally admitted.\n\n"
    "Decision Options:\n"
    "(a) If the student is to be admitted\n"
    "(b) If the student is not to be admitted\n"
    "(c) If the case is to be referred to the Director\n"
    "(d) If the case is to be referred to the Chairman\n"
    "(e) If the student is to be provisionally admitted"
)

options_list = [
    "If the student is to be admitted",
    "If the student is not to be admitted",
    "If the case is to be referred to the Director",
    "If the case is to be referred to the Chairman",
    "If the student is to be provisionally admitted"
]

examples = [
    {
        "id": 1,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nNitin Sharma has passed XII standard examination with 62% marks and was 20 years old on 9th January, 1993. He has secured 75% marks in the entrance test. He can pay a tuition fee of ₹ 560 and a one time deposit of only ₹ 12,000.\n\nWhat decision should be taken for Nitin Sharma?",
        "options": options_list,
        "correctIndex": 2,
        "explanation": "Nitin Sharma satisfies all conditions except (5), but can pay up to ₹ 12,000. Therefore, he satisfies exception condition (6) and his case should be referred to the Director (Option c)."
    },
    {
        "id": 2,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nPrakash Mehra secured 60% and 72% marks in the XII standard and entrance examination respectively. He was 19 years old on 2nd December, 1992. He is able to pay the stipulated one time deposit and monthly tuition fee.\n\nWhat decision should be taken for Prakash Mehra?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "Prakash Mehra satisfies all eligibility criteria (1 to 5). Therefore, he is to be admitted (Option a)."
    }
]

questions = [
    {
        "id": 1,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nNitin Sharma has passed XII standard examination with 62% marks and was 20 years old on 9th January, 1993. He has secured 75% marks in the entrance test. He can pay a tuition fee of ₹ 560 and a one time deposit of only ₹ 12,000.\n\nWhat decision should be taken for Nitin Sharma?",
        "options": options_list,
        "correctIndex": 2,
        "explanation": "The candidate satisfies condition (6) instead of condition (5) (can pay deposit up to ₹ 12,000). Answer is (c) — refer to the Director."
    },
    {
        "id": 2,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nRajendra Kumar has passed XII standard examination in Science with 55% marks. He was born on 26th March, 1974. He has secured 83% marks in the entrance examination. He can pay one time deposit of ₹ 18,000 and monthly tuition fee of ₹ 560.\n\nWhat decision should be taken for Rajendra Kumar?",
        "options": options_list,
        "correctIndex": 3,
        "explanation": "The candidate satisfies all criteria except (1) (55% < 60% in XII science). Therefore, condition (7) applies and his case is to be referred to the Chairman. Answer is (d)."
    },
    {
        "id": 3,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nPrakash Mehra secured 60% and 72% marks in the XII standard and entrance examination respectively. He was 19 years old on 2nd December, 1992. He is able to pay the stipulated one time deposit and monthly tuition fee.\n\nWhat decision should be taken for Prakash Mehra?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "All conditions of eligibility (1 to 5) are satisfied. Answer is (a) — student is to be admitted."
    },
    {
        "id": 4,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nMukesh Maheshwari was born on 15th February, 1974. He attained 51% marks in XII standard examination and 75% marks in entrance test. He is able to pay monthly tuition fee of ₹ 560 and one time deposit of ₹ 18,000.\n\nWhat decision should be taken for Mukesh Maheshwari?",
        "options": options_list,
        "correctIndex": 3,
        "explanation": "The candidate satisfies condition (7) instead of condition (1) (51% < 60% in XII standard, but satisfies all other conditions). Answer is (d) — refer to the Chairman."
    },
    {
        "id": 5,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nPeeyush Yadav has appeared for the final exam of XII standard in Science stream. He was 19 years old on 25.7.92. He has secured 75% in the entrance examination. He is able to pay one time deposit of ₹ 18,000 and monthly tuition fee of ₹ 560.\n\nWhat decision should be taken for Peeyush Yadav?",
        "options": options_list,
        "correctIndex": 4,
        "explanation": "The candidate has appeared for XII std exam but hasn't received the result yet, satisfying exception condition (8). Answer is (e) — provisionally admitted."
    },
    {
        "id": 6,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nDeepak Gupta passed XII standard in Science with 63% marks and was born on 1.6.73. He has secured 74% marks in the entrance examination and can pay monthly tuition fees of ₹ 560. He can pay one time deposit of ₹ 9,000 only.\n\nWhat decision should be taken for Deepak Gupta?",
        "options": options_list,
        "correctIndex": 1,
        "explanation": "Condition (5) is not fulfilled, and his deposit of ₹ 9,000 is below the ₹ 12,000 limit for exception (6). Answer is (b) — not to be admitted."
    },
    {
        "id": 7,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nHarpal Singh, born on 8th September, 1974, passed XII standard examination in Science with 68% marks. He attained 69% marks in the Entrance Test and is able to pay the stipulated monthly tuition fee and one time deposit.\n\nWhat decision should be taken for Harpal Singh?",
        "options": options_list,
        "correctIndex": 1,
        "explanation": "Condition (3) is not fulfilled (69% < 71% in entrance test). Answer is (b) — not to be admitted."
    },
    {
        "id": 8,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nRakesh Sharma, who attained 59% marks in XII std. examination and 73.5% marks in the entrance test, is able to pay the monthly tuition fee of ₹ 560 and one time deposit of ₹ 18,000. He is 22 years of age.\n\nWhat decision should be taken for Rakesh Sharma?",
        "options": options_list,
        "correctIndex": 3,
        "explanation": "The candidate satisfies condition (7) instead of condition (1) (59% < 60% in XII std). Therefore, the case is to be referred to the Chairman. Answer is (d)."
    },
    {
        "id": 9,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nNisha Gupta, a 21 year old girl, passed the XII standard examination with 64% marks and the entrance test with 77% marks. She is able to pay the tuition fee of ₹ 560 and a one time deposit of ₹ 18,000.\n\nWhat decision should be taken for Nisha Gupta?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "All conditions of eligibility (1 to 5) are satisfied. Answer is (a) — student is to be admitted."
    },
    {
        "id": 10,
        "type": "text",
        "prompt": f"{directions}\n\nStudent Profile:\nJatin Narang was born on 7.9.74. He secured 72% marks in the entrance test. He has appeared for XII standard examination and can pay the stipulated tuition fee and one time deposit.\n\nWhat decision should be taken for Jatin Narang?",
        "options": options_list,
        "correctIndex": 4,
        "explanation": "As the candidate has not yet received the result of the final examination of XII standard, he satisfies exception condition (8). Answer is (e) — provisionally admitted."
    }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test28'] = examples
data['quantitativeReasoningTests']['part2_secA_test28'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test28 to quantitativeReasoning.json')
