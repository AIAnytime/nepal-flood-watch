import type { Locale } from "./i18n";

/**
 * Search and answer-engine surface.
 *
 * Two deliberate choices here:
 *
 * 1. Nothing is hidden. Hidden keyword text is treated as cloaking under Google's
 *    spam policies and risks a manual action — it would cost this site the ranking
 *    it is trying to win. Every keyword below appears in copy people actually read,
 *    or in structured data, which is the legitimate machine-readable layer.
 *
 * 2. The FAQ answers are written to be *extractable*: a direct factual sentence
 *    first, qualifiers after. Answer engines and AI summarisers quote the opening
 *    clause, so the opening clause has to stand alone and be true on its own.
 */

export const SITE = {
  name: "Nepal Flood Watch",
  /** Overridden at build time on Vercel; see metadataBase in the layout. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nepal-flood-watch.vercel.app",
  author: "AI Anytime",
  authorUrl: "https://github.com/AIAnytime",
  youtube: "https://www.youtube.com/@AIAnytime",
  github: "https://github.com/AIAnytime",
} as const;

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en",
  ne: "ne-NP",
  hi: "hi-IN",
};

/** Path for a locale. English is the root so the primary URL stays clean. */
export function localePath(locale: Locale): string {
  return locale === "en" ? "/" : `/${locale}`;
}

export function localeUrl(locale: Locale): string {
  return locale === "en" ? SITE.url : `${SITE.url}/${locale}`;
}

type Meta = {
  title: string;
  description: string;
  keywords: string[];
};

export const META: Record<Locale, Meta> = {
  en: {
    title: "Nepal Flood Watch — live Bhotekoshi & Trishuli flood tracker",
    description:
      "Live flood monitoring for Nepal after the 26 August 2026 Bhotekoshi disaster: river levels for Rasuwa, Nuwakot and every major basin, rainfall forecasts, cross-checked news, verified emergency numbers and a public help board. Free, no login, in English, Nepali and Hindi.",
    keywords: [
      "Nepal flood",
      "Nepal flood 2026",
      "Bhotekoshi flood",
      "Trishuli river flood",
      "Rasuwa flood",
      "Nuwakot flood",
      "Nepal flood news today",
      "Nepal flood death toll",
      "Nepal missing persons flood",
      "Langtang glacier collapse",
      "landslide dam lake Nepal",
      "Nepal river level today",
      "Nepal monsoon flood warning",
      "Nepal emergency number 1149",
      "Nepal flood relief",
      "Nepal flood helpline",
      "GLOF Nepal",
      "Nepal disaster tracker",
    ],
  },
  ne: {
    title: "नेपाल बाढी निगरानी — भोटेकोशी र त्रिशूली बाढीको प्रत्यक्ष जानकारी",
    description:
      "२६ अगस्ट २०२६ को भोटेकोशी विपद्पछि नेपालको प्रत्यक्ष बाढी निगरानी: रसुवा, नुवाकोट र सबै प्रमुख नदी बेसिनको सतह, वर्षा पूर्वानुमान, प्रमाणित समाचार, आपतकालीन नम्बर र सार्वजनिक सहयोग बोर्ड। निःशुल्क, लगइन नचाहिने, नेपाली, हिन्दी र अंग्रेजीमा।",
    keywords: [
      "नेपाल बाढी",
      "भोटेकोशी बाढी",
      "त्रिशूली बाढी",
      "रसुवा बाढी",
      "नुवाकोट बाढी",
      "नेपाल बाढी समाचार",
      "बाढी बेपत्ता",
      "पहिरो ताल",
      "नदी सतह नेपाल",
      "आपतकालीन नम्बर नेपाल",
      "बाढी उद्धार",
      "विपद् जानकारी नेपाल",
      "११४९ हटलाइन",
      "लाङटाङ हिमपहिरो",
    ],
  },
  hi: {
    title: "नेपाल बाढ़ मॉनिटर — भोटेकोशी और त्रिशूली बाढ़ की लाइव जानकारी",
    description:
      "26 अगस्त 2026 की भोटेकोशी आपदा के बाद नेपाल की लाइव बाढ़ निगरानी: रसुवा, नुवाकोट और सभी प्रमुख नदी बेसिनों का स्तर, वर्षा पूर्वानुमान, सत्यापित समाचार, आपातकालीन नंबर और सार्वजनिक सहायता बोर्ड। निःशुल्क, बिना लॉगिन, हिन्दी, नेपाली और अंग्रेज़ी में।",
    keywords: [
      "नेपाल बाढ़",
      "नेपाल बाढ़ 2026",
      "भोटेकोशी बाढ़",
      "त्रिशूली नदी बाढ़",
      "रसुवा बाढ़",
      "नेपाल बाढ़ समाचार",
      "नेपाल बाढ़ मृतक संख्या",
      "हिमनद टूटना नेपाल",
      "भूस्खलन झील",
      "नेपाल नदी स्तर",
      "नेपाल आपातकालीन नंबर",
      "नेपाल बाढ़ राहत",
    ],
  },
};

export type Faq = { q: string; a: string };

/**
 * Questions people actually type during this disaster. Kept factual and sourced in
 * substance — an answer engine that quotes these must not end up asserting anything
 * this project cannot stand behind.
 */
export const FAQS: Record<Locale, Faq[]> = {
  en: [
    {
      q: "What caused the Nepal flood of 26 August 2026?",
      a: "A glacier and rock collapse above the Bhotekoshi river, near Langtang Lirung, sent a debris avalanche into the river on the morning of 26 August 2026. The resulting flash flood travelled down the Bhotekoshi–Trishuli corridor at roughly 190 km/h, destroying settlements across Rasuwa and Nuwakot. Scientists are still reconstructing the exact chain of events.",
    },
    {
      q: "How many people died in the Nepal flood?",
      a: "Figures are provisional and change daily. This page extracts the latest reported numbers directly from live news feeds and shows the outlet and date beside each one, rather than publishing a single figure of its own. Official counts come from Nepal Police and the National Emergency Operation Centre.",
    },
    {
      q: "Are the landslide-dammed lakes still dangerous?",
      a: "Yes. The debris avalanche blocked the river and formed lakes behind it, and those lakes remain under watch. If one breaches, water can come down the same valley again with little warning. River-discharge models cannot see this hazard, so it is tracked separately here and flagged in every risk outlook.",
    },
    {
      q: "What is the emergency number for floods in Nepal?",
      a: "Call 1149 for the National Emergency Operation Centre, Nepal's disaster hotline, or 100 for Nepal Police. Both are free from any Nepali mobile or landline and are dialled without an area code. Ambulance is 102 and fire is 101.",
    },
    {
      q: "How do I report a missing person after the flood?",
      a: "Call 100 and file a report with the local police first, as they coordinate the official search. You can then post a public notice on this site's report board, which needs no account and is screened for abuse before it appears.",
    },
    {
      q: "Is it safe to travel to Rasuwa or Nuwakot right now?",
      a: "Follow official advisories rather than any website, including this one. Roads and bridges across Rasuwa, Nuwakot and Dhading were destroyed or damaged, the Prithvi Highway has been disrupted, and the dammed lakes upstream remain an active hazard. Check current river readings on this page and call 103 for road conditions.",
    },
    {
      q: "Where does the river data on this site come from?",
      a: "River discharge is modelled by the Copernicus Global Flood Awareness System (GloFAS) and served free by Open-Meteo; rainfall comes from ECMWF and GFS forecasts. These are model outputs, not gauge readings. Nepal's Department of Hydrology and Meteorology publishes the official river levels and danger thresholds.",
    },
    {
      q: "Is Nepal Flood Watch free to use?",
      a: "Yes. There is no login, no account, no paywall and no advertising. It is an independent public-interest project, not a government service, and works in English, Nepali and Hindi.",
    },
  ],
  ne: [
    {
      q: "२६ अगस्ट २०२६ को नेपाल बाढी किन आयो?",
      a: "लाङटाङ लिरुङ नजिकै भोटेकोशी नदीमाथि हिमनदी र चट्टान खसेर २६ अगस्ट २०२६ को बिहान नदीमा पहिरो पस्यो। त्यसपछि आएको आकस्मिक बाढी भोटेकोशी–त्रिशूली क्षेत्रबाट करिब १९० किमी प्रतिघण्टाको गतिमा बग्दै रसुवा र नुवाकोटका बस्तीहरू ध्वस्त पार्‍यो। घटनाक्रमको ठ्याक्कै विवरण वैज्ञानिकहरूले अझै अध्ययन गर्दै छन्।",
    },
    {
      q: "नेपाल बाढीमा कति जनाको मृत्यु भयो?",
      a: "तथ्याङ्क अस्थायी छ र दैनिक परिवर्तन हुन्छ। यो पृष्ठले प्रत्यक्ष समाचार स्रोतबाट पछिल्लो अंक झिकेर प्रत्येकसँग सञ्चारमाध्यमको नाम र मिति देखाउँछ, आफ्नै छुट्टै अंक प्रकाशित गर्दैन। आधिकारिक विवरण नेपाल प्रहरी र राष्ट्रिय आपत्कालीन कार्य सञ्चालन केन्द्रले दिन्छ।",
    },
    {
      q: "पहिरोले बनेका तालहरू अझै खतरनाक छन्?",
      a: "छन्। पहिरोले नदी थुनेर पछाडि तालहरू बनेका छन् र ती निगरानीमा छन्। कुनै एउटा फुट्यो भने थोरै चेतावनीमै यही उपत्यकाबाट फेरि पानी आउन सक्छ। नदी बहावको मोडेलले यो जोखिम देख्दैन, त्यसैले यहाँ छुट्टै हेरिन्छ र हरेक जोखिम आकलनमा उल्लेख गरिन्छ।",
    },
    {
      q: "नेपालमा बाढीको आपतकालीन नम्बर के हो?",
      a: "विपद् हटलाइन राष्ट्रिय आपत्कालीन कार्य सञ्चालन केन्द्रका लागि ११४९ मा वा नेपाल प्रहरीका लागि १०० मा फोन गर्नुहोस्। दुवै नेपालको जुनसुकै मोबाइल वा ल्यान्डलाइनबाट निःशुल्क छन् र एरिया कोड बिना लाग्छन्। एम्बुलेन्स १०२ र दमकल १०१ हो।",
    },
    {
      q: "बाढीपछि बेपत्ता व्यक्तिको रिपोर्ट कसरी गर्ने?",
      a: "पहिले १०० मा फोन गरी स्थानीय प्रहरीमा उजुरी दिनुहोस्, किनभने आधिकारिक खोजी उनीहरूले नै समन्वय गर्छन्। त्यसपछि यस साइटको रिपोर्ट बोर्डमा सार्वजनिक सूचना राख्न सक्नुहुन्छ — खाता चाहिँदैन र सार्वजनिक हुनुअघि दुरुपयोगका लागि जाँच हुन्छ।",
    },
    {
      q: "अहिले रसुवा वा नुवाकोट जान सुरक्षित छ?",
      a: "कुनै पनि वेबसाइट होइन, आधिकारिक सूचना पछ्याउनुहोस् — यो साइट पनि। रसुवा, नुवाकोट र धादिङका सडक तथा पुलहरू भत्किएका छन्, पृथ्वी राजमार्ग अवरुद्ध छ, र माथिका बाँधिएका तालहरू अझै जोखिममा छन्। यस पृष्ठमा नदीको अवस्था हेर्नुहोस् र सडकको जानकारीका लागि १०३ मा फोन गर्नुहोस्।",
    },
    {
      q: "यस साइटको नदी तथ्याङ्क कहाँबाट आउँछ?",
      a: "नदीको बहाव Copernicus Global Flood Awareness System (GloFAS) ले मोडेल गरेको र Open-Meteo मार्फत निःशुल्क उपलब्ध हुन्छ; वर्षा ECMWF र GFS पूर्वानुमानबाट आउँछ। यी मोडेलका नतिजा हुन्, नापिएका सतह होइनन्। आधिकारिक नदी सतह र खतरा तह जल तथा मौसम विज्ञान विभागले प्रकाशित गर्छ।",
    },
    {
      q: "नेपाल बाढी निगरानी प्रयोग गर्न निःशुल्क छ?",
      a: "छ। लगइन, खाता, शुल्क वा विज्ञापन केही छैन। यो स्वतन्त्र जनहितकारी परियोजना हो, सरकारी सेवा होइन, र नेपाली, हिन्दी तथा अंग्रेजीमा चल्छ।",
    },
  ],
  hi: [
    {
      q: "26 अगस्त 2026 की नेपाल बाढ़ क्यों आई?",
      a: "लांगटांग लिरुंग के पास भोटेकोशी नदी के ऊपर हिमनद और चट्टान टूटकर 26 अगस्त 2026 की सुबह नदी में गिरे। उससे बनी अचानक बाढ़ भोटेकोशी–त्रिशूली गलियारे में लगभग 190 किमी/घंटा की रफ़्तार से बही और रसुवा तथा नुवाकोट की बस्तियाँ नष्ट कर दीं। घटनाक्रम का सटीक क्रम वैज्ञानिक अब भी जाँच रहे हैं।",
    },
    {
      q: "नेपाल बाढ़ में कितने लोगों की मृत्यु हुई?",
      a: "आँकड़े अस्थायी हैं और रोज़ बदलते हैं। यह पेज लाइव समाचार स्रोतों से नवीनतम संख्या निकालकर हर आँकड़े के साथ मीडिया संस्थान और तारीख़ दिखाता है, अपना अलग आँकड़ा प्रकाशित नहीं करता। आधिकारिक गणना नेपाल पुलिस और राष्ट्रीय आपातकालीन संचालन केंद्र देते हैं।",
    },
    {
      q: "क्या भूस्खलन से बनी झीलें अब भी ख़तरनाक हैं?",
      a: "हाँ। मलबे ने नदी रोककर पीछे झीलें बना दीं और उन पर नज़र रखी जा रही है। कोई एक फूटी तो बिना चेतावनी उसी घाटी में फिर पानी आ सकता है। नदी-बहाव मॉडल इस ख़तरे को नहीं देख पाते, इसलिए इसे यहाँ अलग से ट्रैक किया जाता है।",
    },
    {
      q: "नेपाल में बाढ़ के लिए आपातकालीन नंबर क्या है?",
      a: "आपदा हॉटलाइन के लिए 1149 (राष्ट्रीय आपातकालीन संचालन केंद्र) या नेपाल पुलिस के लिए 100 पर कॉल करें। दोनों नेपाल के किसी भी मोबाइल या लैंडलाइन से निःशुल्क हैं और बिना एरिया कोड लगते हैं। एम्बुलेंस 102 और अग्निशमन 101 है।",
    },
    {
      q: "बाढ़ के बाद लापता व्यक्ति की रिपोर्ट कैसे करें?",
      a: "पहले 100 पर कॉल कर स्थानीय पुलिस में रिपोर्ट दर्ज कराएँ, क्योंकि आधिकारिक खोज वही समन्वित करते हैं। उसके बाद इस साइट के रिपोर्ट बोर्ड पर सार्वजनिक सूचना डाल सकते हैं — खाता ज़रूरी नहीं और सार्वजनिक होने से पहले जाँच होती है।",
    },
    {
      q: "क्या अभी रसुवा या नुवाकोट जाना सुरक्षित है?",
      a: "किसी वेबसाइट के बजाय आधिकारिक सलाह मानें — इस साइट के बजाय भी। रसुवा, नुवाकोट और धादिंग की सड़कें व पुल क्षतिग्रस्त हैं, पृथ्वी राजमार्ग बाधित है, और ऊपर की बाँध झीलें सक्रिय ख़तरा बनी हुई हैं। इस पेज पर नदी की स्थिति देखें और सड़क जानकारी के लिए 103 पर कॉल करें।",
    },
    {
      q: "इस साइट का नदी डेटा कहाँ से आता है?",
      a: "नदी बहाव Copernicus Global Flood Awareness System (GloFAS) से मॉडल किया जाता है और Open-Meteo के ज़रिए निःशुल्क मिलता है; वर्षा ECMWF और GFS पूर्वानुमानों से आती है। ये मॉडल परिणाम हैं, मापे गए स्तर नहीं। आधिकारिक नदी स्तर नेपाल का जल एवं मौसम विज्ञान विभाग प्रकाशित करता है।",
    },
    {
      q: "क्या नेपाल बाढ़ मॉनिटर मुफ़्त है?",
      a: "हाँ। कोई लॉगिन, खाता, शुल्क या विज्ञापन नहीं। यह एक स्वतंत्र जनहित परियोजना है, सरकारी सेवा नहीं, और हिन्दी, नेपाली व अंग्रेज़ी में चलती है।",
    },
  ],
};
