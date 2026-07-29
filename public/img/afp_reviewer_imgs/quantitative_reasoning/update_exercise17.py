import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "If in a certain code language SISTER is coded as 535301, UNCLE as 84670 and BOY as 129, how will SON be coded in that code language?",
    "options": ["524", "643", "353", "846", "None of these"],
    "correctIndex": 0,
    "explanation": "Clearly, in the given code, S is coded as 5, O is coded as 2 and N is coded as 4. Hence correct code is 524."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "If GIVE is coded as 5137 and BAT is coded as 924, how is GATE coded?",
    "options": ["5427", "5724", "5247", "2547", "None of these"],
    "correctIndex": 2,
    "explanation": "G is coded as 5, A is coded as 2, T is coded as 4 and E is coded as 7. Hence correct code is 5247."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "In a certain code, PALE is written as 2134, EARTH is written as 41590, how will PEARL be written in that code?",
    "options": ["29530", "24153", "25413", "25430", "None of these"],
    "correctIndex": 1,
    "explanation": "P=2, A=1, R=5, E=4, L=3. So PEARL is coded as 24153."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "In a certain code, RIPPLE is written as 613382 and LIFE is written as 8192. How will RIFFLE be written in that code?",
    "options": ["968812", "869912", "619982", "269981", "None of these"],
    "correctIndex": 2,
    "explanation": "R=6, I=1, F=9, L=8, E=2. So RIFFLE is coded as 619982."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "If ROSE is coded as 6821, CHAIR is coded as 73456 and PREACH is coded as 961473, what will be the code for SEARCH?",
    "options": ["246173", "214673", "214763", "216473", "None of these"],
    "correctIndex": 1,
    "explanation": "S=2, E=1, A=4, R=6, C=7, H=3. So SEARCH is coded as 214673."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "If in a certain code language, TWENTY is written as 863985 and ELEVEN is written as 323039, how will TWELVE be written in that code?",
    "options": ["863203", "863584", "863903", "863063", "None of these"],
    "correctIndex": 0,
    "explanation": "T=8, W=6, E=3, L=2, V=0, E=3. So TWELVE is written as 863203."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "If A is coded as 1, B is coded as 2, and so on, how is HIGH coded in that code?",
    "options": ["9879", "7897", "8978", "8798", "None of these"],
    "correctIndex": 2,
    "explanation": "H=8, I=9, G=7, H=8. So HIGH is coded as 8978."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "If ENTRY is coded as 12345 and STEADY is coded as 931785, what is the code for NEATNESS?",
    "options": ["2956169", "21732199", "21362199", "21823698", "None of these"],
    "correctIndex": 1,
    "explanation": "N=2, E=1, A=7, T=3, N=2, E=1, S=9, S=9. So NEATNESS is coded as 21732199."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "If ENTRY is coded as 12345 and STEADY is coded as 931785, what is the code for ARREST?",
    "options": ["744589", "744193", "166479", "745194", "188924"],
    "correctIndex": 1,
    "explanation": "A=7, R=4, R=4, E=1, S=9, T=3. So ARREST is coded as 744193."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "If ENTRY is coded as 12345 and STEADY is coded as 931785, what is the code for ENDEAR?",
    "options": ["524519", "174189", "128174", "124179", "164983"],
    "correctIndex": 2,
    "explanation": "E=1, N=2, D=8, E=1, A=7, R=4. So ENDEAR is coded as 128174."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If CHARCOAL is coded as 45164913 and MORALE is coded as 296137, how is REAL coded?",
    "options": ["8519", "6713", "6513", "6719", "None of these"],
    "correctIndex": 1,
    "explanation": "R=6, E=7, A=1, L=3. So REAL is coded as 6713."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "If CHARCOAL is coded as 45164913 and MORALE is coded as 296137, how is COACH coded?",
    "options": ["38137", "49148", "48246", "49145", "None of these"],
    "correctIndex": 3,
    "explanation": "C=4, O=9, A=1, C=4, H=5. So COACH is coded as 49145."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "If CHARCOAL is coded as 45164913 and MORALE is coded as 296137, how is COLLAR coded?",
    "options": ["397758", "497758", "483359", "493316", "None of these"],
    "correctIndex": 3,
    "explanation": "C=4, O=9, L=3, L=3, A=1, R=6. So COLLAR is coded as 493316."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "If MISTAKE is coded as 9765412 and NAKED is coded as 84123, how is DISTANT coded?",
    "options": ["3765485", "4798165", "3697185", "4768296", "None of these"],
    "correctIndex": 0,
    "explanation": "D=3, I=7, S=6, T=5, A=4, N=8, T=5. So DISTANT is coded as 3765485."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "If MISTAKE is coded as 9765412 and NAKED is coded as 84123, how is ASSIST coded?",
    "options": ["166762", "466765", "488976", "435985", "166872"],
    "correctIndex": 1,
    "explanation": "A=4, S=6, S=6, I=7, S=6, T=5. So ASSIST is coded as 466765."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "If MISTAKE is coded as 9765412 and NAKED is coded as 84123, how is INTIMATE coded?",
    "options": ["89786145", "79438163", "78579452", "78698365", "None of these"],
    "correctIndex": 2,
    "explanation": "I=7, N=8, T=5, I=7, M=9, A=4, T=5, E=2. So INTIMATE is coded as 78579452."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "If MISTAKE is coded as 9765412 and NAKED is coded as 84123, how is STAIN coded?",
    "options": ["98175", "89483", "68194", "65478", "None of these"],
    "correctIndex": 3,
    "explanation": "S=6, T=5, A=4, I=7, N=8. So STAIN is coded as 65478."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "If ROPE is coded as 6821 and CHAIR is coded as 73456 then what will be the code for CRAPE?",
    "options": ["73456", "76421", "77246", "77123", "None of these"],
    "correctIndex": 1,
    "explanation": "C=7, R=6, A=4, P=2, E=1. So CRAPE is coded as 76421."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "If PLAY is coded as 8123 and RHYME is coded as 49367, then how is MALE coded?",
    "options": ["6217", "6198", "6395", "6285", "None of these"],
    "correctIndex": 0,
    "explanation": "M=6, A=2, L=1, E=7. So MALE is coded as 6217."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "If in a certain language PRIVATE is coded as 1234567 and RIST is coded as 2396, then how is RIVETS coded in that language?",
    "options": ["687543", "234769", "496321", "246598", "None of these"],
    "correctIndex": 1,
    "explanation": "R=2, I=3, V=4, E=7, T=6, S=9. So RIVETS is coded as 234769."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "In a certain code language 24685 is written as 33776. How is 35791 written in that code?",
    "options": ["44882", "44880", "46682", "44682", "None of these"],
    "correctIndex": 0,
    "explanation": "Letters at odd places are +1 and even places -1. So 3 (+1)=4, 5 (-1)=4, 7 (+1)=8, 9 (-1)=8, 1 (+1)=2. So 35791 is coded as 44882."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "In a certain code language 35796 is written as 44887. How is 46823 written in that code?",
    "options": ["57914", "55914", "55934", "55714", "None of these"],
    "correctIndex": 1,
    "explanation": "Follows pattern: odd places +1, even places -1. 4 (+1)=5, 6 (-1)=5, 8 (+1)=9, 2 (-1)=1, 3 (+1)=4. So 46823 is coded as 55914."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test17'] = examples
data['quantitativeReasoningTests']['part2_secA_test17'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test17 with 2 examples and 20 questions to quantitativeReasoning.json')
