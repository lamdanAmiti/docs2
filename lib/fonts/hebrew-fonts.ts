/**
 * Registry of Hebrew fonts bundled with docs.velr.app.
 * Files live in /public/fonts/hebrew/. The display name in `name` is what users
 * see in the font picker and what gets persisted into documents.
 */

export interface HebrewFont {
  /** Canonical display name shown in the UI and serialized into documents. */
  name: string;
  /** Filename inside /public/fonts/hebrew/ */
  file: string;
  /** Font weight for @font-face. Most Hebrew display fonts are 400. */
  weight?: number;
  /** Foundry/collection grouping for sorting. */
  collection: 'FT' | 'PFT' | 'EFT' | 'BAWS' | 'System' | 'Other';
  /** Style classification surfaced via tooltip. */
  style?: 'serif' | 'sans' | 'display' | 'script' | 'mono' | 'stam' | 'rashi';
}

export const HEBREW_FONTS: HebrewFont[] = [
  // ─── System (Windows) ─────────────────────────────────────────────
  { name: 'David', file: 'david.ttf', collection: 'System', style: 'serif' },
  { name: 'David Bold', file: 'davidbd.ttf', weight: 700, collection: 'System', style: 'serif' },
  { name: 'Frank Ruehl', file: 'frank.ttf', collection: 'System', style: 'serif' },
  { name: 'Gisha', file: 'gisha.ttf', collection: 'System', style: 'sans' },
  { name: 'Gisha Bold', file: 'gishabd.ttf', weight: 700, collection: 'System', style: 'sans' },
  { name: 'Levenim MT', file: 'lvnm.ttf', collection: 'System', style: 'sans' },
  { name: 'Levenim MT Bold', file: 'lvnmbd.ttf', weight: 700, collection: 'System', style: 'sans' },
  { name: 'Narkisim', file: 'nrkis.ttf', collection: 'System', style: 'serif' },

  // ─── FT (Fontbit/Hebrew Fonts) ───────────────────────────────────
  { name: 'FT David', file: 'FbwDavid.ttf', collection: 'FT', style: 'serif' },
  { name: 'FT David Bold', file: 'FbwDavidBold.ttf', weight: 700, collection: 'FT', style: 'serif' },
  { name: 'FT Frank', file: 'FbFrankReal.ttf', collection: 'FT', style: 'serif' },
  { name: 'FT Frank Bold', file: 'FbFrankRealBold.ttf', weight: 700, collection: 'FT', style: 'serif' },
  { name: 'FT Frank Light', file: 'FbFrankRealLight.ttf', weight: 300, collection: 'FT', style: 'serif' },
  { name: 'FT Livorna', file: 'FbwLivorna.otf', collection: 'FT', style: 'serif' },
  { name: 'FT Livorna Bold', file: 'FbwLivornaBold.otf', weight: 700, collection: 'FT', style: 'serif' },
  { name: 'Miriam CLM', file: 'MiriamCLM-Book.ttf', collection: 'Other', style: 'serif' },
  { name: 'Lubavitch 770', file: 'ABCDEE+lubavittch770.ttf', collection: 'Other', style: 'display' },
  { name: 'Livorno Bold', file: 'LivornoBold.ttf', weight: 700, collection: 'Other', style: 'serif' },

  // ─── BAWS (your collection) ──────────────────────────────────────
  { name: 'BAWS Esthetic', file: 'BAWS-Esthetic-Regular.ttf', collection: 'BAWS', style: 'display' },
  { name: 'BAWS Esthetic Bold', file: 'BAWS-Esthetic-Bold.ttf', weight: 700, collection: 'BAWS', style: 'display' },
  { name: 'BAWS Esthetic Decor', file: 'BAWS-Esthetic-Decor.ttf', collection: 'BAWS', style: 'display' },
  { name: 'BAWS Esthetic Light', file: 'BAWS-Esthetic-Light.ttf', weight: 300, collection: 'BAWS', style: 'display' },
  { name: 'BAWS HaYetzira Decor', file: 'BAWS-HaYetzira-Decor.ttf', collection: 'BAWS', style: 'display' },
  { name: 'BAWS HaYetzira Rolltext', file: 'BAWS-HaYetzira-Rolltext.ttf', collection: 'BAWS', style: 'script' },
  { name: 'BAWS HaYetzira Rolltext II', file: 'BAWS-HaYetzira-Rolltext-II.ttf', collection: 'BAWS', style: 'script' },
  { name: 'BAWS Nostalgia', file: 'BAWS-Nostalgia-Old.ttf', collection: 'BAWS', style: 'display' },
  { name: 'BAWS Yoel Bold', file: 'BAWS-Yoel-Bold.ttf', weight: 700, collection: 'BAWS', style: 'display' },
  { name: 'BAWS Campeiner', file: 'BAWSCampeiner-Regular.ttf', collection: 'BAWS', style: 'display' },

  // ─── EFT (Eshel Foundry) ─────────────────────────────────────────
  { name: 'EFT Atara', file: 'eft_atara-webfont1.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Avukado', file: 'eft_avukado-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Classic', file: 'EFT_Classic OTS.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Frankfurt', file: 'AnyConv.com__eft_frankfurt-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Graphologya', file: 'EFT_Graphologya.ttf', collection: 'EFT', style: 'script' },
  { name: 'EFT HaHozvim', file: 'eft_hahozvimwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Hebrew', file: 'eft_hebrewwebfont.ttf', collection: 'EFT', style: 'sans' },
  { name: 'EFT Hipstar', file: 'eft_hipstar_ot-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Ice Coffee', file: 'eft_icecoffie-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Judaica', file: 'eft_judaicaotswebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Kdilak Sans', file: 'eft_kdilak_sans-webfont.ttf', collection: 'EFT', style: 'sans' },
  { name: 'EFT Kitabet', file: 'eft_kitabet-webfont.ttf', collection: 'EFT', style: 'script' },
  { name: 'EFT Kita Alef', file: 'eft_kita_alef-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Kiyosk Heavy', file: 'eft_kiyosk_heavy_ot-webfont.ttf', weight: 900, collection: 'EFT', style: 'display' },
  { name: 'EFT Kroason', file: 'eft_kroasonwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Kulmus', file: 'eft_kulmuswebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Labirint', file: 'eft_labirintwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Legioner', file: 'eft_legioner-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Lemonade', file: 'eft_lemonade-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Lituf', file: 'eft_litufwebfont.ttf', collection: 'EFT', style: 'script' },
  { name: 'EFT Maple', file: 'eft_maplewebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Marshmallow', file: 'eft_marshmelo-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Mashat', file: 'eft_mashat-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Matcon', file: 'eft_matcon-webfont.ttf', collection: 'EFT', style: 'sans' },
  { name: 'EFT Mesora', file: 'eft_mesora-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Miriam Elagean', file: 'eft_miriam_elagean-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Nefesh', file: 'eft_nefesh-webfont_Liran.ttf', collection: 'EFT', style: 'script' },
  { name: 'EFT Neon', file: 'eft_neon_full-webfont1.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Netsach Neria', file: 'eft_netsach_neria-webfont1.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Newletter Elegant', file: 'eft_newletter_elegant-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Noyvirt Peleot', file: 'eft_noyvirt_peleot-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Office', file: 'eft_office-webfont_Liran.ttf', collection: 'EFT', style: 'sans' },
  { name: 'EFT Offset', file: 'eft_offset-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Ole Hadash', file: 'eft_olehadashwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Paalul', file: 'eft_paalul-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Paamonim', file: 'eft_paamonim_otswebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pascal', file: 'eft_pascal-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Patient', file: 'eft_patientwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Patpetet', file: 'eft_patpetet-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pegasus', file: 'eft_pegasus-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pilpel Harif', file: 'eft_pilpelharif-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pilpilon', file: 'eft_pilpilon-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Plastica', file: 'eft_plastica-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pnina', file: 'eft_pnina-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Pnina Decor', file: 'eft_pnina_decor-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Prehistoric', file: 'eft_prehistoric-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Primaries', file: 'eft_primaries-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Progtext Gold', file: 'eft_progtextgold-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Raashan', file: 'eft_raashanwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Rashi', file: 'eft_rashi_ot-webfont.ttf', collection: 'EFT', style: 'rashi' },
  { name: 'EFT Regga', file: 'eft_regga-webfont2.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Resisim', file: 'eft_resisimwebfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Sabress', file: 'eft_sabress-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Shaarey Zedek', file: 'eft_shaareyzedek_ot-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Shaashuim', file: 'eft_shaashuim_ot-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Sharvit', file: 'eft_sharvit-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Shifnuk', file: 'eft_shifnuk-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Shukon', file: 'eft_shukon-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Sicumim', file: 'eft_sicumim-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Sifrut Open', file: 'eft_sifrut_open_otpwebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Sifrut', file: 'eft_sifrut_otpwebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Sinai Mitki', file: 'eft_sinaimitkiwebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Skup', file: 'eft_skup-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Stam Ari', file: 'eft_stam_ari-webfont.ttf', collection: 'EFT', style: 'stam' },
  { name: 'EFT Stam Beit Yosef', file: 'eft_stam_beityosef-webfont.ttf', collection: 'EFT', style: 'stam' },
  { name: 'EFT Stam Sfaradi', file: 'eft_stam_sfaradi-webfont.ttf', collection: 'EFT', style: 'stam' },
  { name: 'EFT Stam Sfaradi (no tag)', file: 'eft_stamsf_aradi_notag-webfont.ttf', collection: 'EFT', style: 'stam' },
  { name: 'EFT Studentit', file: 'eft_studentit-webfont.ttf', collection: 'EFT', style: 'script' },
  { name: 'EFT Sufat Alim', file: 'eft_sufatalim-webfont3.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Talpiot Class', file: 'eft_talpiot_class_regwebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Talpiot', file: 'eft_talpiot_regwebfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Tamar', file: 'eft_tamar-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Tehilot', file: 'EFT_Tehilot-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Telescope', file: 'eft_telescope-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Termus', file: 'eft_termus_ot-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Textina', file: 'eft_textina-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Textural', file: 'eft_textural-webfont-1.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Tirosh', file: 'eft_tirosh_ot-webfont.ttf', collection: 'EFT', style: 'serif' },
  { name: 'EFT Tsafon', file: 'eft_tsafon-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Turbo', file: 'eft_turbo_ot-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Yesodot Eitanim', file: 'eft_yesodoteitanim-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Zarbuvit', file: 'eft_zarbuvit-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Zarka', file: 'eft_zarka-webfont-1.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Zecharya', file: 'eft_zecharya-webfont.ttf', collection: 'EFT', style: 'display' },
  { name: 'EFT Zrima', file: 'eft_zrima-webfont.ttf', collection: 'EFT', style: 'display' },

  // ─── PFT ─────────────────────────────────────────────────────────
  { name: 'PFT David', file: 'pft_david-webfont.ttf', collection: 'PFT', style: 'serif' },
  { name: 'PFT Dor', file: 'pft_dor-webfont.ttf', collection: 'PFT', style: 'sans' },
  { name: 'PFT Frank', file: 'pft_frank-webfont.ttf', collection: 'PFT', style: 'serif' },
  { name: 'PFT Hayim', file: 'pft_hayimn-webfont.ttf', collection: 'PFT', style: 'serif' },
  { name: 'PFT Ivri', file: 'pft_ivri-webfont.ttf', collection: 'PFT', style: 'sans' },
  { name: 'PFT Ivri Classic', file: 'pft_ivric-webfont.ttf', collection: 'PFT', style: 'sans' },
  { name: 'PFT Ivri Bold', file: 'pft_ivri_bold-webfont.ttf', weight: 700, collection: 'PFT', style: 'sans' },
  { name: 'PFT Ktav', file: 'pft_ktav-webfont.ttf', collection: 'PFT', style: 'script' },
  { name: 'PFT Meiri', file: 'pft_meiri-webfont.ttf', collection: 'PFT', style: 'serif' },
  { name: 'PFT Ophir', file: 'pft_ophir-webfont.ttf', collection: 'PFT', style: 'sans' },
  { name: 'PFT Rashi', file: 'pft_rashi-webfont2.ttf', collection: 'PFT', style: 'rashi' },
  { name: 'PFT Sivan', file: 'pft_sivan-webfont.ttf', collection: 'PFT', style: 'display' },
  { name: 'PFT Stam', file: 'pft_stam-webfont.ttf', collection: 'PFT', style: 'stam' },
  { name: 'PFT Vilna', file: 'pft_vilna-webfont.ttf', collection: 'PFT', style: 'serif' },
  { name: 'PFT Yerushalmi', file: 'pft_yrushalmi-webfont.ttf', collection: 'PFT', style: 'serif' },

  // ─── Other Hebrew ───────────────────────────────────────────────
  { name: 'Ravenda', file: '885f1e14-4070-4fdb-b7f2-9e446c5942d3_ravendafree.ttf', collection: 'Other', style: 'display' },
];

/** Names only — used for the @font-face generator. */
export const HEBREW_FONT_NAMES: readonly string[] = HEBREW_FONTS.map((f) => f.name);

/** Quick lookup. */
export const HEBREW_FONTS_BY_NAME: ReadonlyMap<string, HebrewFont> = new Map(
  HEBREW_FONTS.map((f) => [f.name, f] as const),
);

/** Returns ordered groups for the picker. */
export function hebrewFontGroups(): { label: string; fonts: HebrewFont[] }[] {
  const groups: Record<string, HebrewFont[]> = { System: [], FT: [], PFT: [], EFT: [], BAWS: [], Other: [] };
  for (const f of HEBREW_FONTS) groups[f.collection].push(f);
  return [
    { label: 'System Hebrew', fonts: groups.System },
    { label: 'FT Family', fonts: groups.FT },
    { label: 'PFT Family', fonts: groups.PFT },
    { label: 'BAWS Family', fonts: groups.BAWS },
    { label: 'EFT (Eshel Foundry)', fonts: groups.EFT },
    { label: 'Other Hebrew', fonts: groups.Other },
  ].filter((g) => g.fonts.length > 0);
}
