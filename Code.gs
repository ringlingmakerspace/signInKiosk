// Maps the ?location= URL slug to the full location name used in QUESTIONS
// (kioskCheckIn.html) and stored in Airtable. Add an entry here for each kiosk.
const LOCATION_SLUGS = {
  'bvac101': 'BVAC 101',
  'woodshop':    'Wood Shop',
  'hammond': 'Hammond',
  // 'metal':       'Metal Fabrication',
  // 'sewing':      'Sewing Studio',
  // 'moldmaking':  'Mold Making Studio',
  'glass':   'Glass Studio',
  //'printmaking': 'Printmaking Studio',
  // 'sculpture':   'Sculpture Studio',
  // 'bvac135':     'BVAC 135',
};

function doGet(e) {
  const location = LOCATION_SLUGS[e.parameter.location];

  if (!location) {
    return HtmlService.createHtmlOutput(
      'Unknown or missing "location" parameter. Valid options: ' + Object.keys(LOCATION_SLUGS).join(', ')
    );
  }

  const template = HtmlService.createTemplateFromFile('kioskCheckIn');
  template.location = location;

  return template.evaluate()
    .setTitle('Makerspace Sign-In')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitToAirtable(data) {
  const props  = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('AIRTABLE_API_KEY');
  const baseId = props.getProperty('AIRTABLE_BASE_ID');
  const table  = props.getProperty('AIRTABLE_TABLE');

  const resp = UrlFetchApp.fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    }
  );

  if (resp.getResponseCode() < 200 || resp.getResponseCode() >= 300) {
    throw new Error('Airtable returned ' + resp.getResponseCode() + ': ' + resp.getContentText());
  }
  return JSON.parse(resp.getContentText());
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  return ContentService
    .createTextOutput(JSON.stringify(submitToAirtable(data)))
    .setMimeType(ContentService.MimeType.JSON);
}
