import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "You are visiting a place for first time and are travelling in a bus. Suddenly you realise that the driver is taking the bus to a lonely place with no right intentions. You would:",
    "options": [
      "with the help of some other passengers, try to baffle the driver and take over the bus.",
      "sit and wait to face repercussions.",
      "jump out of the running bus.",
      "console the worried passengers."
    ],
    "correctIndex": 0,
    "explanation": "When you expect wrong doing of the driver, the immediate action to prevent it is the need. So the answer is (a)."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "While playing cricket in the school, suddenly when you hit the ball, it strikes your classmate on the forehead and blood starts oozing out. You would:",
    "options": [
      "run away from the field.",
      "start fighting with the boy why he came in the way.",
      "blame somebody else for the accident.",
      "take the boy to the first-aid room."
    ],
    "correctIndex": 3,
    "explanation": "In the above situation, the urgent need is to provide first aid to the boy so that bleeding may stop. So the answer is (d)."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "While you board a train at the station, you find a suitcase beneath your seat. You would:",
    "options": [
      "report the matter to the police.",
      "open the suitcase to look through its contents.",
      "try to find out the address of the owner from the papers, etc. in the suitcase.",
      "finding no one to claim it, take it into your own possession."
    ],
    "correctIndex": 0,
    "explanation": "As the case is a loss of a valuable article for the concerned owner, necessary steps have to be taken to hand over the article, by reporting the matter to the police. So the answer is (a)."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "You are living in a college hostel. The dal served to you in the mess has a lot of stones. What would you do?",
    "options": [
      "leave eating the dal altogether.",
      "bring the matter to the notice of mess incharge.",
      "speak to the cook about changing the dal.",
      "buy your own dal and cook it in your room."
    ],
    "correctIndex": 1,
    "explanation": "Bringing the matter to the notice of the mess incharge is the proper channel to address quality issues."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "You are entrusted with the job of taking care of a child. If the child insists on doing something which you would not allow, you would:",
    "options": [
      "beat the child.",
      "threaten the child and make him quiet.",
      "try to make him understand why you will not allow the action.",
      "let the child cry."
    ],
    "correctIndex": 2,
    "explanation": "Helping the child understand the reasoning behind rules encourages positive learning and cooperation."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "You are driving your car on the road when you hit against a fruit vendor's cart. You would:",
    "options": [
      "escape from the site by driving away.",
      "abuse the fruit vendor for putting his cart on the way.",
      "pay the fruit vendor for the damage done to him.",
      "insist that it was not your fault."
    ],
    "correctIndex": 2,
    "explanation": "Taking responsibility and compensating the vendor for damage is the moral and lawful action."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "While travelling in a train, you notice a man from the coach behind yours fall off the train. You would:",
    "options": [
      "pull the alarm chain so that the train may stop and the man may be helped.",
      "shout at the falling man asking him to get up quickly and entrain.",
      "jump off the train to assist the falling man.",
      "wait till the train stops at the next station and inform the railway authorities there."
    ],
    "correctIndex": 0,
    "explanation": "Pulling the emergency alarm chain allows the train to stop immediately to rescue the fallen person."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "You find that the person whom you call your friend has been cheating you. What would you do?",
    "options": [
      "break relations with him.",
      "give him tit for tat.",
      "make him realise his mistake.",
      "tell other friends about him."
    ],
    "correctIndex": 2,
    "explanation": "Helping a friend realize their mistake offers a constructive opportunity for correction and mutual understanding."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "You are alone in the house and there is quite a danger of thieves around. Just then, you hear a knock at the door. You would:",
    "options": [
      "open the door to see who is there.",
      "first peep out from the window to confirm whether you know the person.",
      "not open the door.",
      "ask the servant to see who is there."
    ],
    "correctIndex": 1,
    "explanation": "Peeping from the window first ensures personal safety before opening the door."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "You are returning from school. On the way, you find a sealed envelope in a street, fully addressed with unused stamps on it. You would:",
    "options": [
      "leave it there as it was and walk away.",
      "remove the stamps and destroy the envelope.",
      "open the envelope, find out who has dropped it by mistake, and send it to him if possible.",
      "post it at the nearest letter box."
    ],
    "correctIndex": 3,
    "explanation": "Posting it in the nearest letter box ensures the postal service delivers it to the intended addressee."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "While firing crackers, a child gets severe burns on the hand. What would you do?",
    "options": [
      "dip the child's hands in cold water till there is no more burning sensation.",
      "wash the hands with dettol.",
      "send some one to call the doctor.",
      "apply some ointment on the affected area."
    ],
    "correctIndex": 0,
    "explanation": "Immersion in clean cold water is the recommended immediate first aid to soothe burn injuries."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "If in the examination hall, you find that the question paper is too tough to be answered satisfactorily by you, the best thing to do for you is to:",
    "options": [
      "tell the examiner that the questions are out of course.",
      "provoke the candidates to walk out of the examination hall.",
      "try to know something from your neighbour.",
      "try to solve the questions as much as you know with a cool head."
    ],
    "correctIndex": 3,
    "explanation": "Attempting questions calmly with a cool head ensures maximum performance under tough conditions."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "On reaching the railway station, you find that the train you wanted to catch is just to start and there is hardly any time for purchasing the ticket. The best thing for you is to:",
    "options": [
      "rush to the train rather than miss it and inform the TTI at the next stoppage about your inability to purchase the ticket.",
      "rush to the train and perform your journey quietly.",
      "first purchase the ticket and then catch the train if it is there.",
      "miss the train rather than take the risk of boarding the moving train."
    ],
    "correctIndex": 0,
    "explanation": "Boarding and promptly informing the Traveling Ticket Examiner (TTI) allows legitimate fare settlement without missing the train."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Your bathroom tap is leaking and is a constant source of irritating noise. You would:",
    "options": [
      "sleep with pillows upon your ears.",
      "put a bucket underneath.",
      "try to put up a cork upon the mouth of the tap.",
      "call a plumber to repair the tap."
    ],
    "correctIndex": 3,
    "explanation": "Calling a professional plumber addresses the root cause of the leak permanently."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "While attending your friend's party, you see your friend's muffler catching fire from the candle on the table behind him. You would:",
    "options": [
      "ask your friend to see behind him.",
      "rush to call friend's mother.",
      "rush and take out the muffler from his neck, drop it and pour water on it.",
      "take out the muffler and throw it away."
    ],
    "correctIndex": 2,
    "explanation": "Immediately removing the burning clothing and dousing it with water prevents severe burn injuries."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test30'] = examples
data['quantitativeReasoningTests']['part2_secA_test30'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test30 to quantitativeReasoning.json')
