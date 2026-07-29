import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

examples = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Complete the letter series by filling in the blanks: abca _ bcaab _ ca _ bbc _ a",
    "options": ["ccaa", "bbaa", "abac", "abba"],
    "correctIndex": 2,
    "explanation": "1. The first blank space should be filled using 'a'; so that the first alphabet doubles in the first step after 'abc'. 2. The second blank space should be filled using 'b' so that in the second step both 'a' and 'b' doubles. 3. The third blank space should be filled by 'a' and the fourth blank space should be filled by 'c' so that in the third stage, all characters 'a', 'b' and 'c' doubles. Thus, the answer is abac."
  }
]

questions = [
  {
    "id": 1,
    "type": "text",
    "prompt": "Choose the correct alternative: abca _ bcaab _ aa _ caa _ c",
    "options": ["bbac", "bbaa", "acbb", "acac"],
    "correctIndex": 2,
    "explanation": "The series is a / bcaa / bcaa / bcaa / bcaa / bc. Thus, the pattern bcaa is repeated."
  },
  {
    "id": 2,
    "type": "text",
    "prompt": "Choose the correct alternative: b _ b _ bb _ _ bbb _ bb _ b",
    "options": ["bbbbba", "bbaaab", "ababab", "aabaab"],
    "correctIndex": 2,
    "explanation": "The series is babb / bbab / bbba / bbbb. Thus, in each sequence 'a' moves one step forward and 'b' takes its place and finally to the fourth sequence, where 'a' is eliminated."
  },
  {
    "id": 3,
    "type": "text",
    "prompt": "Choose the correct alternative: aab _ ab _ cabcca _ bcab _ c",
    "options": ["bbbc", "bbab", "cabc", "cbab"],
    "correctIndex": 3,
    "explanation": "The series is aa / bcab / bcab / ccaa / bcab / bc. Thus, the pattern ccaa followed by bcab repeated twice, makes up the series."
  },
  {
    "id": 4,
    "type": "text",
    "prompt": "Choose the correct alternative: ccbab _ caa _ bccc _ a _",
    "options": ["babb", "bbba", "baab", "babc"],
    "correctIndex": 0,
    "explanation": "The series is ccba / bbca / aabc / ccba / b. Thus, the pattern consists of first two letters moved 1 step backward and the third letter moved 1 step forward and the last letter remains the same in the first stage."
  },
  {
    "id": 5,
    "type": "text",
    "prompt": "Choose the correct alternative: _ abb _ bb _ a _ bbab _ ba",
    "options": ["bababa", "bbabbb", "ababaa", "aaaabb"],
    "correctIndex": 1,
    "explanation": "The series is babb / babb / babb / babb / ba. Thus pattern babb is repeated."
  },
  {
    "id": 6,
    "type": "text",
    "prompt": "Choose the correct alternative: ba _ ba _ bac _ acb _ cbac",
    "options": ["aacb", "bbca", "ccba", "cbac"],
    "correctIndex": 2,
    "explanation": "The series is bac / bac / bac / bac / bac / cbac. Thus, the pattern bac is repeated."
  },
  {
    "id": 7,
    "type": "text",
    "prompt": "Choose the correct alternative: cc _ ccbc _ accbcc _ c _ b",
    "options": ["acac", "abac", "abab", "aabc"],
    "correctIndex": 0,
    "explanation": "The series is ccaccb / ccaccb / ccaccb. Thus, the pattern ccaccb is repeated."
  },
  {
    "id": 8,
    "type": "text",
    "prompt": "Choose the correct alternative: aaa _ bb _ aab _ baaa _ bb",
    "options": ["abab", "bbaa", "babb", "baab"],
    "correctIndex": 2,
    "explanation": "The series is aaa / bbb / aaa / bbb / aaa / bbb."
  },
  {
    "id": 9,
    "type": "text",
    "prompt": "Choose the correct alternative: acc _ bc _ a _ ccbbcc _",
    "options": ["abab", "bcaa", "aabc", "bcab"],
    "correctIndex": 1,
    "explanation": "The series is accb / bcca / accb / bcca. Thus, the pattern accb / bcca is repeated."
  },
  {
    "id": 10,
    "type": "text",
    "prompt": "Choose the correct alternative: aab _ bbaaa _ cbba _ abc _ ba",
    "options": ["bcca", "cbab", "cbba", "aabc"],
    "correctIndex": 1,
    "explanation": "The series is aabcbba / aabcbba / aabcbba. Thus, the pattern aabcbba is repeated."
  },
  {
    "id": 11,
    "type": "text",
    "prompt": "Choose the correct alternative: _ aba _ cabc _ dcba _ bab _ a",
    "options": ["abdca", "bcadc", "abcdd", "cbdaa"],
    "correctIndex": 0,
    "explanation": "The series is aababcaddcbacbabaa. Thus, the letters equidistant from the beginning and the end of the series are the same."
  },
  {
    "id": 12,
    "type": "text",
    "prompt": "Choose the correct alternative: a _ cdaab _ cc _ daa _ bbb _ ccddd",
    "options": ["bdbda", "bddca", "dbbca", "bbdac"],
    "correctIndex": 3,
    "explanation": "The series is abcd / aabb ccdd / aaa bbb ccc ddd. Thus, each letter of first sequence is repeated two times in the second sequence and three times in the third sequence."
  },
  {
    "id": 13,
    "type": "text",
    "prompt": "Choose the correct alternative: a _ abbb _ ccccd _ ddccc _ bb _ ba",
    "options": ["abcda", "abdbc", "abdcb", "abcad"],
    "correctIndex": 2,
    "explanation": "The series is aaa / bbbb / cccc / dddd / cccc / bbbb / a."
  },
  {
    "id": 14,
    "type": "text",
    "prompt": "Choose the correct alternative: _ bcdbc _ dcabd _ bcdbc _ dc _ bd",
    "options": ["aaaaa", "ccccc", "bbbbb", "ddddd"],
    "correctIndex": 0,
    "explanation": "The series is abcd / bcad / cabd / abcd / bcad / cabd. Thus, the pattern abcd / bcad / cabd is repeated twice."
  },
  {
    "id": 15,
    "type": "text",
    "prompt": "Choose the correct alternative: adb _ ac _ da _ cddcb _ dbc _ cbda",
    "options": ["bccba", "cbbaa", "ccbba", "bbcad"],
    "correctIndex": 1,
    "explanation": "The series is adbcacbdabcdcbadbcacbda. The letters equidistant from the beginning and the end of the series are the same."
  },
  {
    "id": 16,
    "type": "text",
    "prompt": "Choose the correct alternative: _ aaba _ bba _ bba _ abaa _ b",
    "options": ["aabab", "ababa", "baaba", "bbaba"],
    "correctIndex": 0,
    "explanation": "The series is aaab / aabb / abbb / aaab / aabb."
  },
  {
    "id": 17,
    "type": "text",
    "prompt": "Choose the correct alternative: ab _ bbc _ c _ ab _ ab _ b",
    "options": ["ccaac", "cbabc", "cacac", "bccab"],
    "correctIndex": 2,
    "explanation": "The series is abc / b / bca / c / cab / a / abc / b."
  },
  {
    "id": 18,
    "type": "text",
    "prompt": "Choose the correct alternative: _ bca _ cca _ ca _ b _ c",
    "options": ["aaaaa", "bbbab", "aabaa", "bbabb"],
    "correctIndex": 1,
    "explanation": "The series is bbca / bcca / bcaa / bbc."
  },
  {
    "id": 19,
    "type": "text",
    "prompt": "Choose the correct alternative: b _ ac _ cc _ cb _ ab _ ac",
    "options": ["cbaba", "bbaac", "abbbc", "aabba"],
    "correctIndex": 3,
    "explanation": "The series is baac / accb / cbba / baac."
  },
  {
    "id": 20,
    "type": "text",
    "prompt": "Choose the correct alternative: c _ ac _ aa _ aa _ bc _ bcc",
    "options": ["cabba", "ccbbb", "bbbbb", "cbacb"],
    "correctIndex": 1,
    "explanation": "The series is ccacc / aabaa / bbcbb / cc."
  }
]

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test14'] = examples
data['quantitativeReasoningTests']['part2_secA_test14'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test14 with 1 example and 20 questions to quantitativeReasoning.json')
