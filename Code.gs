// Secure relay: the kiosk page (hosted on GitHub Pages) POSTs sign-in data here so the
// Airtable API key never has to live in client-side code.

function doGet(e) {
  return ContentService.createTextOutput(
    'This endpoint is an Airtable relay for the Makerspace kiosk. It only accepts POST requests; the kiosk page itself is hosted on GitHub Pages.'
  );
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
