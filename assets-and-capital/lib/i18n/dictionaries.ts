import type { Locale } from "./config";

/**
 * Translated interface copy.
 *
 * Scope, stated honestly: this covers navigation, the footer, the homepage and
 * the shared interface furniture — the surface a visitor meets before they
 * decide whether the site is for them. Long-form pages (legal documents,
 * insight articles, individual listings) stay in English and fall back below.
 *
 * The fallback is deliberate and visible rather than clever. A missing key
 * renders the English string, so an untranslated page reads as an English page
 * rather than as a broken one full of dotted key paths. Machine-translating a
 * financial disclosure into three languages nobody here reads would be worse
 * than leaving it in the language it was written and reviewed in.
 *
 * Arabic is included for the same reason the layout is direction-aware: RTL
 * that has never rendered real Arabic is RTL that does not work.
 */

export type Dict = {
  /**
   * Keyed by the English string itself, not by a symbolic key.
   *
   * Navigation and footer copy lives in lib/content.ts as data — labels,
   * descriptions, groups — so a key-based dictionary would mean restructuring
   * that file and threading keys through every entry. Looking up the English
   * text instead leaves the content file untouched and makes the fallback
   * automatic: an untranslated label renders as the English it already was.
   *
   * The trade is that changing English copy silently drops its translation.
   * Acceptable while the translated surface is this small; it is the thing to
   * revisit if it grows.
   */
  labels: Record<string, string>;
  nav: Record<string, string>;
  cta: Record<string, string>;
  home: Record<string, string>;
  footer: Record<string, string>;
  common: Record<string, string>;
};

const en: Dict = {
  labels: {},
  nav: {
    invest: "Invest",
    raiseCapital: "Raise Capital",
    marketplace: "Marketplace",
    pricing: "Pricing",
    company: "Company",
    signIn: "Sign in",
    getStarted: "Get started",
    menu: "Menu",
    closeMenu: "Close menu",
    language: "Language",
  },
  cta: {
    investor: "I'm an investor",
    raising: "I'm raising capital",
    startMandate: "Start with a mandate",
    browse: "Browse the marketplace",
    howWeWork: "How we work with both sides",
    readJournal: "Read the journal",
    findOpportunities: "Find opportunities",
  },
  home: {
    kicker: "A marketplace for private capital",
    headlineLead: "Where quality assets",
    headlineTail: "meet",
    headlineAccent: "ready capital.",
    subhead:
      "Vetted businesses, matched to investor mandates, carried to close with an on-the-ground team.",
    featuredKicker: "Featured",
    featuredTitle: "Featured businesses",
    featuredSubtitle: "Premium placements from businesses raising capital now.",
    processKicker: "The investment process",
    processTitle: "How we work",
  },
  footer: {
    company: "Company",
    forInvestors: "For investors",
    forBusinesses: "For businesses",
    legal: "Legal",
    rights: "All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
  },
  common: {
    anySector: "Any sector",
    anyRegion: "Any region",
    anyStage: "Any stage",
    seeking: "Seeking",
    loading: "Loading…",
    search: "Search",
    close: "Close",
  },
};

const fr: Dict = {
  labels: {
    "Invest": "Investir",
    "Raise Capital": "Lever des fonds",
    "Marketplace": "Place de marché",
    "Pricing": "Tarifs",
    "Company": "Société",
    "Why invest with us": "Pourquoi investir avec nous",
    "Browse the marketplace": "Parcourir la place de marché",
    "Build your mandate": "Définir votre mandat",
    "How it works": "Comment ça marche",
    "List your business": "Référencer votre entreprise",
    "Specialised roadshows": "Roadshows spécialisés",
    "Local events access": "Accès aux événements locaux",
    "Market access support": "Accompagnement à l'accès au marché",
    "For Investors": "Pour les investisseurs",
    "For Businesses": "Pour les entreprises",
    "Legal": "Mentions légales",
    "Business plan writing": "Rédaction de business plan",
    "Financial modelling": "Modélisation financière",
    "Roadshows": "Roadshows",
    "Appearance": "Apparence",
    "Language": "Langue",
  },
  nav: {
    invest: "Investir",
    raiseCapital: "Lever des fonds",
    marketplace: "Place de marché",
    pricing: "Tarifs",
    company: "Société",
    signIn: "Se connecter",
    getStarted: "Commencer",
    menu: "Menu",
    closeMenu: "Fermer le menu",
    language: "Langue",
  },
  cta: {
    investor: "Je suis investisseur",
    raising: "Je lève des fonds",
    startMandate: "Commencer par un mandat",
    browse: "Parcourir la place de marché",
    howWeWork: "Comment nous travaillons avec les deux parties",
    readJournal: "Lire le journal",
    findOpportunities: "Trouver des opportunités",
  },
  home: {
    kicker: "Une place de marché pour le capital privé",
    headlineLead: "Où les actifs de qualité",
    headlineTail: "rencontrent",
    headlineAccent: "le capital disponible.",
    subhead:
      "Des entreprises vérifiées, associées aux mandats des investisseurs, accompagnées jusqu'à la clôture par une équipe sur le terrain.",
    featuredKicker: "À la une",
    featuredTitle: "Entreprises à la une",
    featuredSubtitle: "Placements premium d'entreprises qui lèvent des fonds actuellement.",
    processKicker: "Le processus d'investissement",
    processTitle: "Notre méthode",
  },
  footer: {
    company: "Société",
    forInvestors: "Pour les investisseurs",
    forBusinesses: "Pour les entreprises",
    legal: "Mentions légales",
    rights: "Tous droits réservés.",
    privacy: "Confidentialité",
    terms: "Conditions",
  },
  common: {
    anySector: "Tous secteurs",
    anyRegion: "Toutes régions",
    anyStage: "Tous stades",
    seeking: "Recherche",
    loading: "Chargement…",
    search: "Rechercher",
    close: "Fermer",
  },
};

const es: Dict = {
  labels: {
    "Invest": "Invertir",
    "Raise Capital": "Captar capital",
    "Marketplace": "Mercado",
    "Pricing": "Precios",
    "Company": "Empresa",
    "Why invest with us": "Por qué invertir con nosotros",
    "Browse the marketplace": "Explorar el mercado",
    "Build your mandate": "Definir tu mandato",
    "How it works": "Cómo funciona",
    "List your business": "Publicar tu empresa",
    "Specialised roadshows": "Roadshows especializados",
    "Local events access": "Acceso a eventos locales",
    "Market access support": "Apoyo al acceso al mercado",
    "For Investors": "Para inversores",
    "For Businesses": "Para empresas",
    "Legal": "Legal",
    "Business plan writing": "Redacción de plan de negocio",
    "Financial modelling": "Modelización financiera",
    "Roadshows": "Roadshows",
    "Appearance": "Apariencia",
    "Language": "Idioma",
  },
  nav: {
    invest: "Invertir",
    raiseCapital: "Captar capital",
    marketplace: "Mercado",
    pricing: "Precios",
    company: "Empresa",
    signIn: "Iniciar sesión",
    getStarted: "Empezar",
    menu: "Menú",
    closeMenu: "Cerrar menú",
    language: "Idioma",
  },
  cta: {
    investor: "Soy inversor",
    raising: "Busco capital",
    startMandate: "Empezar con un mandato",
    browse: "Explorar el mercado",
    howWeWork: "Cómo trabajamos con ambas partes",
    readJournal: "Leer el diario",
    findOpportunities: "Buscar oportunidades",
  },
  home: {
    kicker: "Un mercado de capital privado",
    headlineLead: "Donde los activos de calidad",
    headlineTail: "encuentran",
    headlineAccent: "capital disponible.",
    subhead:
      "Empresas verificadas, emparejadas con los mandatos de los inversores y acompañadas hasta el cierre por un equipo sobre el terreno.",
    featuredKicker: "Destacado",
    featuredTitle: "Empresas destacadas",
    featuredSubtitle: "Colocaciones premium de empresas que captan capital ahora.",
    processKicker: "El proceso de inversión",
    processTitle: "Cómo trabajamos",
  },
  footer: {
    company: "Empresa",
    forInvestors: "Para inversores",
    forBusinesses: "Para empresas",
    legal: "Legal",
    rights: "Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
  },
  common: {
    anySector: "Cualquier sector",
    anyRegion: "Cualquier región",
    anyStage: "Cualquier etapa",
    seeking: "Busca",
    loading: "Cargando…",
    search: "Buscar",
    close: "Cerrar",
  },
};

const ar: Dict = {
  labels: {
    "Invest": "استثمر",
    "Raise Capital": "احصل على تمويل",
    "Marketplace": "السوق",
    "Pricing": "الأسعار",
    "Company": "الشركة",
    "Why invest with us": "لماذا تستثمر معنا",
    "Browse the marketplace": "تصفح السوق",
    "Build your mandate": "حدّد تفويضك",
    "How it works": "كيف يعمل",
    "List your business": "أدرج شركتك",
    "Specialised roadshows": "جولات ترويجية متخصصة",
    "Local events access": "الوصول إلى الفعاليات المحلية",
    "Market access support": "دعم دخول السوق",
    "For Investors": "للمستثمرين",
    "For Businesses": "للشركات",
    "Legal": "الشؤون القانونية",
    "Business plan writing": "كتابة خطة العمل",
    "Financial modelling": "النمذجة المالية",
    "Roadshows": "جولات ترويجية",
    "Appearance": "المظهر",
    "Language": "اللغة",
  },
  nav: {
    invest: "استثمر",
    raiseCapital: "احصل على تمويل",
    marketplace: "السوق",
    pricing: "الأسعار",
    company: "الشركة",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ الآن",
    menu: "القائمة",
    closeMenu: "إغلاق القائمة",
    language: "اللغة",
  },
  cta: {
    investor: "أنا مستثمر",
    raising: "أبحث عن تمويل",
    startMandate: "ابدأ بتحديد التفويض",
    browse: "تصفح السوق",
    howWeWork: "كيف نعمل مع الطرفين",
    readJournal: "اقرأ المدونة",
    findOpportunities: "ابحث عن الفرص",
  },
  home: {
    kicker: "سوق لرأس المال الخاص",
    headlineLead: "حيث تلتقي الأصول الجيدة",
    headlineTail: "برأس",
    headlineAccent: "المال الجاهز.",
    subhead:
      "شركات مدققة، تُطابق مع تفويضات المستثمرين، ويرافقها فريق ميداني حتى إتمام الصفقة.",
    featuredKicker: "مميّز",
    featuredTitle: "شركات مميّزة",
    featuredSubtitle: "إدراجات مميزة لشركات تسعى للحصول على تمويل الآن.",
    processKicker: "عملية الاستثمار",
    processTitle: "كيف نعمل",
  },
  footer: {
    company: "الشركة",
    forInvestors: "للمستثمرين",
    forBusinesses: "للشركات",
    legal: "الشؤون القانونية",
    rights: "جميع الحقوق محفوظة.",
    privacy: "الخصوصية",
    terms: "الشروط",
  },
  common: {
    anySector: "كل القطاعات",
    anyRegion: "كل المناطق",
    anyStage: "كل المراحل",
    seeking: "يطلب",
    loading: "جارٍ التحميل…",
    search: "بحث",
    close: "إغلاق",
  },
};

const DICTS: Record<Locale, Dict> = { en, fr, es, ar };

export function getDictionary(locale: Locale): Dict {
  return DICTS[locale] ?? en;
}

/**
 * Look up "nav.pricing", falling back to English then to the key itself.
 *
 * Returning English rather than the key is what keeps a partly-translated page
 * readable: a French visitor on an untranslated section sees English words, not
 * "footer.rights".
 */
/**
 * Translate a literal English string, falling back to itself.
 *
 * Used for copy that lives in lib/content.ts rather than in this file.
 */
export function translateLabel(locale: Locale, text: string): string {
  return getDictionary(locale).labels[text] ?? text;
}

export function translate(locale: Locale, path: string): string {
  const [group, key] = path.split(".");
  const dict = getDictionary(locale) as unknown as Record<string, Record<string, string>>;
  const fallback = en as unknown as Record<string, Record<string, string>>;
  return dict[group]?.[key] ?? fallback[group]?.[key] ?? path;
}
