# Makerspace Sign-In Kiosk
This is a touchscreen sign-in system for Ringling College Makerspace facilities. Visitors use it to check in, select their reason for visiting, and indicate which equipment (or studio) they plan to use. All sign-in data is automatically saved to the Makerspace Airtable to track usage over time.

---

## Table of Contents

1. [How It Works (Overview)](#how-it-works-overview)
2. [What Each File Does](#what-each-file-does)
   - [`kioskCheckIn.html` — The Kiosk Screen](#kioskcheckinhtmlthe-kiosk-screen)
   - [`Code.gs` — Routing and the Secure Relay](#codegsrouting-and-the-secure-relay)
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
   - [3. Set Up the Google Apps Script](#3-set-up-the-google-apps-script)
   - [4. Set Up the Airtable Automations](#4-set-up-the-airtable-automations)
4. [Troubleshooting](#troubleshooting)
5. [Known Limitations and Future Ideas](#known-limitations-and-future-ideas)

---

## How It Works (Overview)

When a visitor walks up to a kiosk, here is what happens step by step:

1. The visitor scans their Ringling ID card using the barcode scanner attached to the kiosk. Their ID number fills in automatically.
2. They tap one of three buttons to indicate their reason for visiting: **Personal Project**, **Academic Project**, or **Work**.
3. Visitors answer additional questions, depending on the kiosk location. 
    - In studios that track equipment use, visitors tap one or more buttons to select which equipment they plan to use. Each button shows a photo or icon of that piece of equipment.
    - Some kiosks serve multiple studios. In this case, visitors will tap which studio they're using, and only one answer can be selected at a time.
4. They tap **Submit**.
5. The kiosk sends the sign-in information to a secure relay service (Google Apps Script), which passes it along to the Airtable database.
6. The screen shows a confirmation message, then resets automatically so it is ready for the next visitor.
7. In Airtable, the incoming sign in record triggers an automation to link the barcode used to sign in to the visitor's user record, pulling the user's name and demographic information (year, department, etc.) into the sign in record.

The entire check-in takes less than 30 seconds.

---

## What Each File Does

### `kioskCheckIn.html` — The Kiosk Screen

This is the main file that runs on the kiosk's screen. It is a single web page that handles everything the visitor sees and interacts with. It is deployed to Google Apps Script alongside `Code.gs` as a Web App, and every kiosk's browser points at the same deployed URL — the URL's `?location=<slug>` query parameter tells the script which location to show (see [`Code.gs`](#codegsrouting-and-the-secure-relay) below).

Key things this file controls:

- **The layout and appearance** of all buttons, text, and colors on screen.
- **Which equipment (or studio) options** are shown as buttons — this can be different per location, defined in the `QUESTIONS` object.
- **The logic** for collecting the visitor's selections and sending them to the database.
- **Auto-scaling** so the interface always fills the screen correctly, no matter what size display you use.

### `Code.gs` — Routing and the Secure Relay

This file has two jobs:

1. **Routing** — `doGet(e)` reads the `?location=<slug>` query parameter from the kiosk's URL, looks it up in the `LOCATION_SLUGS` map to find the full location name, and renders `kioskCheckIn.html` with that name injected as `LOCATION`. `LOCATION_SLUGS` looks like this:
   ```js
   const LOCATION_SLUGS = {
     'bvac101': 'BVAC 101',
     'woodshop': 'Wood Shop',
     'hammond': 'Hammond',
   };
   ```
   To add a new kiosk location, add a new `'slug': 'Full Location Name'` entry here.

2. **Secure relay** — When the visitor taps Submit, the kiosk sends the sign-in data to this script's `doPost(e)`, which calls `submitToAirtable()`. That function adds the Airtable API key (read from Script Properties) and forwards everything to the database. The kiosk never has to handle the API key directly — if it were stored on the kiosk page instead, anyone who looked at the page's source code could find and misuse it.

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

The [Airtable automation]("insert airtable automation link here") helps to organize the incoming sign in records. The steps are as follows:
**Trigger:** When a record is created in the Sign In table.
1. 
2. Find the user record based on the incoming barcode
3. Update the Sign In record with the link to the user, as well as, Major/Dept, Faculty/Student, Email, Semester, and Unique User ID fields.
4. Conditional updates based on the Place Visited
    - If place visited (from the trigger record) is ____, then update the Sign In record's Link to Studios field with the record ID matching the Studio.
---

## Setting Up a New Kiosk

Follow these steps in order to set up a sign-in kiosk at a new location.

### 1. Configure the Kiosk Web Page

#### Adding a Location Slug

Every kiosk shares the same deployed `kioskCheckIn.html` and `Code.gs` — you don't edit the HTML file per kiosk. Instead:

1. Open `Code.gs` and add a new entry to `LOCATION_SLUGS`: `'yourslug': 'Full Location Name'`. Write the full name exactly as you want it to appear in the database.
2. Redeploy the Apps Script (see [3. Set Up the Google Apps Script](#3-set-up-the-google-apps-script)).
3. Point the kiosk's browser at `<your exec URL>?location=yourslug`.

**If your location needs equipment questions**, see [Adding or Changing Equipment Options](#adding-or-changing-equipment-options) below.

#### Adding or Changing Equipment Options

Equipment options are defined in a section of `kioskCheckIn.html` called `QUESTIONS`. Each location can have its own set of question groups, and each group has its own list of equipment options.

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

1. Open `kioskCheckIn.html` in a text editor.
2. Find the section that starts with `const QUESTIONS = {`.
3. Copy an existing location block and paste it, then change the name and the list of equipment options.
4. Make sure the `field` value matches a column name you have created in Airtable.
5. For each equipment option, add a matching photo to the `images/` folder. The filename should be the equipment name, all lowercase, with spaces replaced by hyphens and special characters removed. For example, "CNC Mill" becomes `cnc-mill.jpg`.

**The location name in QUESTIONS must exactly match the full name produced by the corresponding `LOCATION_SLUGS` entry in `Code.gs`.** Capitalization and spacing matter.

#### Single-Select / Required Questions

By default, question buttons are photo-backed and multi-select (a visitor can tap several equipment options). Two optional flags change that behavior:

- `type: "single"` — renders plain colored buttons instead of photos, and only one answer can be selected at a time (like the Reason buttons at the top of the kiosk). Use this when there's no relevant photo, or the question is inherently one-choice-only.
- `required: true` — blocks Submit with a red validation message until the visitor answers this question.

**Worked example — the Hammond kiosk:** one physical kiosk (slug `hammond`, full name `"Hammond"`) serves three studios out of a single building. Rather than run three separate kiosks, it asks a required, single-select question:

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

Once editing is complete, save the file and redeploy the Apps Script for the change to take effect.

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

9. Enter the address of the kiosk page: the Apps Script exec URL with the [slug](#adding-a-location-slug) for this kiosk's location, e.g. `https://script.google.com/macros/s/AKfycbw.../exec?location=bvac101`. Click **Next**.

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

**After any change to `kioskCheckIn.html` or `Code.gs`:** redeploy the Apps Script (a new deployment version), then refresh the kiosk browser:
- Switch to the administrator account as described above.
- Switch back to the Kiosk user account.
- The browser will reload automatically when the session resumes. If it does not, press F5.

#### Final Test

1. Plug the barcode scanner into the kiosk device via USB.
2. Restart the computer and confirm it boots straight into the kiosk page.
3. Scan a barcode and complete a sign-in. Check Airtable to confirm the record appears.
4. If everything is working as planned, then proceed to mount and install the display device in the desired studio.

### 3. Set Up the Google Apps Script

1. Open the Apps Script project (via [script.google.com](https://script.google.com) or `clasp`) containing `Code.gs` and `kioskCheckIn.html`.
2. Under **Project Settings → Script Properties**, set three properties: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE`.
3. Add or update the `LOCATION_SLUGS` entry for your kiosk (see [Adding a Location Slug](#adding-a-location-slug)).
4. Deploy: **Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy**, or **New deployment** if this is the first deploy. Choose **Web app**, execute as yourself, and set access to **Anyone**.
5. Copy the resulting `/exec` URL. If `APPS_SCRIPT_URL` in `kioskCheckIn.html` doesn't already match it, update it and redeploy.
6. Give each kiosk its full URL, including its `?location=<slug>`.

### 4. Set Up the Airtable Automations
Basically, if you changed any questions on the web page, you may need to make sure those changes are also made in Airtable. Table names, field names, field options, etc. all need to match perfectly.
---

## Troubleshooting

**The barcode scanner fills in the ID field, but then nothing happens.**
Make sure the kiosk's URL includes a `?location=<slug>` that matches an entry in `Code.gs`'s `LOCATION_SLUGS`, and that the full name it maps to exactly matches a key in the `QUESTIONS` section of `kioskCheckIn.html`.

**Submitting does not save a record to Airtable.**
- The submission success message on the web page just means the data was sent correctly. It doesn't mean that it was sent to the correct place or that the data was received. 
- Double-check that the `APPS_SCRIPT_URL` is correct and that the Google Apps Script is deployed as a Web app with "Anyone" access.
- Open the browser's developer tools (press F12, then click the Console tab) to look for error messages.
- Confirm that the three Script Properties (API key, Base ID, Table name) are set correctly in Google Apps Script.
- Check the receiving Airtable fields to make sure they match the form fields exactly. Spelling, capitalization, and spacing make a difference.

**A visitor does not have their ID card.**
Currently the kiosk requires a scanned ID number. A future version may allow visitors to type their Ringling email address instead (see Known Limitations below). As a temporary workaround, staff can manually enter a record into Airtable. Or visitors can use the old QR code sign in.

---

## Known Limitations and Future Ideas

The following improvements are planned but not yet implemented:

- **"I don't have my ID" option** — Allow a visitor to enter their Ringling email address instead of scanning an ID barcode.
- **Clear / Reset button** — A visible button that lets a visitor start over if they made a mistake, without having to wait for the form to time out.
- **Streamlined data transfer to Airtable** — Make sure the data coming from the sign in page are going to Airtable in the most efficient way. (Location, Equipment, etc.)
- **Clearer Feedback** Have a more recognizable confirmation screen so people know when they are signed in.

---

*Last updated: July 17 2026*
