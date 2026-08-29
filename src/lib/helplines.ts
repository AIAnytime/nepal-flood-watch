/**
 * Nepal's national short codes. These are dialled without an area code from any
 * Nepali mobile or landline and are free. Verified against Nepal Police, the
 * National Emergency Operation Centre and published emergency-number listings.
 */
export type Helpline = {
  id: string;
  number: string;
  label: string;
  labelNe: string;
  labelHi: string;
  note: string;
  noteNe: string;
  noteHi: string;
  priority: boolean;
};

export const HELPLINES: Helpline[] = [
  {
    id: "neoc",
    number: "1149",
    label: "National Emergency Operation Centre",
    labelNe: "राष्ट्रिय आपत्कालीन कार्य सञ्चालन केन्द्र",
    labelHi: "राष्ट्रीय आपातकालीन संचालन केंद्र",
    note: "Disaster hotline — floods, landslides, rescue coordination",
    noteNe: "विपद् हटलाइन — बाढी, पहिरो, उद्धार समन्वय",
    noteHi: "आपदा हॉटलाइन — बाढ़, भूस्खलन, बचाव समन्वय",
    priority: true,
  },
  {
    id: "police",
    number: "100",
    label: "Nepal Police",
    labelNe: "नेपाल प्रहरी",
    labelHi: "नेपाल पुलिस",
    note: "Any emergency, missing persons, immediate danger",
    noteNe: "कुनै पनि आपतकाल, बेपत्ता व्यक्ति, तत्काल खतरा",
    noteHi: "कोई भी आपात स्थिति, लापता व्यक्ति, तत्काल ख़तरा",
    priority: true,
  },
  {
    id: "ambulance",
    number: "102",
    label: "Ambulance",
    labelNe: "एम्बुलेन्स",
    labelHi: "एम्बुलेंस",
    note: "Medical emergency and casualty transport",
    noteNe: "आकस्मिक उपचार र घाइते ओसारपसार",
    noteHi: "चिकित्सा आपात और घायल परिवहन",
    priority: true,
  },
  {
    id: "fire",
    number: "101",
    label: "Fire Brigade",
    labelNe: "दमकल",
    labelHi: "अग्निशमन",
    note: "Fire and technical rescue",
    noteNe: "आगलागी र प्राविधिक उद्धार",
    noteHi: "आग और तकनीकी बचाव",
    priority: false,
  },
  {
    id: "traffic",
    number: "103",
    label: "Traffic Police",
    labelNe: "ट्राफिक प्रहरी",
    labelHi: "यातायात पुलिस",
    note: "Road blockages, highway conditions, detours",
    noteNe: "सडक अवरोध, राजमार्गको अवस्था, वैकल्पिक बाटो",
    noteHi: "सड़क अवरोध, राजमार्ग की स्थिति, वैकल्पिक मार्ग",
    priority: false,
  },
  {
    id: "tourist",
    number: "1144",
    label: "Tourist Police",
    labelNe: "पर्यटक प्रहरी",
    labelHi: "पर्यटक पुलिस",
    note: "Help for foreign nationals and trekkers",
    noteNe: "विदेशी नागरिक र पदयात्रीका लागि सहयोग",
    noteHi: "विदेशी नागरिकों और ट्रेकर्स के लिए मदद",
    priority: false,
  },
  {
    id: "child",
    number: "1098",
    label: "Child Helpline",
    labelNe: "बाल हेल्पलाइन",
    labelHi: "बाल हेल्पलाइन",
    note: "Separated, unaccompanied or at-risk children",
    noteNe: "छुट्टिएका, एक्लै वा जोखिममा रहेका बालबालिका",
    noteHi: "बिछड़े, अकेले या जोखिम में बच्चे",
    priority: false,
  },
  {
    id: "women",
    number: "1145",
    label: "Women's Helpline",
    labelNe: "महिला हेल्पलाइन",
    labelHi: "महिला हेल्पलाइन",
    note: "Support and protection for women and girls",
    noteNe: "महिला तथा किशोरीका लागि सहयोग र संरक्षण",
    noteHi: "महिलाओं और लड़कियों के लिए सहायता व सुरक्षा",
    priority: false,
  },
];

export type ReliefOrg = {
  name: string;
  what: string;
  whatNe: string;
  whatHi: string;
  url: string;
};

export const RELIEF_ORGS: ReliefOrg[] = [
  { name: "Nepal Red Cross Society", what: "Search & rescue, first aid, family tracing", whatNe: "खोज र उद्धार, प्राथमिक उपचार, परिवार खोजी", whatHi: "खोज व बचाव, प्राथमिक उपचार, परिवार खोज", url: "https://nrcs.org/" },
  { name: "NDRRMA (Govt. of Nepal)", what: "National disaster authority — official bulletins", whatNe: "राष्ट्रिय विपद् प्राधिकरण — आधिकारिक विज्ञप्ति", whatHi: "राष्ट्रीय आपदा प्राधिकरण — आधिकारिक बुलेटिन", url: "https://ndrrma.gov.np/" },
  { name: "BIPAD Portal", what: "Government disaster information portal", whatNe: "सरकारी विपद् सूचना पोर्टल", whatHi: "सरकारी आपदा सूचना पोर्टल", url: "https://bipadportal.gov.np/" },
  { name: "DHM Nepal", what: "Official river levels and weather warnings", whatNe: "आधिकारिक नदी सतह र मौसम चेतावनी", whatHi: "आधिकारिक नदी स्तर और मौसम चेतावनी", url: "https://www.dhm.gov.np/" },
  { name: "UNICEF Nepal", what: "Child protection, water and sanitation", whatNe: "बाल संरक्षण, खानेपानी र सरसफाइ", whatHi: "बाल संरक्षण, जल एवं स्वच्छता", url: "https://www.unicef.org/nepal/" },
  { name: "OCHA / ReliefWeb", what: "Humanitarian situation reports", whatNe: "मानवीय अवस्था प्रतिवेदन", whatHi: "मानवीय स्थिति रिपोर्ट", url: "https://reliefweb.int/country/npl" },
];
