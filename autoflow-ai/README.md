# AutoFlow AI — inbox + missed calls, MVP 0.1

Adds a **real Gmail automation** to the existing AiAgency/AutoFlow product. Repair shops keep their regular Gmail address, and owners see new cases and summaries in their regular mail client. No daily CRM login is needed. A first-time setup with the owner's Google authorization **is required**.

## What works in this version

- A Gmail Apps Script checks new Inbox threads every **5 minutes**.
- Detects auto-replies/newsletters and its own notifications to avoid loops.
- Detects common automotive categories (SRS, brakes, starting, STK, ordinary service, tires).
- Extracts available make, year, telephone, VIN; flags missing information. Extraction is deterministic, not a generative AI model.
- Stores every new case in a private Google Sheet owned by the workshop.
- Sends customer **receipt acknowledgment only** (not diagnosis, price or confirmed slot).
- Sends owner a short case summary to their existing email inbox.
- Sends owner a daily report of newly received cases.
- Accepts signed missed-call events using an **optional** Apps Script webhook; creates a sheet entry and a callback alert.
- Demo page `index.html` illustrates the flow safely; it does **not** send live email or connect a telephone.

## Quick start — Gmail for a first workshop

1. In the workshop Gmail account, open https://script.google.com/ → **New project**.
2. Paste `Code.gs`, then enable the editor's manifest view and copy `appsscript.json` (V8 runtime).
3. Change `AF_settings()` in `Code.gs`: real `workshopName`, `ownerEmail` and optional `workshopPhone`.
4. Run `AF_install()` once, approve Google's Gmail/Sheets authorization. Google will create a private sheet and two triggers.
5. Send a **new** test email from another address to the workshop Gmail (installation intentionally ignores older mail).
6. Within about five minutes, the sender should receive a receipt; the owner should get a summary, and the Google Sheet should gain a new row.
7. If needed, run `AF_pause()` to stop automatically processing mail; all previously processed data remains.

**Important:** Run the script in a business account with permission to access mail. It needs broad Gmail permissions; do not share the Apps Script project publicly. In the EU, set up GDPR notice/retention, access controls and a processor agreement before onboarding real clients. Do not feed client messages into external AI services without appropriate authorization.

## Existing telephone number

A standalone app cannot intercept calls to an ordinary mobile number. The mobile carrier/VoIP provider must support **conditional call forwarding** or missed-call webhooks. The existing project `marjanmitrovic/prague-ai-voice` already includes `POST /api/voice/missed-call` with `VOICE_GATEWAY_TOKEN` for this purpose. Configure a telephony provider to send authenticated missed-call information there.

Alternatively, to ingest missed calls in this Apps Script:

1. Add a long, unpredictable `AF_PHONE_WEBHOOK_SECRET` (at least 24 characters) under Project Settings → Script Properties. Do not write it into source code or put it on a public web page.
2. Deploy the Apps Script as a Web App, executing as the owner's account. The chosen telephony gateway must call the URL with JSON `{"token":"...","callId":"unique-random-id","customerPhone":"+420...","message":"..."}`.
3. Confirm in the private Google Sheet that the event was received only once. The owner receives an email requesting a callback. **No voice conversation is answered by Apps Script.**
4. For production, a gateway authenticated via HTTPS headers and proper server-side throttling (e.g. `prague-ai-voice`) is preferable to Apps Script web app token auth; Google Apps Script may return HTTP 200 even when payload says `ok:false`.

## Privacy and limitations

- Works with **Gmail**, not arbitrary IMAP/Microsoft mailboxes yet.
- Works with new inquiries in the Inbox, not spam.
- Every conversation gets one automated acknowledgement. Continued conversation is handled normally by the owner in Gmail.
- Basic parser does not accurately recognize every model or every phone format; the message text is preserved.
- A trigger may be delayed by Apps Script quota and Google scheduling.
- Owner confirmation is always necessary for quotation and available appointment slots.
- Automated customer receipts are on by default; set `customerAutoReply: false` to retain a supervised-only pilot.
- `GmailApp.sendEmail` sends using the workshop's Google account; access is granted once. For multiple businesses, each installs into their own account (future version: central OAuth onboarding).
- Use restricted access to the Google Sheet; establish an appropriate retention/deletion policy before processing real customer information.

## Development

`node --test test.mjs` executes basic parsing, notification and deduplication tests under a mocked Apps Script runtime. `index.html` is a browser-only interactive simulation, not the production email integration.