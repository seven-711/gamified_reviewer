import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

directions = (
    "Directions: Study the following qualifications and conditions required for the recruitment of a librarian in a state university:\n\n"
    "Qualifications:\n"
    "1. Master's degree in Library Science with at least 55% marks or equivalent grade and a consistently good academic record.\n"
    "2. One year specialisation in Information Technology/Archives and manuscript keeping.\n"
    "3. At least 10 years' experience as a Deputy Librarian in a university.\n"
    "4. Evidence of innovative library service and organisation of published work.\n\n"
    "Exceptions:\n"
    "- Case (5): Has 15 years' experience as a college librarian -> Case to be referred to the Vice Chancellor.\n"
    "- Case (6): Obtained less than 55% marks in library science but has 13 years' experience as a Deputy Librarian in a university -> Case to be referred to the Registrar.\n"
    "- Case (7): Having an M.Phil./Ph.D. degree in Library Science/Information Science/Documentation/Archives with 10 years' experience as a college librarian -> Condition (1) may be waived.\n\n"
    "Decision Options:\n"
    "(a) Candidate is to be selected\n"
    "(b) Candidate is not to be selected\n"
    "(c) Data are inadequate\n"
    "(d) Case to be referred to the Registrar\n"
    "(e) Case to be referred to the Vice Chancellor"
)

options_list = [
    "If the candidate is to be selected",
    "If the candidate is not to be selected",
    "If the data are inadequate",
    "If the case is to be referred to the Registrar",
    "If the case is to be referred to the Vice Chancellor"
]

examples = [
    {
        "id": 1,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nAshok having Master's degree in Library Science with 70% marks and with one year specialisation in an area of Information Technology joined as a Librarian in the Indian College on 22nd February 1985. He also holds a certificate of innovative library science in the college.\n\nWhat course of action should be taken for Ashok?",
        "options": options_list,
        "correctIndex": 4,
        "explanation": "Ashok fulfills conditions (1), (2) and (4). Being a college librarian for 16 years, he satisfies condition (5). Therefore, the case is to be referred to the Vice Chancellor (Option e)."
    },
    {
        "id": 2,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nSatheesh, an M.Phil in Library Science has been a Deputy Librarian in the MG University since 27th September 1988. He has also obtained master's degree in Archives and manuscript keeping. He holds the evidence of innovative organisation of published work of the college students doing Ph.D.\n\nWhat course of action should be taken for Satheesh?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "Satheesh, being an M.Phil degree holder, satisfies condition (7) so condition (1) is waived. He satisfies conditions (2), (3) and (4). Therefore, he is selected (Option a)."
    }
]

questions = [
    {
        "id": 1,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nAshok having Master's degree in Library Science with 70% marks and with one year specialisation in an area of Information Technology joined as a Librarian in the Indian College on 22nd February 1985. He also holds a certificate of innovative library science in the college.\n\nWhat course of action should be taken for Ashok?",
        "options": options_list,
        "correctIndex": 4,
        "explanation": "Ashok fulfills conditions (1), (2) and (4). Being a college librarian for 16 years, he satisfies condition (5). So, the answer is (e) — refer to the Vice Chancellor."
    },
    {
        "id": 2,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nSatheesh, an M.Phil in Library Science has been a Deputy Librarian in the MG University since 27th September 1988. He has also obtained master's degree in Archives and manuscript keeping. He holds the evidence of innovative organisation of published work of the college students doing Ph.D.\n\nWhat course of action should be taken for Satheesh?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "Satheesh, being an M.Phil degree holder, satisfies condition (7) so that condition (1) may be waived. He satisfies conditions (2), (3) and (4). So he is selected and the answer is (a)."
    },
    {
        "id": 3,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nGopala Krishnan has been a Deputy Librarian in the MS University since 1981. He holds an evidence of contributing library service in the same institution. He has a master's degree in Library Science with 53% marks.\n\nWhat course of action should be taken for Gopala Krishnan?",
        "options": options_list,
        "correctIndex": 1,
        "explanation": "Gopala Krishnan satisfies condition (4) and condition (3) (20 years as Deputy Librarian). As the marks scored by him are less than 55%, he violates condition (1). Furthermore, specialisation condition (2) is not satisfied. So he is not to be selected and the answer is (b)."
    },
    {
        "id": 4,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nRoy holding a Ph.D. degree in Library Science has one year specialisation in the Archives and manuscript keeping. He has been a Deputy Librarian in the Agriculture University since 11 May 1990. He also has a certificate of innovative Library service in a public library for three years.\n\nWhat course of action should be taken for Roy?",
        "options": options_list,
        "correctIndex": 0,
        "explanation": "Roy, being a Ph.D. holder, satisfies condition (7) so that (1) is waived. He satisfies conditions (2) and (4) and being a Deputy Librarian for 11 years, he satisfies condition (3). So he is selected and the answer is (a)."
    },
    {
        "id": 5,
        "type": "text",
        "prompt": f"{directions}\n\nCandidate Profile:\nSuresh Kumar has been a college librarian since 15 January, 1983. He holds an M.Phil Degree in Library Science.\n\nWhat course of action should be taken for Suresh Kumar?",
        "options": options_list,
        "correctIndex": 2,
        "explanation": "Suresh Kumar, being an M.Phil, satisfies condition (7) so condition (1) is waived. Being a college librarian for 18 years, he satisfies experience condition (3). However, there is no information regarding conditions (2) and (4). Therefore, data are inadequate and the answer is (c)."
    }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test27'] = examples
data['quantitativeReasoningTests']['part2_secA_test27'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test27 to quantitativeReasoning.json')
