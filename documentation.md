# Makerspace Sign-In Kiosk
This is a touchscreen sign-in system for [Ringling College Makerspace](https://sites.google.com/c.ringling.edu/makerspace/home). Visitors use it to check in, select their reason for visiting, and indicate which equipment (or studio) they plan to use. All sign-in data is automatically saved to the Makerspace Airtable to track usage over time.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [What Each File Does](#what-each-file-does)
   - [`index.html` — The Kiosk Screen](#indexhtmlthe-kiosk-screen)
   - [`Code.gs` — The Secure Relay](#codegsthe-secure-relay)
   - [`images/` folder — Equipment Photos](#images-folder--equipment-photos)
   - [Airtable Automation](#airtable-automation)
3. [Setting Up a New Kiosk](#setting-up-a-new-kiosk)
   - [1. Configure the Kiosk Web Page](#1-configure-the-kiosk-web-page)
     - [Adding a Location Slug](#adding-a-location-slug)
     - [Adding or Changing Equipment Options](#adding-or-changing-equipment-options)
     - [Single-Select / Required Questions](#single-select--required-questions)
   - [2. Set Up the Physical Hardware](#2-set-up-the-physical-hardware)
     - [Setting Up Windows 11 Kiosk Mode](#setting-up-windows-11-kiosk-mode)
     - [Final Test](#final-test)
   - [3. Set Up GitHub Pages](#3-set-up-github-pages)
   - [4. Set Up the Google Apps Script](#4-set-up-the-google-apps-script)
   - [5. Set Up the Airtable Automations](#5-set-up-the-airtable-automations)
4. [Troubleshooting](#troubleshooting)
5. [Known Limitations and Future Ideas](#known-limitations-and-future-ideas)

---

## How It Works

When a visitor walks up to a kiosk, here is what happens step by step:

1. The visitor scans their Ringling ID card using the barcode scanner attached to the kiosk. Their ID number fills in automatically.
2. They tap one of three buttons to indicate their reason for visiting: **Personal Project**, **Academic Project**, or **Work**.
3. Visitors answer additional questions, depending on the kiosk location. 
    - In studios that track equipment use, visitors tap one or more buttons to select which equipment they plan to use. Each button shows a photo or icon of that piece of equipment.
    - Some kiosks serve multiple studios. In this case, visitors will tap which studio they're using, and only one answer can be selected at a time.
4. They tap **Submit**.
5. The kiosk page sends the sign-in information to a secure relay service, which passes it along to the Airtable database.
6. The screen shows a confirmation message, then resets automatically so it is ready for the next visitor.
7. In Airtable, the incoming sign in record triggers an automation to link the barcode used to sign in to the visitor's user record, pulling the user's name and demographic information (year, department, etc.) into the sign in record.

---

## What Each File Does

### `index.html` — The Kiosk Screen

This is the main file that runs on the kiosk's screen. It is a single, fully static web page that handles everything the visitor sees and interacts with. It is hosted on GitHub Pages, and every kiosk's browser points at the same published URL — the URL's `?location=<slug>` query parameter tells the page which location to show, resolved entirely in the browser via the `LOCATION_SLUGS` map defined in this file:

```js
const LOCATION_SLUGS = {
  'bvac101': 'BVAC 101',
  'woodshop': 'Wood Shop',
  'hammond': 'Hammond',
};
```

To add a new kiosk location, add a new `'slug': 'Full Location Name'` entry here. If the slug is missing or doesn't match an entry, the page shows an inline error listing the valid options instead of the sign-in form.

Key things this file controls:

- **The layout and appearance** of all buttons, text, and colors on screen.
- **Which equipment (or studio) options** are shown as buttons — this can be different per location, defined in the `QUESTIONS` object.
- **The logic** for collecting the visitor's selections and sending them to the database.
- **Auto-scaling** so the interface always fills the screen correctly, no matter what size display you use.
- **The "I don't have my ID" toggle** — tapping it swaps the ID input into an email input (on-screen keyboard included) for visitors without their ID card. A submitted email must end in `@ringling.edu` or `@c.ringling.edu`, and is sent to Airtable's `Email` field instead of `ID Number`. The form always resets back to ID-scan mode after a successful submission.

### `Code.gs` — The Secure Relay

This file has one job: when the visitor taps Submit, the kiosk page sends the sign-in data to this script's `doGet(e)` as a `data` query parameter, which calls `submitToAirtable()`. That function adds the Airtable API key (read from Script Properties) and forwards everything to the database. The kiosk never has to handle the API key directly — if it were stored on the kiosk page instead, anyone who looked at the page's source code could find and misuse it.

**Why GET instead of POST:** Apps Script's `/exec` URL always responds with a `302` redirect to a `script.googleusercontent.com/macros/echo?...` URL to deliver its output — this happens for every request, GET or POST. A browser's `fetch()` follows that redirect automatically, and per the HTTP/fetch spec a POST is silently downgraded to a GET when following a 302, which drops the request body before it ever reaches the script. A GET survives the redirect intact, so the kiosk sends the whole payload as a URL-encoded `data` parameter instead of a POST body. (There used to be a `doPost(e)` here — it's gone because it's structurally unreachable through a real cross-origin browser `fetch`, not because of anything wrong with the code in it.)

### `images/` folder — Equipment Photos

This folder contains one photo for each piece of equipment that can appear as a button on the kiosk. The photos are displayed as the background of each equipment button so visitors can visually identify what they are selecting.

The equipment buttons are sized as a 2:1 rectangle, so images should also be cropped accordingly. 72 ppi is adequate resolution.

**The photo filenames must match the equipment names used in the kiosk page and must have a `.jpg` extension.** For example, an equipment option named "Laser Cutter" uses the file `laser-cutter.jpg`. If you add a new piece of equipment, you will need to add a matching photo to this folder.

This rule does not apply to **single-select** questions (see [Single-Select / Required Questions](#single-select--required-questions) below) — those render as plain colored buttons with no photo, so no image file is needed.

Current photos included:

| Equipment | File |
|-----------|------|
| 3D Scanner | `3d-scanner.jpg` |
| Bindery | `bindery.jpg` |
| CNC Mill | `cnc-mill.jpg` |
| Filament Printer | `filament-printer.jpg` |
| Guillotine / Paper Cutter | `guillotine-paper-cutter.jpg` |
| Laser Cutter | `laser-cutter.jpg` |
| Presses | `presses.jpg` |
| Resin Printer | `resin-printer.jpg` |
| Risograph | `risograph.jpg` |
| Typesetting | `typesetting.jpg` |
| Vacuum Former | `vacuum-former.jpg` |
| Vinyl Cutter / Cricut | `vinyl-cutter-cricut.jpg` |

### Airtable Automation

The [Airtable automation](https://airtable.com/appYlpxOnZ8ypkFhb/wflGkgFQVWGjl3C8T) helps to organize the incoming sign in records. The steps are as follows:

**Trigger:** When a record is created in the Sign In table.

1. **Run a script:** The script matches the Location field to the correct Studio in the Studios table.
2. **Update record:** Updates the timestamp field with the created date and links to the studio found in the scripting step.
3. **Update record:** Updates the month, semester, and fiscal year fields. This could be done in the previous step, but it is broken out for troubleshooting purposes.
4. Find the user record based on the incoming barcode
- *Conditional Logic: If the number of records found in the previous step equals 1:*
6. **Update record:** Update the Sign In record with the link to the user found in the previous step, as well as, Full Name, Major/Dept, Faculty/Student, and Unique User ID fields.
- *If the number of records found in step 4 does not equal 1, then nothing happens. Records that meet these criteria are examined periodically to link them to user records.*
---

## Setting Up a New Kiosk

Follow these steps in order to set up a sign-in kiosk at a new location.

### 1. Configure the Kiosk Web Page

#### Adding a Location Slug

Every kiosk shares the same published `index.html` — you don't create a separate page per kiosk. Instead:

1. Open `index.html` and add a new entry to `LOCATION_SLUGS`: `'yourslug': 'Full Location Name'`. Write the full name exactly as you want it to appear in the database.
2. Commit and push to `main`. GitHub Pages redeploys automatically — no Apps Script redeploy needed for this step.
3. Point the kiosk's browser at `https://ringlingmakerspace.github.io/signInKiosk/?location=yourslug`.

**If your location needs equipment questions**, see [Adding or Changing Equipment Options](#adding-or-changing-equipment-options) below.

#### Adding or Changing Equipment Options

Equipment options are defined in a section of `index.html` called `QUESTIONS`. Each location can have its own set of question groups, and each group has its own list of equipment options.

Here is what the structure looks like for the Glass Studio location (simplified):

```
"Glass Studio": [
    {
        question: "Which area are you using?",
        field: "Glass Studio Area",
        answers: ["Hot Shop", "Cold Shop"]
    }
]
```

To add a new location or equipment group:

1. Open `index.html` in a text editor.
2. Find the section that starts with `const QUESTIONS = {`.
3. Copy an existing location block and paste it, then change the name and the list of equipment options.
4. Make sure the `field` value matches a column name you have created in Airtable.
5. For each equipment option, add a matching photo to the `images/` folder. The filename should be the equipment name, all lowercase, with spaces replaced by hyphens and special characters removed. For example, "CNC Mill" becomes `cnc-mill.jpg`.

**The location name in QUESTIONS must exactly match the full name produced by the corresponding `LOCATION_SLUGS` entry, also in `index.html`.** Capitalization and spacing matter.

#### Single-Select / Required Questions

By default, question buttons are photo-backed and multi-select (a visitor can tap several equipment options). Two optional flags change that behavior:

- `type: "single"` — renders plain colored buttons instead of photos, and only one answer can be selected at a time (like the Reason buttons at the top of the kiosk). Use this when there's no relevant photo, or the question is inherently one-choice-only.
- `required: true` — blocks Submit with a red validation message until the visitor answers this question.

**Example — the Hammond kiosk:** one physical kiosk (slug `hammond`, full name `"Hammond"`) serves three studios out of a single building. Rather than run three separate kiosks, it asks a required, single-select question:

```js
"Hammond": [
    {
        question: "Which studio are you using?",
        field: "Location",
        type: "single",
        required: true,
        answers: ["Metal Fabrication", "Mold Making Studio", "Sewing Studio"]
    }
],
```

Giving the question `field: "Location"` is a special case: because the selected answer is a single string (thanks to `type: "single"`), it overwrites the kiosk's generic `"Location": "Hammond"` value when the submission is built, so Airtable records the specific studio instead of just "Hammond". **Only do this with `type: "single"`** — pairing `field: "Location"` with the default multi-select behavior would write an array into Airtable's Location field instead of a single studio name.

If a studio in the Hammond building later gets its own dedicated kiosk, give it its own `LOCATION_SLUGS` entry (e.g. `'metal': 'Metal Fabrication'`) instead of adding a `QUESTIONS` entry — a location with no matching `QUESTIONS` key simply skips the extra-questions step.

Once editing is complete, save the file and commit/push to `main` — GitHub Pages redeploys automatically.

### 2. Set Up the Physical Hardware

**What you need:**

- A display device: a tablet or embedded panel PC. 
    - [This is the one](https://a.co/d/0bNqt34O) we are currently using. It runs Windows 11 and is set up for kiosk mode. See [Setting Up Windows 11 Kiosk Mode](#setting-up-windows-11-kiosk-mode) below.
- A USB barcode scanner (configured to work as a keyboard — most do this by default).
    - [Example scanner](https://a.co/d/0diFXhjX)
    - [Another example](https://a.co/d/0diFXhjX)
    - [Yet another](https://a.co/d/0diFXhjX)
- Optional: A way to mount the display device. 
    - [Freestanding option.](https://a.co/d/0iHCw2E7)
    - [Wall-mounted option. (untested)](https://a.co/d/0feRnoVh)

#### Setting Up Windows 11 Kiosk Mode

Windows 11 has a built-in feature called **Assigned Access** that locks the computer to run a single app — in this case, a web browser pointed at the sign-in page. Once enabled, the computer automatically logs in and opens the kiosk page every time it starts up. Visitors cannot access any other part of the computer.

**Before you begin:**
- You need an administrator account on the computer. This is separate from the kiosk account you will create.
- You may want a USB keyboard and mouse to make these steps easier.
**Steps:**

1. Sign in to Windows using your administrator account.

2. Open **Settings** (click the Start menu, then the gear icon).

3. Go to **Accounts** → **Other users**.

4. Scroll to the bottom and click **Set up a kiosk**.

5. Click **Get started**.

6. Create a new local account for the kiosk:
   - Enter a simple username, such as `Kiosk`.
   - Leave the password field blank so the computer can log in automatically.
   - Click **Next**.

7. When asked to choose an app, select **Microsoft Edge** and click **Next**.

8. When asked to choose a kiosk type, select **"As a digital sign or interactive display."** This locks Edge to a single page with no address bar, back button, or way to navigate away. Click **Next**.

9. Enter the address of the kiosk page: the GitHub Pages URL with the [slug](#adding-a-location-slug) for this kiosk's location, e.g. `https://ringlingmakerspace.github.io/signInKiosk/?location=bvac101`. Click **Next**.

10. Set how many minutes of inactivity before the page automatically refreshes. **5 minutes** is a reasonable default for a busy space.

11. Click **Close**, then restart the computer.

After restarting, Windows will automatically log in as the Kiosk user and open Edge fullscreen to the sign-in page. The taskbar, Start menu, and all other Windows controls will be hidden from visitors.

**To access the computer for maintenance** (e.g., to change settings):
- Plug in a keyboard via USB.
- Press **Ctrl + Alt + Del** and click **Switch user**.
- Log in with your administrator account. The kiosk session will remain running in the background.

**To remove kiosk mode entirely:**
- Go to **Settings → Accounts → Other users → Set up a kiosk**.
- Select the kiosk account and click **Remove kiosk**.

**After any change to `index.html`:** commit/push to `main` (GitHub Pages redeploys automatically), then refresh the kiosk browser:
- Switch to the administrator account as described above.
- Switch back to the Kiosk user account.
- The browser will reload automatically when the session resumes. If it does not, press F5.

**After any change to `Code.gs`:** redeploy the Apps Script as a new deployment version (see [4. Set Up the Google Apps Script](#4-set-up-the-google-apps-script)) — no kiosk browser refresh is needed for this, since the kiosk page only talks to the relay's `/exec` URL at submit time.

#### Final Test

1. Plug the barcode scanner into the kiosk device via USB.
2. Restart the computer and confirm it boots straight into the kiosk page.
3. Scan a barcode and complete a sign-in. Check Airtable to confirm the record appears.
4. If everything is working as planned, then proceed to mount and install the display device in the desired studio.

### 3. Set Up GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, and choose the `main` branch with the `/ (root)` folder.
3. Confirm the published URL — it should be `https://ringlingmakerspace.github.io/signInKiosk/`.
4. Every kiosk points its browser at this URL plus its `?location=<slug>` (see [Adding a Location Slug](#adding-a-location-slug)). If the Apps Script relay's `/exec` URL ever changes, update `APPS_SCRIPT_URL` in `index.html` and push — no other config lives outside these two files.

### 4. Set Up the Google Apps Script

1. Open the Apps Script project (via [script.google.com](https://script.google.com) or `clasp`) containing `Code.gs`. This project no longer needs an HTML file — its only job is relaying submissions to Airtable.
2. Under **Project Settings → Script Properties**, set three properties: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE`.
3. Deploy: **Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy**, or **New deployment** if this is the first deploy. Choose **Web app**, execute as yourself, and set access to **Anyone** — not "Anyone with a Google account" (see [Troubleshooting](#troubleshooting) below for why this distinction matters).
4. **Editing an existing deployment's settings and saving is not enough — you must create a New version (or a New deployment) for access or code changes to actually take effect on the live `/exec` URL.** This is the single most common cause of "the kiosk says it worked but nothing shows up in Airtable."
5. Copy the resulting `/exec` URL. If `APPS_SCRIPT_URL` in `index.html` doesn't already match it, update it and push to `main`.

### 5. Set Up the Airtable Automations
Basically, if you changed any questions on the web page, you may need to make sure those changes are also made in Airtable. Table names, field names, field options, etc. all need to match perfectly.
---

## Troubleshooting

**The barcode scanner fills in the ID field, but then nothing happens.**
Make sure the kiosk's URL includes a `?location=<slug>` that matches an entry in `index.html`'s `LOCATION_SLUGS`, and that the full name it maps to exactly matches a key in the `QUESTIONS` section of the same file.

**Submitting does not save a record to Airtable.**
- The submission success message on the web page just means the data was sent correctly. It doesn't mean that it was sent to the correct place or that the data was received.
- Double-check that the `APPS_SCRIPT_URL` is correct and that the Google Apps Script is deployed as a Web app with "Anyone" access.
- Open the browser's developer tools (press F12, then click the Console tab) to look for error messages.
- Confirm that the three Script Properties (API key, Base ID, Table name) are set correctly in Google Apps Script.
- Check the receiving Airtable fields to make sure they match the form fields exactly. Spelling, capitalization, and spacing make a difference.

**Submitting appears to succeed but no record ever shows up, and the Apps Script Executions log shows nothing ran.**
This was the actual root cause behind the original "made it public and it broke" report, and it isn't an access-permission problem. Apps Script's `/exec` URL always 302-redirects to a `script.googleusercontent.com/macros/echo?...` URL to deliver its response — for every request, GET or POST. When a browser's `fetch()` follows that redirect, a POST gets silently downgraded to a GET (per the HTTP/fetch spec), which drops the request body before it ever reaches the script — so a function like `doPost` never runs, and the Executions log stays empty. This is why the relay now uses GET with the payload in a `data` query parameter (see [`Code.gs`](#codegsthe-secure-relay) above) — GET requests survive the redirect intact. If records still aren't arriving:
- Confirm you can see the response, not just an "opaque" no-cors result: the kiosk's `submitForm()` now does `await fetch(url); await res.json()` and checks `result.ok` — a real error (bad API key, wrong table name, etc.) will show up as the red status message and in the browser console (F12 → Console), rather than silently reporting success.
- To check the relay directly, hit it with a plain GET and read the JSON body:
  ```
  curl -sL '<your /exec URL>?data=%7B%22fields%22%3A%7B%22ID%20Number%22%3A%22123456%22%2C%22Location%22%3A%22Test%22%2C%22Reason%22%3A%22Personal%20Project%22%7D%7D'
  ```
  (that's `-L` to follow the redirect, and `?data=` holding `{"fields":{"ID Number":"123456","Location":"Test","Reason":"Personal Project"}}`, URL-encoded). A working relay returns `{"ok":true,"record":{...}}`; `{"ok":false,"error":"..."}` means Airtable rejected the request (check the error message); anything else means the deployment itself is misconfigured.

**Making Apps Script access "Anyone" doesn't take effect.**
Access and execute-as changes only apply on a *new* deployment version — editing an existing deployment's settings and clicking Save does *not* republish them to the live `/exec` URL. Go through **Deploy → Manage deployments → Edit → New version → Deploy** (see [4. Set Up the Google Apps Script](#4-set-up-the-google-apps-script)). Also double check "Anyone" is selected, not "Anyone with a Google account" — the latter requires a Google sign-in, which an anonymous kiosk visitor can't complete.

**A visitor does not have their ID card.**
Tap **"I don't have my ID"** next to the ID field — it switches to an email input where the visitor can type their Ringling email (`@ringling.edu` or `@c.ringling.edu`) instead. This is sent to Airtable's `Email` field rather than `ID Number`. As a fallback, staff can still manually enter a record into Airtable, or visitors can use the old QR code sign in.

---

## Known Limitations and Future Ideas

The following improvements are planned but not yet implemented:

- **Clear / Reset button** — A visible button that lets a visitor start over if they made a mistake, without having to wait for the form to time out.
- **Clearer Feedback** Have a more recognizable confirmation screen so people know when they are signed in.

---

*Last updated: July 21 2026*
