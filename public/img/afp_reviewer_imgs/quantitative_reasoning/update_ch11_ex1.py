import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quantitativeReasoning.json')

directions = (
    "Directions: In each of the following questions, two statements are given: Assertion (A) and Reason (R). "
    "Select the correct option from the following choices:\n\n"
    "(a) Both (A) and (R) are individually true and (R) is the correct explanation of (A).\n"
    "(b) Both (A) and (R) are individually true, but (R) is not the correct explanation of (A).\n"
    "(c) (A) is true but (R) is false.\n"
    "(d) (A) is false but (R) is true."
)

options_list = [
    "Both (A) and (R) are individually true and (R) is the correct explanation of (A).",
    "Both (A) and (R) are individually true, but (R) is not the correct explanation of (A).",
    "(A) is true but (R) is false.",
    "(A) is false but (R) is true."
]

raw_data = [
    (1, "The same face of the Moon is always presented to the Earth.", "The moon rotates about its own axis in 23 1/2 days which is about the same time that it takes to orbit the earth.", 2, "(A) is true because the Moon presents the same face to Earth, but the stated period of rotation in (R) is inaccurate. Thus, (A) is true but (R) is false."),
    (2, "Existence of human life on Venus is highly improbable.", "Venus has extremely high level of CO2 in its atmosphere.", 1, "Both (A) and (R) are true. Venus has a thick carbon dioxide atmosphere causing severe greenhouse effects, though extreme temperature and pressure are also primary reasons."),
    (3, "All the proteins in our food are digested in small intestine only.", "The protein-digesting enzymes from pancreas are released into small intestine.", 1, "Both (A) and (R) are individually true. Pancreatic enzymes digest proteins in the small intestine."),
    (4, "Amoeba reproduces by fission.", "All unicellular organisms reproduce by asexual methods.", 2, "(A) is true as Amoeba reproduces by binary fission. (R) is false because some unicellular organisms also undergo sexual processes."),
    (5, "Bangalore receives much higher annual rainfall than that of Mangalore.", "Bangalore has the benefit of receiving rainfall both from south-west and north-east monsoons.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (6, "The Central Rural Sanitation Programme was launched in 1986 to improve the quality of life of rural people in India.", "The rural sanitation is a subject in the concurrent list in the constitution of India.", 2, "(A) is true (launched in 1986). (R) is false because sanitation is a State subject in the Indian Constitution, not Concurrent list."),
    (7, "The west flowing rivers of peninsular India have no deltas.", "These rivers do not carry any alluvial sediments.", 1, "Both (A) and (R) are individually true."),
    (8, "The thickness of the atmosphere is maximum over the equator.", "High insolation and strong convection currents occur over the equator.", 1, "Both (A) and (R) are individually true."),
    (9, "In our houses, the current in AC electricity line changes directions 50 times per second.", "The frequency of alternating voltage supplied is 50 Hz.", 0, "Both (A) and (R) are true and (R) correctly explains the frequency of AC supply."),
    (10, "Fatty acids should be a part of the balanced human diet.", "The cells of the human body can't synthesize any fatty acids.", 2, "(A) is true because essential fatty acids are required in the diet. (R) is false because human cells can synthesize non-essential fatty acids."),
    (11, "India does not export natural rubber.", "About 97% of India's demand for natural rubber is met from domestic production.", 0, "Both (A) and (R) are true and (R) correctly explains that domestic demand consumes domestic production."),
    (12, "For the first time, India had no trade deficit in the year 2002-03.", "For the first time, India's exports crossed $50 billion in the year 2002-03.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (13, "To dilute sulphuric acid, acid is added to water and not water to acid.", "Specific heat of water is quite large.", 0, "Both (A) and (R) are true. High specific heat of water absorbs heat safely during dilution."),
    (14, "Devaluation of currency may promote export.", "The price of the country's product in the international market may fall due to devaluation.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (15, "The fiscal deficit is greater than the budgetary deficit.", "The fiscal deficit is the borrowing from RBI plus other liabilities of government to meet its expenditure.", 0, "Both (A) and (R) are true and (R) explains why fiscal deficit encompasses total government borrowings."),
    (16, "According to statistics, more female children are born each year than male children in India.", "In India, the death rate of male child is higher than that of the female child.", 2, "(A) is true in general biological statistics, but (R) is false."),
    (17, "Insect resistant transgenic cotton has been produced by inserting Bt gene.", "The Bt gene is derived from a bacterium.", 0, "Both (A) and (R) are true. The Bt gene comes from Bacillus thuringiensis."),
    (18, "Information technology is fast becoming a very important field of activity in India.", "Software is one of the major exports of the country and India has a very strong base in hardware.", 0, "Both (A) and (R) are individually true."),
    (19, "Chile continues to be an important producer of copper in the world.", "Chile is endowed with the world's largest deposit of porphyry copper.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (20, "Dolly was the first cloned mammal.", "Dolly was produced by in-vitro fertilization.", 1, "(A) is true (Dolly was the first cloned mammal). (R) is false/unrelated as Dolly was produced by nuclear transfer."),
    (21, "During the time of Akbar, for every ten cavalrymen, the mansabdars had to maintain twenty horses.", "Horses had to be rested while on march and replacements were necessary in times of war.", 3, "(A) is false (du-aspa system was introduced later by Jahangir), while (R) is true."),
    (22, "Lord Linlithgow described the August Movement of 1942 as the most serious rebellion since the Sepoy Mutiny.", "There was massive upsurge of the peasantry in certain areas.", 0, "Both (A) and (R) are true and (R) explains the intensity of the Quit India movement."),
    (23, "The Gandhara School of Art bears the mark of Hellenistic influence.", "Hinayana form was influenced by that art.", 2, "(A) is true (Gandhara art shows Greek influence). (R) is false (Mahayana form was influenced by Gandhara art, not Hinayana)."),
    (24, "Formic acid is a stronger acid than acetic acid.", "Formic acid is an organic acid.", 1, "Both (A) and (R) are true, but being an organic acid is not the reason Formic acid is stronger than acetic acid."),
    (25, "At first the Turkish administration in India was essentially military.", "The country was parcelled out as Iqtas among leading military leaders.", 1, "Both (A) and (R) are individually true."),
    (26, "According to Asoka's edicts social harmony among the people was more important than religious devotion.", "He spreaded ideas of equity instead of promotion of religion.", 1, "Both (A) and (R) are individually true."),
    (27, "The temperature of a metal wire rises when an electric current is passed through it.", "Collision of metal atoms with each other releases heat energy.", 1, "Both (A) and (R) are individually true."),
    (28, "The Khilafat movement did bring the urban Muslims into the fold of the National Movement.", "There was a predominant element of anti-imperialism in both the National and Khilafat Movement.", 3, "(A) is false and (R) is true."),
    (29, "Phenyl is used as a household germicide.", "Phenyl is a phenol derivative and phenol is an effective germicide.", 2, "(A) is true but (R) is false."),
    (30, "Partition of Bengal in 1905 brought to an end the Moderate's role in the Indian Freedom Movement.", "The Surat session of Indian National Congress separated the Extremists from the Moderates.", 3, "(A) is false (Moderates continued after 1905), (R) is true (Surat split occurred in 1907)."),
    (31, "The first ever bill to make primary education compulsory in India was rejected in 1911.", "Discontent would have increased if everybody could read.", 1, "Both (A) and (R) are individually true."),
    (32, "Sodium metal is stored under kerosene.", "Metallic sodium melts when exposed to air.", 0, "Both (A) and (R) are true and (R) is the explanation."),
    (33, "The congress rejected the Cripps proposals.", "The Cripps Mission consisted solely of the whites.", 1, "Both (A) and (R) are individually true."),
    (34, "The United States of America has threatened to ask the World Trade Organisation (WTO) to apply sanctions against the developing countries for the non-observance of ILO conventions.", "The United States of America itself has adopted and implemented those ILO conventions.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (35, "During the reign of Shahjahan, Dara Shikoh was sent on an expedition to Balkha, Badakhshan and Qandahar.", "The expedition sent by Shahjahan to the Middle-east was a marvellous success.", 2, "(A) is true, (R) is false (the expedition was a failure)."),
    (36, "Gandhi stopped the Non-Co-operation movement in 1922.", "Violence at Chauri Chaura led him to stop the movement.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (37, "The reservation of thirty-three per cent of seats for women in Parliament and State Legislatures does not require constitutional amendment.", "Political parties contesting elections can allocate thirty-three per cent of seats they contest to women candidates without any constitutional amendment.", 3, "(A) is false (reservation of seats requires constitutional amendment), (R) is true."),
    (38, "Wilful disobedience or non-compliance of court orders and use of derogatory language about judicial behaviour amount to contempt of court.", "Judicial activism can't be practised without arming the judiciary with punitive powers to punish contemptuous behaviour.", 1, "Both (A) and (R) are individually true."),
    (39, "The emergence of economic globalisation does not imply the decline of socialist ideology.", "The ideology of socialism believes universalism and globalism.", 1, "Both (A) and (R) are individually true."),
    (40, "A diamond sparkles more than a glass imitation cut to the same shape.", "The refractive index of diamond is less than that of glass.", 2, "(A) is true (due to total internal reflection), (R) is false (refractive index of diamond 2.42 is higher than glass 1.5)."),
    (41, "The monsoonal rainfall decreases as one goes towards the west and north-west in the Ganga plain.", "The moisture bearing monsoonal winds go higher up as one moves up in the Ganga plain.", 0, "Both (A) and (R) are true and (R) is the correct explanation."),
    (42, "A lock of Einstein's hair, if scientists could locate it and extract its DNA, could help in producing another Einstein, by cloning.", "The DNA extracted from the cell of an embryo at an early stage of development can be transferred to individual eggs which in turn can be implanted into the uterus of a surrogate mother to give birth to an identical offspring.", 2, "(A) is true, (R) is false."),
    (43, "The USA re-emerged as India's single largest import source in the early nineties.", "With swift political developments in the erstwhile Soviet Union, India gradually began to rely on the USA for its defence requirement.", 1, "Both (A) and (R) are individually true."),
    (44, "In India, the political parties which formed the governments represented the majority of seats secured in the elections to the House of the people at the centre and the Legislative Assemblies in the states but not the majority of votes.", "The elections based on the majority-vote-system decides the result on the basis of relative majority of votes secured.", 1, "Both (A) and (R) are individually true."),
    (45, "A mixture of salt and ice gives temperature below 0°C.", "The salt raises the freezing point of ice.", 0, "Both (A) and (R) are individually true."),
    (46, "Hong Kong is to revert to China from British control in a few years.", "The people of Hong Kong have opted for it in a referendum.", 2, "(A) is true (reverted in 1997). (R) is false (reversion was based on Sino-British treaty, not a referendum)."),
    (47, "Babur wrote his memoirs in Turki.", "Turki was the official language of the Mughal Court.", 2, "(A) is true (Tuzk-e-Babri in Turki). (R) is false (Persian was the official language of Mughal court)."),
    (48, "Minimum wages in India are fixed in accordance with the levels of living and the labour participation ratios.", "All workers covered by the Minimum Wages Acts are above the poverty line.", 2, "(A) is true. (R) is false."),
    (49, "Italy, Switzerland, Sweden and Norway have abundant power resources.", "They have the largest coal deposits in Europe.", 2, "(A) is true (abundant hydroelectric power). (R) is false (they rely on hydro power, not large coal deposits)."),
    (50, "The Quit India movement marked the culmination of Indian national movement.", "After the Quit India movement it was matter of time to find a suitable mechanisms for transfer of power.", 3, "(A) is false and (R) is true."),
    (51, "The form of government in Rigvedic period was monarchy.", "Priest enjoyed both social and political status and influenced administration.", 1, "Both (A) and (R) are individually true."),
    (52, "Rainfall is scanty on east of western ghats.", "The east of western ghats is on the lee side.", 0, "Both (A) and (R) are true and (R) correctly explains the rain-shadow (lee) effect."),
    (53, "Insects are not affected by pesticides.", "Insects are killed by pesticides.", 3, "(A) is false (insects are affected). (R) is true (pesticides kill insects)."),
    (54, "The finance commission aims at safeguarding the fiscal autonomy of the states.", "The finance commission is constituted every fifth year.", 1, "Both (A) and (R) are individually true."),
    (55, "Soap removes oil and dirt.", "Soap increases the surface tension of water.", 0, "Both (A) and (R) are true and (R) is the explanation."),
    (56, "Red phosphorus is used in matchsticks.", "Red phosphorus is less dangerous compared to the white one.", 0, "Both (A) and (R) are true and (R) explains why red phosphorus is used."),
    (57, "Earthworm is a friend to the man.", "It decreases the soil erosion.", 2, "(A) is true (earthworms aerate soil and produce humus). (R) is false."),
    (58, "Dry battery can't be recharged.", "The chemical reaction is reversible.", 2, "(A) is true (primary cells cannot be recharged). (R) is false (chemical reaction is irreversible)."),
    (59, "India adopted UK's Parliamentary system.", "The Upper House has judicial power.", 2, "(A) is true. (R) is false (Rajya Sabha does not have judicial power)."),
    (60, "Colonialism has started in India during the 19th century.", "Industrial revolution demanded market places.", 0, "Both (A) and (R) are true and (R) correctly explains why industrial powers established colonies.")
]

examples = []
for qid, assertion, reason, correct_idx, expl in raw_data[:3]:
    prompt_str = (
        f"{directions}\n\n"
        f"Assertion (A): {assertion}\n"
        f"Reason (R): {reason}"
    )
    examples.append({
        "id": qid,
        "type": "text",
        "prompt": prompt_str,
        "options": options_list,
        "correctIndex": correct_idx,
        "explanation": expl
    })

questions = []
for qid, assertion, reason, correct_idx, expl in raw_data:
    prompt_str = (
        f"{directions}\n\n"
        f"Assertion (A): {assertion}\n"
        f"Reason (R): {reason}"
    )
    questions.append({
        "id": qid,
        "type": "text",
        "prompt": prompt_str,
        "options": options_list,
        "correctIndex": correct_idx,
        "explanation": expl
    })

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

if 'quantitativeReasoningExamples' not in data:
    data['quantitativeReasoningExamples'] = {}

if 'quantitativeReasoningTests' not in data:
    data['quantitativeReasoningTests'] = {}

data['quantitativeReasoningExamples']['part2_secA_test29'] = examples
data['quantitativeReasoningTests']['part2_secA_test29'] = questions

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Successfully added part2_secA_test29 to quantitativeReasoning.json')
