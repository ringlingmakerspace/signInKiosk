// Secure relay: the kiosk page (hosted on GitHub Pages) calls this so the Airtable
// API key never has to live in client-side code.
//
// This uses GET, not POST. Apps Script's /exec URL always responds with a 302
// redirect to a script.googleusercontent.com/macros/echo?... URL to deliver output —
// that happens for every request, GET or POST. A browser fetch() automatically
// follows that redirect, and per the HTTP/fetch spec a POST gets silently downgraded
// to a GET on a 302, dropping the request body before it ever reaches doPost. GET
// requests survive the redirect intact, so submissions are sent as a `data` query
// parameter instead.
function doGet(e) {
  const data = e.parameter.data;

  if (!data) {
    return ContentService.createTextOutput(
      'This endpoint is an Airtable relay for the Makerspace kiosk. It only accepts requests with a "data" query parameter; the kiosk page itself is hosted on GitHub Pages.'
    );
  }

  let result;
  try {
    result = { ok: true, record: submitToAirtable(JSON.parse(data)) };
  } catch (err) {
    result = { ok: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
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
