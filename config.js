// ============================================================
// config.js: everything you edit when adding kiosks or equipment.
// Must be loaded BEFORE app.js (see the script tags below).
// ============================================================

// ============================================================
// Google Apps Script web app URL. The script holds the Airtable API key
// server-side. Update this if the deployment's /exec URL ever changes.
// ============================================================

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6tYaqU3AmBwxFJ5SIXfNgQyE8YntnxvkgUCTBURCVuEBGYvypjzqRDwo3C_PJu_pVcg/exec";

// ============================================================
// LOCATION SLUGS
// Maps the ?location=<slug> URL parameter to the full location name.
// The full name is what gets stored in Airtable's Location field, and it
// must exactly match the keys in QUESTIONS and LOCATION_STUDIOS below.
// ============================================================
const LOCATION_SLUGS = {
  'bvac101':    'BVAC 101',
  'woodshop':   'Wood Shop',
  'hammond':    'Hammond',
  'metal':      'Metal Fabrication',
  'sewing':     'Sewing Studio',
  'moldmaking':  'Mold Making Studio',
  'glass':          'Glass Studio',
'digifab':        'Digital Fabrication',
'letterpress':    'Letterpress',
  // 'printmaking': 'Printmaking Studio',
  // 'bvac135':     'BVAC 135',
};

// ============================================================
// AIRTABLE CONFIGURATION
// ============================================================
// Airtable record IDs from the Studios table, used for the "Link to Studios"
// field. To get one: open the record in Airtable and choose  "Copy record ID"
// from the row's expand menu.
const STUDIO_RECORD_IDS = {
  WOOD: "recEmA7YmwAZYwy4t", // Wood
  DGFB: "rec8ZDPeTm5oqfTmm", // Digital Fabrication
  LTPR: "recL1LMpU7M5QqX8T", // Letterpress
  MTFB: "recrjrza3kuEIHDZJ", // Metal Fabrication
  MOLD: "recA9LO7TKzBxfJ05", // Mold Making
  SEWI: "recAfbaDwT6mX5ptQ", // Sewing
  GLSS: "reczmauO2vp8nCTSH", // Glass
  PRNT: "recBRAr0RfMUqk7Ub", // Printmaking (no kiosk yet)
};

// Maps a location's full name to the Studio record(s) it links to.
// Not listed here on purpose:
//   - "BVAC 101": its studio depends on the equipment answers, so
//     getStudioRecordIds() in app.js handles it separately.
//   - "Hammond": the studio question overwrites Location with the specific
//     studio chosen, which is then looked up via the entries below.
const LOCATION_STUDIOS = {
  "Wood Shop":          [STUDIO_RECORD_IDS.WOOD],
  "Glass Studio":       [STUDIO_RECORD_IDS.GLSS],
  "Metal Fabrication":  [STUDIO_RECORD_IDS.MTFB],
  "Mold Making Studio": [STUDIO_RECORD_IDS.MOLD],
  "Sewing Studio":      [STUDIO_RECORD_IDS.SEWI],
};


// QUESTIONS DATA MODEL
// Extra questions shown per location.
//
//   question : text shown to the visitor
//   field    : Airtable field name (must match exactly, including case)
//   answers  : option list. Use a plain string, or { label, value } when the
//              button text needs line breaks. `value` is what's stored in
//              Airtable and what the image filename is derived from.
//   type     : omit for photo-backed multi-select; "single" for plain
//              one-choice buttons (no photos needed)
//   required : true blocks Submit until answered
//
// Multi-select answers need a matching photo in /images, named in lowercase
// with hyphens (e.g. "CNC Mill" -> cnc-mill.jpg).

// Add or remove locations/questions here as needed. Use the following format:
// "Location Name": [ { question: "Question text?", field: "Airtable Field Name (must match exactly!)", answers: ["Option 1", "Option 2"] }, ... ]
const QUESTIONS = {
  "BVAC 101": [
    {
      question: "What Letterpress equipment are you using?",
      field: "Letterpress Equipment",
      answers: [
        "Typesetting",
        "Presses",
        "Risograph",
        { label: "Guillotine/<br>Paper Cutter/<br>Board Shear", value: "Guillotine/Paper Cutter/Board Shear" },
        "Bindery",
      ],
    },
    {
      question: "What Digital Fabrication Equipment are you using?",
      field: "Digifab Equipment",
      answers: [
        "Filament 3D Printer",
        "Resin 3D Printer",
        "Laser Cutter",
        "3D Scanner",
        { label: "Vinyl Cutter/<br>Cricut", value: "Vinyl Cutter/Cricut" },
        "Vacuum Former",
        "CNC Mill",
      ],
    },
  ],

  "Glass Studio": [
    {
      question: "Which shop are you using?",
      field: "Glass Shop",
      answers: ["Hot Shop", "Cold Shop"],
    },
  ],

  "Hammond": [
    {
      // field: "Location" + type: "single" is a special combo: the chosen
      // studio overwrites the generic Location value sent to Airtable.
      // Never use field: "Location" without type: "single".
      question: "Which studio are you using?",
      field: "Location",
      type: "single",
      required: true,
      answers: ["Metal Fabrication", "Mold Making Studio", "Sewing Studio"],
    },
  ],
};