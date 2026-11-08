import fs from 'fs';
import path from 'path';

const vocab = [
  // --- A (30 words) ---
  {
    id: "abandon_1",
    word: "Abandon",
    translation: "לנטוש, לעזוב",
    letter: "A",
    exampleSentence: "The captain ordered the crew to abandon the sinking vessel."
  },
  {
    id: "abolish_1",
    word: "Abolish",
    translation: "לבטל (חוק, נוהג)",
    letter: "A",
    exampleSentence: "Parliament voted to abolish the outdated taxation law."
  },
  {
    id: "abundant_1",
    word: "Abundant",
    translation: "שופע, מלא, גדוש",
    letter: "A",
    exampleSentence: "The region is blessed with abundant natural water resources."
  },
  {
    id: "accomplish_1",
    word: "Accomplish",
    translation: "להשיג, להשלים, לבצע",
    letter: "A",
    exampleSentence: "She worked tirelessly to accomplish her academic goals."
  },
  {
    id: "accumulate_1",
    word: "Accumulate",
    translation: "לצבור, לאגור",
    letter: "A",
    exampleSentence: "Dust began to accumulate on the unused furniture."
  },
  {
    id: "adjacent_1",
    word: "Adjacent",
    translation: "סמוך, צמוד",
    letter: "A",
    exampleSentence: "The hotel is adjacent to the central railway station."
  },
  {
    id: "advocate_1",
    word: "Advocate",
    translation: "לסנגר, לתמוך ; תומך",
    letter: "A",
    exampleSentence: "She is a passionate advocate for environmental protection."
  },
  {
    id: "ambiguous_1",
    word: "Ambiguous",
    translation: "דו-משמעי, מעורפל",
    letter: "A",
    exampleSentence: "His ambiguous reply left everyone wondering what he meant."
  },
  {
    id: "amend_1",
    word: "Amend",
    translation: "לתקן, לשנות לטובה",
    letter: "A",
    exampleSentence: "Lawmakers proposed to amend the existing constitution."
  },
  {
    id: "anticipate_1",
    word: "Anticipate",
    translation: "לצפות מראש, להקדים",
    letter: "A",
    exampleSentence: "Economists anticipate a surge in consumer spending."
  },
  {
    id: "approximate_1",
    word: "Approximate",
    translation: "משוער ; להעריך בקירוב",
    letter: "A",
    exampleSentence: "The approximate cost of the repair was five hundred dollars."
  },
  {
    id: "arbitrary_1",
    word: "Arbitrary",
    translation: "שרירותי, מקרי",
    letter: "A",
    exampleSentence: "The rules seemed entirely arbitrary and without clear rationale."
  },
  {
    id: "ascertain_1",
    word: "Ascertain",
    translation: "לוודא, לברר",
    letter: "A",
    exampleSentence: "The inspector arrived to ascertain the cause of the delay."
  },
  {
    id: "aspect_1",
    word: "Aspect",
    translation: "היבט, פן",
    letter: "A",
    exampleSentence: "We must evaluate every aspect of the project before proceeding."
  },
  {
    id: "assert_1",
    word: "Assert",
    translation: "לטעון בתוקף, לעמוד על",
    letter: "A",
    exampleSentence: "He continued to assert his innocence throughout the trial."
  },
  {
    id: "assess_1",
    word: "Assess",
    translation: "להעריך, לאמוד",
    letter: "A",
    exampleSentence: "Technicians were sent to assess the structural damage."
  },
  {
    id: "attribute_1",
    word: "Attribute",
    translation: "לייחס ל- ; תכונה",
    letter: "A",
    exampleSentence: "They attribute their business success to hard teamwork."
  },
  {
    id: "authorize_1",
    word: "Authorize",
    translation: "להרשות, להסמיך, לאשר",
    letter: "A",
    exampleSentence: "Only senior management can authorize expenditures of this size."
  },
  {
    id: "autonomous_1",
    word: "Autonomous",
    translation: "אוטונומי, עצמאי",
    letter: "A",
    exampleSentence: "The laboratory operates as an autonomous research unit."
  },
  {
    id: "avid_1",
    word: "Avid",
    translation: "נלהב, להוט",
    letter: "A",
    exampleSentence: "She is an avid reader of historical biographies."
  },
  {
    id: "adhere_1",
    word: "Adhere",
    translation: "לדבוק ב-, לציית ל-",
    letter: "A",
    exampleSentence: "Athletes are required to adhere strictly to anti-doping regulations."
  },
  {
    id: "adverse_1",
    word: "Adverse",
    translation: "שלילי, מנוגד, מזיק",
    letter: "A",
    exampleSentence: "The medication produced few adverse side effects."
  },
  {
    id: "affluent_1",
    word: "Affluent",
    translation: "אמיד, עשיר",
    letter: "A",
    exampleSentence: "The university is located in an affluent residential suburb."
  },
  {
    id: "agitate_1",
    word: "Agitate",
    translation: "להסעיר, להרגיז, לנער",
    letter: "A",
    exampleSentence: "The speech was designed to agitate the crowd against corruption."
  },
  {
    id: "alleviate_1",
    word: "Alleviate",
    translation: "להקל, לשכך, למתן",
    letter: "A",
    exampleSentence: "Regular stretching helps alleviate lower back pain."
  },
  {
    id: "allocate_1",
    word: "Allocate",
    translation: "להקצות, לייעד",
    letter: "A",
    exampleSentence: "The council decided to allocate additional funds to education."
  },
  {
    id: "alter_1",
    word: "Alter",
    translation: "לשנות, להתאים",
    letter: "A",
    exampleSentence: "You may need to alter your travel schedule due to weather warnings."
  },
  {
    id: "apparent_1",
    word: "Apparent",
    translation: "גלוי, ברור ; לכאורה",
    letter: "A",
    exampleSentence: "It became apparent that the original strategy had failed."
  },
  {
    id: "appraise_1",
    word: "Appraise",
    translation: "להעריך (שווי או איכות)",
    letter: "A",
    exampleSentence: "An expert was hired to appraise the rare antique painting."
  },
  {
    id: "aptitude_1",
    word: "Aptitude",
    translation: "נטייה, כישרון טבעי",
    letter: "A",
    exampleSentence: "She demonstrated a remarkable aptitude for mathematics at an early age."
  },

  // --- B (30 words) ---
  {
    id: "barren_1",
    word: "Barren",
    translation: "עקר, צחיח, שומם",
    letter: "B",
    exampleSentence: "Few plants can survive in the dry, barren desert landscape."
  },
  {
    id: "belligerent_1",
    word: "Belligerent",
    translation: "לוחמני, תוקפני",
    letter: "B",
    exampleSentence: "The belligerent customer refused to calm down and demanded a refund."
  },
  {
    id: "benevolent_1",
    word: "Benevolent",
    translation: "רוחש טוב, נדיב",
    letter: "B",
    exampleSentence: "A benevolent benefactor funded the children's community center."
  },
  {
    id: "benign_1",
    word: "Benign",
    translation: "שפיר, עדין, לא מזיק",
    letter: "B",
    exampleSentence: "The doctor reassured her that the growth was entirely benign."
  },
  {
    id: "bias_1",
    word: "Bias",
    translation: "הטיה, דעה קדומה",
    letter: "B",
    exampleSentence: "Researchers must avoid any personal bias in their survey questions."
  },
  {
    id: "breach_1",
    word: "Breach",
    translation: "הפרה (חוזה/חוק), פירצה",
    letter: "B",
    exampleSentence: "Sharing user passwords constitutes a severe breach of security."
  },
  {
    id: "brief_1",
    word: "Brief",
    translation: "קצר, תמציתי",
    letter: "B",
    exampleSentence: "The minister gave a brief statement before answering questions."
  },
  {
    id: "bulk_1",
    word: "Bulk",
    translation: "מרבית, רוב ; נפח",
    letter: "B",
    exampleSentence: "The bulk of the university budget is allocated to research."
  },
  {
    id: "banish_1",
    word: "Banish",
    translation: "לגרש, להגלות",
    letter: "B",
    exampleSentence: "The rebel leader was banished to a remote island."
  },
  {
    id: "barrier_1",
    word: "Barrier",
    translation: "מחסום, מכשול",
    letter: "B",
    exampleSentence: "Financial difficulties should not become a barrier to education."
  },
  {
    id: "baffle_1",
    word: "Baffle",
    translation: "לבלבל, להביך, לסבך",
    letter: "B",
    exampleSentence: "The strange radio signals continued to baffle astronomers."
  },
  {
    id: "belittle_1",
    word: "Belittle",
    translation: "להמעיט בערכו של, לזלזל",
    letter: "B",
    exampleSentence: "Do not belittle your own achievements when comparing yourself to others."
  },
  {
    id: "bewilder_1",
    word: "Bewilder",
    translation: "לבלבל לחלוטין, להדהים",
    letter: "B",
    exampleSentence: "The intricate maze of rules bewildered all newcomers."
  },
  {
    id: "blatant_1",
    word: "Blatant",
    translation: "בוטה, גס, זועק לשמיים",
    letter: "B",
    exampleSentence: "His refusal to cooperate was a blatant display of disrespect."
  },
  {
    id: "bleak_1",
    word: "Bleak",
    translation: "עגום, קודר, קר",
    letter: "B",
    exampleSentence: "The economic forecast looks bleak in the wake of the crisis."
  },
  {
    id: "bolster_1",
    word: "Bolster",
    translation: "לחזק, לתמוך",
    letter: "B",
    exampleSentence: "New scientific findings bolstered their central argument."
  },
  {
    id: "bond_1",
    word: "Bond",
    translation: "קשר, חיבור ; אגרת חוב",
    letter: "B",
    exampleSentence: "A strong bond of trust formed between the rescue workers."
  },
  {
    id: "boom_1",
    word: "Boom",
    translation: "שגשוג פתאומי, פריחה",
    letter: "B",
    exampleSentence: "The renewable energy industry experienced an unprecedented boom."
  },
  {
    id: "boon_1",
    word: "Boon",
    translation: "ברכה, תועלת רבה",
    letter: "B",
    exampleSentence: "The new highway was a major boon for daily commuters."
  },
  {
    id: "bound_1",
    word: "Bound",
    translation: "כבול, מחויב ; כיוונו מועד",
    letter: "B",
    exampleSentence: "Physicians are bound by medical confidentiality laws."
  },
  {
    id: "boycott_1",
    word: "Boycott",
    translation: "להחרים ; חרם",
    letter: "B",
    exampleSentence: "Environmental groups urged shoppers to boycott single-use plastics."
  },
  {
    id: "bribe_1",
    word: "Bribe",
    translation: "לשחד ; שוחד",
    letter: "B",
    exampleSentence: "The judge was accused of accepting a substantial bribe."
  },
  {
    id: "brink_1",
    word: "Brink",
    translation: "סף, קצה תהום",
    letter: "B",
    exampleSentence: "The prolonged strike brought the company to the brink of bankruptcy."
  },
  {
    id: "brittle_1",
    word: "Brittle",
    translation: "שביר, פריך",
    letter: "B",
    exampleSentence: "Freezing weather made the plastic tubing rigid and brittle."
  },
  {
    id: "broad_1",
    word: "Broad",
    translation: "רחב, מקיף",
    letter: "B",
    exampleSentence: "The committee conducted a broad review of public health policies."
  },
  {
    id: "burden_1",
    word: "Burden",
    translation: "מעמסה, נטל",
    letter: "B",
    exampleSentence: "Taking on caretaking responsibilities placed a heavy burden on him."
  },
  {
    id: "bustle_1",
    word: "Bustle",
    translation: "המולה, התרוצצות נמרצת",
    letter: "B",
    exampleSentence: "The bustling market was filled with colorful spices and loud traders."
  },
  {
    id: "bystander_1",
    word: "Bystander",
    translation: "צופה מהצד, עובר אורח",
    letter: "B",
    exampleSentence: "An alert bystander called the emergency hotline immediately."
  },
  {
    id: "bizarre_1",
    word: "Bizarre",
    translation: "מוזר, חריג ביותר",
    letter: "B",
    exampleSentence: "She wore a bizarre outfit that drew stares from everyone."
  },
  {
    id: "blunder_1",
    word: "Blunder",
    translation: "משגה חמור, פליטת פה",
    letter: "B",
    exampleSentence: "A tactical blunder by the goalkeeper cost the team the championship."
  }
];

export default vocab;

