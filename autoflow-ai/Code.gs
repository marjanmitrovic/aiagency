/**
 * AutoFlow AI — Gmail-first workshop intake, version 0.1.
 * Production emails only after a shop owner runs AF_install() and grants access.
 * No external AI vendor; extraction is deterministic and conservative.
 * Deployment: Google Apps Script, bound to the workshop's EXISTING Gmail inbox.
 */
const AF = Object.freeze({
  version: '0.1.0',
  labelName: 'AutoFlow/Nové poptávky',
  columns: ['Přijato', 'Zdroj', 'Stav', 'Zákazník', 'E-mail / telefon', 'Předmět', 'Vozidlo', 'Rok', 'Telefon', 'VIN', 'Závada / zpráva', 'ID konverzace'],
  search: 'in:inbox newer_than:3d',
  threadLimit: 75,
  lockMs: 2000,
});

/** Edit only these settings ONCE at installation. Never publish customer data. */
function AF_settings() {
  return {
    workshopName: 'Autoservis Demo',
    ownerEmail: '',           // e.g. majitel@servis.cz; may be same existing mailbox
    workshopPhone: '',        // existing workshop telephone, printed in customer reply
    customerAutoReply: true,  // auto-confirm receipt, NEVER price or booking
    language: 'cs',
  };
}

/** Install in the shop's Gmail account. No daily dashboard or extra login. */
function AF_install() {
  const cfg = AF_settings();
  const props = PropertiesService.getScriptProperties();
  if (!cfg.ownerEmail || !AF_emailValid(cfg.ownerEmail)) {
    throw new Error('Vyplňte ownerEmail v AF_settings() před instalací.');
  }
  if (!GmailApp.getUserLabelByName(AF.labelName)) GmailApp.createLabel(AF.labelName);
  let sheetId = props.getProperty('AF_SHEET_ID');
  if (!sheetId) {
    const book = SpreadsheetApp.create('AutoFlow AI — přijaté poptávky');
    const sheet = book.getSheets()[0];
    sheet.setName('Poptávky');
    sheet.appendRow(AF.columns);
    sheet.setFrozenRows(1);
    props.setProperty('AF_SHEET_ID', book.getId());
    sheetId = book.getId();
  }
  // Install or update the 30-minute inbox trigger.
  AF_setHalfHourInterval();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'AF_dailySummary')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('AF_dailySummary').timeBased().everyDays(1).atHour(8).create();
  props.setProperty('AF_INSTALLED_AT', new Date().toISOString());
  Logger.log('AutoFlow nastaven. Tabulka: ' + SpreadsheetApp.openById(sheetId).getUrl());
  // Do not scan historic mail at installation: only incoming messages newer than installation.
}

/** Upgrade an existing installation from 5 to 30 minutes without resetting its history. */
function AF_setHalfHourInterval() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'AF_processInbox')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('AF_processInbox').timeBased().everyMinutes(30).create();
}

/** Pause email processing without deleting customer data. */
function AF_pause() {
  ScriptApp.getProjectTriggers().filter(t => ['AF_processInbox', 'AF_dailySummary'].indexOf(t.getHandlerFunction()) !== -1)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

/** Run on a 30-minute clock trigger. Incoming customer mail stays in Gmail. */
function AF_processInbox() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(AF.lockMs)) return;
  try {
    const cfg = AF_settings();
    const props = PropertiesService.getScriptProperties();
    const installed = props.getProperty('AF_INSTALLED_AT');
    if (!installed) throw new Error('Nejdříve spusťte AF_install().');
    const since = new Date(installed).getTime();
    const myAddress = Session.getEffectiveUser().getEmail().toLowerCase();
    const aliases = GmailApp.getAliases().map(s => s.toLowerCase());
    const threads = GmailApp.search(AF.search, 0, AF.threadLimit);
    const label = GmailApp.getUserLabelByName(AF.labelName);
    threads.forEach(thread => {
      const threadKey = 'AF_DONE_' + thread.getId();
      if (props.getProperty(threadKey)) return;
      const first = thread.getMessages().find(m => m.getDate().getTime() >= since && AF_isCustomerMail(m, myAddress, aliases));
      if (!first) return;
      const claimed = 'AF_BUSY_' + thread.getId();
      const busy = Number(props.getProperty(claimed) || 0);
      if (busy > Date.now() - 10 * 60 * 1000) return;
      props.setProperty(claimed, String(Date.now()));
      try {
        const sender = AF_extractAddress(first.getFrom());
        const data = AF_extract(first.getSubject(), first.getPlainBody());
        AF_appendRow('e-mail', 'Nové', sender, first.getSubject(), data, thread.getId());
        // Mark sent BEFORE SMTP call prevents accidental duplicate mail on trigger retry.
        // A failed send is recorded and manually reviewable; no silent resending.
        props.setProperty(threadKey, 'recorded');
        if (cfg.customerAutoReply) {
          try {
            GmailApp.sendEmail(sender, 'Re: ' + first.getSubject().replace(/^(Re:\s*)+/i, '').slice(0, 140), AF_customerReply(cfg, data), {
              name: cfg.workshopName, replyTo: myAddress || cfg.ownerEmail,
            });
            props.setProperty(threadKey, 'customer_ack_sent');
          } catch (mailError) {
            props.setProperty(threadKey, 'customer_ack_failed');
            Logger.log('AutoFlow ack failed for ' + thread.getId() + ': ' + String(mailError));
          }
        }
        try {
          GmailApp.sendEmail(cfg.ownerEmail, '[AutoFlow] Nová poptávka: ' + first.getSubject().slice(0, 110),
            AF_ownerAlert(sender, first.getSubject(), data), { name: 'AutoFlow AI' });
        } catch (ownerError) {
          Logger.log('AutoFlow owner notification failed for ' + thread.getId() + ': ' + String(ownerError));
        }
        if (label) label.addToThread(thread);
      } finally {
        props.deleteProperty(claimed);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function AF_isCustomerMail(message, myAddress, aliases) {
  const sender = AF_extractAddress(message.getFrom());
  if (!AF_emailValid(sender)) return false;
  if (sender === myAddress || aliases.indexOf(sender) !== -1) return false;
  if (/(?:no-?reply|mailer-daemon|postmaster|bounce)@/i.test(sender)) return false;
  const subject = message.getSubject() || '';
  if (/\[AutoFlow\]|out of office|automatick[aá] odpov[eě][dď]|delivery status notification|nedoru[čc]/i.test(subject)) return false;
  const raw = message.getRawContent().slice(0, 9000).split(/\r?\n\r?\n/)[0];
  if (/^(Auto-Submitted:\s*(?!no\b)|Precedence:\s*(?:bulk|list|junk)|List-Unsubscribe:)/im.test(raw)) return false;
  if (!String(message.getPlainBody() || '').trim()) return false;
  return true;
}

function AF_extractAddress(from) {
  const match = String(from || '').match(/<([^<>\s]+@[^<>\s]+)>/);
  return (match ? match[1] : String(from || '').trim()).toLowerCase();
}
function AF_emailValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)); }

/** No invented prices, fault diagnoses, calendar slots or confirmed appointments. */
function AF_extract(subject, body) {
  const clean = String(subject || '') + '\n' + String(body || '').slice(0, 5000);
  const normalized = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const makes = ['Citroën', 'Peugeot', 'Škoda', 'Volkswagen', 'Renault', 'Ford', 'Opel', 'Toyota', 'Hyundai', 'Kia', 'BMW', 'Audi', 'Mercedes', 'Dacia', 'Fiat', 'Seat', 'Mazda', 'Honda'];
  const make = makes.find(m => normalized.includes(m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())) || '';
  const year = clean.match(/\b(?:19[89]\d|20[0-3]\d)\b/);
  const vin = clean.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  const phone = clean.match(/(?:\+420[\s-]?)?(?:\d[\s-]?){9}\b/);
  let category = 'Obecný dotaz';
  if (/airbag|srs|air.?bag|kontrolk.*airbag/.test(normalized)) category = 'Airbag / SRS';
  else if (/brzd|brake|abs|esp/.test(normalized)) category = 'Brzdy / ABS';
  else if (/start|bateri|alternator/.test(normalized)) category = 'Startování / elektro';
  else if (/stk|emisi|technick.*kontrol/.test(normalized)) category = 'STK / emise';
  else if (/olej|filtr|servisni prohlid/.test(normalized)) category = 'Běžný servis';
  else if (/pneumatik|prezuti|kolo/.test(normalized)) category = 'Pneumatiky';
  const description = String(body || '').trim().slice(0, 1500);
  const missing = [];
  if (!make) missing.push('značku a model vozidla');
  if (!year) missing.push('rok výroby');
  if (!description || description.length < 15) missing.push('popis závady');
  if (!phone) missing.push('kontaktní telefon');
  return { make, year: year ? year[0] : '', vin: vin ? vin[0] : '', phone: phone ? phone[0].trim() : '',
    category, description, missing };
}

function AF_customerReply(cfg, data) {
  const lines = [
    'Dobrý den,', '',
    'děkujeme za zprávu. Vaši poptávku jsme přijali a předali servisu ' + cfg.workshopName + '.',
    'Servis ověří možnosti opravy, termín a cenu a ozve se vám osobně.',
    'Tato automatická zpráva není potvrzením objednání ani cenovou nabídkou.',
  ];
  if (data.missing.length) lines.push('', 'Pokud můžete, doplňte prosím: ' + data.missing.join(', ') + '. Stačí odpovědět na tento e-mail.');
  if (cfg.workshopPhone) lines.push('', 'Telefon servisu: ' + cfg.workshopPhone);
  return lines.concat(['', 'S pozdravem', cfg.workshopName, '(automatické potvrzení přijetí)']).join('\n');
}
function AF_ownerAlert(sender, subject, data) {
  return ['Nová poptávka — AutoFlow AI', '', 'Zákazník: ' + sender, 'Předmět: ' + subject,
    'Kategorie: ' + data.category, 'Vozidlo: ' + (data.make || 'nezadáno'),
    'Rok: ' + (data.year || 'nezadáno'), 'Telefon: ' + (data.phone || 'nezadáno'),
    'VIN: ' + (data.vin || 'nezadáno'), '', 'Popis:', data.description,
    '', 'Chybí: ' + (data.missing.join(', ') || 'základní údaje jsou uvedeny'),
    '', 'Akce: odpovězte zákazníkovi na původní e-mail; cenu a termín potvrďte sami.',
  ].join('\n');
}

function AF_appendRow(source, status, sender, subject, data, id) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('AF_SHEET_ID');
  if (!sheetId) throw new Error('Chybí tabulka; spusťte AF_install().');
  // Prefix text with apostrophe when it could execute as a spreadsheet formula.
  const safe = v => { const s = String(v || '').slice(0, 1500); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; };
  SpreadsheetApp.openById(sheetId).getSheets()[0].appendRow([
    new Date(), safe(source), safe(status), safe(sender), safe(sender), safe(subject), safe(data.make), safe(data.year),
    safe(data.phone), safe(data.vin), safe(data.description), safe(id),
  ]);
}

/** One daily email to the existing inbox — never a second app to open. */
function AF_dailySummary() {
  const cfg = AF_settings();
  if (!cfg.ownerEmail) return;
  const sheetId = PropertiesService.getScriptProperties().getProperty('AF_SHEET_ID');
  if (!sheetId) return;
  const rows = SpreadsheetApp.openById(sheetId).getSheets()[0].getDataRange().getValues().slice(1);
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const recent = rows.filter(r => new Date(r[0]).getTime() >= since);
  if (!recent.length) return;
  const grouped = recent.reduce((a, r) => { a[r[1]] = (a[r[1]] || 0) + 1; return a; }, {});
  const body = ['AutoFlow AI — přehled za posledních 24 hodin', '', 'Nové požadavky: ' + recent.length]
    .concat(Object.keys(grouped).map(k => k + ': ' + grouped[k]))
    .concat(['', 'Odpovězte zákazníkům ve své běžné e-mailové schránce.']).join('\n');
  GmailApp.sendEmail(cfg.ownerEmail, '[AutoFlow] Denní souhrn (' + recent.length + ')', body);
}

/** Optional missed-call provider webhook — existing phone via operator forwarding. */
function doPost(e) {
  const respond = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('AF_PHONE_WEBHOOK_SECRET');
  if (!secret || secret.length < 24) return respond({ ok: false, error: 'phone_webhook_disabled' });
  let payload;
  try { payload = JSON.parse(e.postData.contents); } catch { return respond({ ok: false, error: 'bad_json' }); }
  if (payload.token !== secret) return respond({ ok: false, error: 'unauthorized' });
  const callId = String(payload.callId || '');
  const phone = String(payload.customerPhone || '').slice(0, 50);
  const note = String(payload.message || 'Zmeškaný hovor').slice(0, 1500);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(callId) || !phone) return respond({ ok: false, error: 'invalid_call' });
  const key = 'AF_CALL_' + callId;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) return respond({ ok: false, error: 'busy' });
  try {
    if (props.getProperty(key)) return respond({ ok: true, duplicate: true });
    AF_appendRow('zmeškaný hovor', 'Zavolat zpět', phone, 'Telefonický dotaz', {
      make: '', year: '', phone, vin: '', description: note,
    }, callId);
    props.setProperty(key, new Date().toISOString());
    const cfg = AF_settings();
    if (cfg.ownerEmail) GmailApp.sendEmail(cfg.ownerEmail, '[AutoFlow] Zavolat zpět: ' + phone,
      'Nový zmeškaný hovor\nTelefon: ' + phone + '\nZpráva: ' + note + '\n\nZavolejte zákazníkovi zpět.');
    return respond({ ok: true });
  } catch (error) {
    Logger.log('AutoFlow phone webhook: ' + String(error));
    return respond({ ok: false, error: 'internal_error' });
  } finally { lock.releaseLock(); }
}

/** Set a long random token (>= 24 chars) as Script Property AF_PHONE_WEBHOOK_SECRET; never hardcode it. */
