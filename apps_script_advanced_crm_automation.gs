/**
 * Prague AI Growth - Advanced CRM Automation
 *
 * Adds:
 * - CRM status colors
 * - package calculator: Starter / Growth / Premium
 * - daily lead summary email
 * - 24h follow-up reminder for New Lead / Contacted statuses
 *
 * Setup:
 * 1. Paste into Apps Script.
 * 2. Run setupCrmSheet().
 * 3. Run installDailyTriggers().
 * 4. Deploy as Web App or create new version in existing Web App deployment.
 */

const SHEET_NAME = "CRM Leads";
const OWNER_EMAIL = "marjan.posao@gmail.com";
const WHATSAPP_NUMBER = "+420722080268";

const HEADERS = [
  "Timestamp",
  "Language",
  "Name",
  "Email",
  "Phone",
  "Business Type",
  "Demo Interest",
  "Problem",
  "Message",
  "Source",
  "Page URL",
  "User Agent",
  "Status",
  "Next Step",
  "Recommended Package",
  "Estimated Price",
  "WhatsApp First Message",
  "Proposal Template",
  "Follow-Up Due",
  "Last Contacted",
  "Notes"
];

const STATUS_COLORS = {
  "New Lead": "#fef3c7",
  "Contacted": "#dbeafe",
  "Demo Booked": "#ede9fe",
  "Offer Sent": "#fce7f3",
  "Won": "#dcfce7",
  "Lost": "#fee2e2"
};

function setupCrmSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#07111f")
    .setFontColor("#ffffff");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);

  const statusCol = col_("Status");
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New Lead", "Contacted", "Demo Booked", "Offer Sent", "Won", "Lost"], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, statusCol, 2000, 1).setDataValidation(statusRule);

  const packageCol = col_("Recommended Package");
  const packageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Starter", "Growth", "Premium"], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, packageCol, 2000, 1).setDataValidation(packageRule);

  applyStatusFormatting_();
}

function doPost(e) {
  try {
    const data = parsePayload_(e);
    const recommendation = recommendPackage_(data);
    const workflow = getWorkflowContent_(data.language, data, recommendation);
    const result = saveLead_(data, workflow, recommendation);

    sendLeadEmail_(data);
    notifyOwner_(data, workflow, recommendation, result.row);

    return jsonResponse_({
      ok: true,
      message: "Lead saved",
      row: result.row
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err)
    });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "Prague AI Growth Advanced CRM",
    status: "running"
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("No POST body received");
  }

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error("Invalid JSON body");
  }

  return {
    language: clean_(data.language || "en"),
    name: clean_(data.name || ""),
    email: clean_(data.email || ""),
    phone: clean_(data.phone || ""),
    business_type: clean_(data.business_type || ""),
    demo_interest: clean_(data.demo_interest || ""),
    problem: clean_(data.problem || ""),
    message: clean_(data.message || ""),
    source: clean_(data.source || "Website"),
    page_url: clean_(data.page_url || ""),
    user_agent: clean_(data.user_agent || "")
  };
}

function saveLead_(data, workflow, recommendation) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setupCrmSheet();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const now = new Date();
  const followUpDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rowValues = [
    now,
    data.language,
    data.name,
    data.email,
    data.phone,
    data.business_type,
    data.demo_interest,
    data.problem,
    data.message,
    data.source,
    data.page_url,
    data.user_agent,
    "New Lead",
    workflow.nextStep,
    recommendation.package,
    recommendation.price,
    workflow.whatsapp,
    workflow.proposal,
    followUpDue,
    "",
    ""
  ];

  sheet.appendRow(rowValues);
  const row = sheet.getLastRow();
  colorStatusCell_(sheet, row);
  return { row };
}

function recommendPackage_(data) {
  const text = `${data.business_type} ${data.demo_interest} ${data.problem} ${data.message}`.toLowerCase();

  if (
    text.includes("shift") ||
    text.includes("security") ||
    text.includes("crm") ||
    text.includes("advanced") ||
    text.includes("custom") ||
    text.includes("payroll") ||
    text.includes("smene") ||
    text.includes("smena") ||
    text.includes("bezpečnost")
  ) {
    return {
      package: "Premium",
      price: "€1499+",
      reason: "Complex workflow / shift or custom automation"
    };
  }

  if (
    text.includes("booking") ||
    text.includes("reservation") ||
    text.includes("restaurant") ||
    text.includes("auto") ||
    text.includes("follow") ||
    text.includes("rezerv") ||
    text.includes("zakaz") ||
    text.includes("restoran") ||
    text.includes("autoservis")
  ) {
    return {
      package: "Growth",
      price: "€699",
      reason: "Booking / reservation / follow-up workflow"
    };
  }

  return {
    package: "Starter",
    price: "€299",
    reason: "Basic AI lead capture / chatbot setup"
  };
}

function sendLeadEmail_(data) {
  if (!data.email) return;

  const lang = normalizeLang_(data.language);
  const content = emailContent_(lang, data);

  GmailApp.sendEmail(
    data.email,
    content.subject,
    content.text,
    {
      name: "Prague AI Growth",
      htmlBody: content.html
    }
  );
}

function notifyOwner_(data, workflow, recommendation, row) {
  const subject = `New AI Lead: ${data.demo_interest || "Demo request"} - ${data.name || "Unknown"}`;

  const text =
`New lead received.

CRM Row: ${row}

LANGUAGE: ${data.language}
NAME: ${data.name}
EMAIL: ${data.email}
PHONE: ${data.phone}
BUSINESS TYPE: ${data.business_type}
DEMO INTEREST: ${data.demo_interest}
PROBLEM: ${data.problem}

RECOMMENDED PACKAGE:
${recommendation.package} - ${recommendation.price}
Reason: ${recommendation.reason}

MESSAGE:
${data.message}

NEXT STEP:
${workflow.nextStep}

WHATSAPP FIRST MESSAGE:
${workflow.whatsapp}

PROPOSAL TEMPLATE:
${workflow.proposal}

PAGE:
${data.page_url}`;

  GmailApp.sendEmail(OWNER_EMAIL, subject, text, {
    name: "Prague AI Growth CRM"
  });
}

function getWorkflowContent_(lang, data, recommendation) {
  lang = normalizeLang_(lang);
  const demo = data.demo_interest || "AI demo";
  const pkg = `${recommendation.package} (${recommendation.price})`;

  if (lang === "sr") {
    return {
      nextStep: "Pošalji WhatsApp poruku i promeni status u Contacted",
      whatsapp:
`Zdravo ${data.name || ""}, video sam vaš zahtev za ${demo} preko Prague AI Growth sajta.

Hvala na interesovanju.

Mogu kratko da pogledam vaš slučaj i pokažem kako bi AI sistem mogao da pomogne vašoj firmi oko zakazivanja, poruka, leadova ili organizacije posla.

Da li vam više odgovara kratak poziv danas ili sutra?`,
      proposal:
`Zdravo ${data.name || ""},

na osnovu vašeg zahteva, preporučujem paket: ${pkg}.

Sistem bi uključivao:
- AI lead/kontakt formu
- automatski odgovor klijentu
- Google Sheets CRM
- email notifikacije
- WhatsApp follow-up tok
- osnovni demo/booking workflow

Cilj: manje propuštenih leadova, brži odgovori i manje ručnog rada.

Srdačno,
Prague AI Growth`
    };
  }

  if (lang === "cz") {
    return {
      nextStep: "Poslat WhatsApp zprávu a změnit status na Contacted",
      whatsapp:
`Dobrý den ${data.name || ""}, viděl jsem vaši žádost o ${demo} přes web Prague AI Growth.

Děkuji za zájem.

Můžu se krátce podívat na váš případ a ukázat, jak by AI systém mohl pomoci vaší firmě s rezervacemi, zprávami, leady nebo každodenním provozem.

Hodí se vám krátký hovor dnes nebo zítra?`,
      proposal:
`Dobrý den ${data.name || ""},

na základě vaší žádosti doporučuji balíček: ${pkg}.

Systém by zahrnoval:
- AI lead/kontaktní formulář
- automatickou odpověď zákazníkovi
- Google Sheets CRM
- emailové notifikace
- WhatsApp follow-up tok
- základní demo/rezervační workflow

Cíl: méně ztracených leadů, rychlejší odpovědi a méně ruční práce.

S pozdravem,
Prague AI Growth`
    };
  }

  return {
    nextStep: "Send WhatsApp message and change status to Contacted",
    whatsapp:
`Hi ${data.name || ""}, I saw your ${demo} request through the Prague AI Growth website.

Thanks for your interest.

I can quickly review your case and show how an AI system could help your business with bookings, messages, leads, or daily operations.

Would a short call work better today or tomorrow?`,
    proposal:
`Hi ${data.name || ""},

based on your request, I recommend starting with: ${pkg}.

The system would include:
- AI lead/contact form
- automated customer reply
- Google Sheets CRM
- email notification
- WhatsApp follow-up flow
- basic demo/booking workflow

The goal is simple: fewer missed leads, faster replies, and less manual work.

Best regards,
Prague AI Growth`
  };
}

function emailContent_(lang, data) {
  const waUrl = "https://wa.me/420722080268";

  if (lang === "sr") {
    return makeEmail_(
      "Vaš AI demo zahtev je primljen",
      `Zdravo ${data.name || ""},`,
      [
        "Hvala na interesovanju za AI demo.",
        `Primio sam vaš zahtev za: ${data.demo_interest}`,
        `Najveći problem koji ste naveli: ${data.problem}`,
        "Sledeći korak je kratak besplatan AI audit gde ćemo videti kako AI može da pomogne vašoj firmi."
      ],
      "Kontakt preko WhatsApp-a",
      waUrl
    );
  }

  if (lang === "cz") {
    return makeEmail_(
      "Vaše žádost o AI demo byla přijata",
      `Dobrý den ${data.name || ""},`,
      [
        "děkujeme za váš zájem o AI demo.",
        `Obdrželi jsme vaši žádost o: ${data.demo_interest}`,
        `Největší problém, který jste uvedli: ${data.problem}`,
        "Dalším krokem je krátký bezplatný AI audit, kde se podíváme, jak může AI pomoci vaší firmě."
      ],
      "Kontaktovat přes WhatsApp",
      waUrl
    );
  }

  return makeEmail_(
    "Your AI demo request has been received",
    `Hi ${data.name || ""},`,
    [
      "Thank you for your interest in our AI demo.",
      `I received your request for: ${data.demo_interest}`,
      `Biggest problem you selected: ${data.problem}`,
      "The next step is a short free AI audit where we look at how AI can help your business save time and automate daily work."
    ],
    "Contact on WhatsApp",
    waUrl
  );
}

function makeEmail_(subject, greeting, lines, buttonText, buttonUrl) {
  const text =
`${greeting}

${lines.join("\n\n")}

${buttonText}:
${buttonUrl}

Prague AI Growth
${WHATSAPP_NUMBER}`;

  const htmlLines = lines.map(line => `<p style="margin:0 0 14px;color:#334155;line-height:1.6">${escapeHtml_(line)}</p>`).join("");

  const html =
`<div style="margin:0;padding:28px;background:#f8fafc;font-family:Arial,sans-serif">
  <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:22px;padding:28px;border:1px solid #e2e8f0">
    <div style="font-weight:800;color:#0891b2;letter-spacing:.04em;margin-bottom:12px">PRAGUE AI GROWTH</div>
    <h1 style="margin:0 0 18px;color:#0f172a;font-size:26px">${escapeHtml_(subject)}</h1>
    <p style="margin:0 0 14px;color:#334155;line-height:1.6">${escapeHtml_(greeting)}</p>
    ${htmlLines}
    <a href="${buttonUrl}" style="display:inline-block;margin-top:10px;background:#06b6d4;color:#06111f;text-decoration:none;padding:14px 18px;border-radius:14px;font-weight:800">${escapeHtml_(buttonText)}</a>
    <p style="margin:22px 0 0;color:#64748b;font-size:13px">Prague AI Growth • ${WHATSAPP_NUMBER}</p>
  </div>
</div>`;

  return { subject, text, html };
}

/**
 * Sends a daily summary email.
 * Run manually to test.
 * Trigger with installDailyTriggers().
 */
function sendDailyLeadSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0];
  const rows = values.slice(1);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const timestampIdx = headers.indexOf("Timestamp");
  const statusIdx = headers.indexOf("Status");
  const nameIdx = headers.indexOf("Name");
  const demoIdx = headers.indexOf("Demo Interest");
  const packageIdx = headers.indexOf("Recommended Package");
  const priceIdx = headers.indexOf("Estimated Price");

  const todaysRows = rows.filter(row => {
    const ts = row[timestampIdx];
    return ts instanceof Date && ts >= start;
  });

  const openRows = rows.filter(row => {
    const status = row[statusIdx];
    return status === "New Lead" || status === "Contacted" || status === "Demo Booked";
  });

  const statusCounts = {};
  rows.forEach(row => {
    const status = row[statusIdx] || "Empty";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  let text = `Daily CRM Summary\n\n`;
  text += `New leads today: ${todaysRows.length}\n`;
  text += `Open leads: ${openRows.length}\n\n`;
  text += `Status overview:\n`;
  Object.keys(statusCounts).forEach(status => {
    text += `- ${status}: ${statusCounts[status]}\n`;
  });

  text += `\nToday's leads:\n`;
  todaysRows.forEach(row => {
    text += `- ${row[nameIdx]} | ${row[demoIdx]} | ${row[packageIdx]} ${row[priceIdx]}\n`;
  });

  GmailApp.sendEmail(OWNER_EMAIL, "Daily CRM Summary - Prague AI Growth", text, {
    name: "Prague AI Growth CRM"
  });
}

/**
 * Sends follow-up reminder to owner when leads are not handled.
 * Logic:
 * - Status is New Lead or Contacted.
 * - Follow-Up Due date is in the past.
 */
function sendFollowUpReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;

  const headers = values[0];
  const now = new Date();

  const statusIdx = headers.indexOf("Status");
  const followIdx = headers.indexOf("Follow-Up Due");
  const nameIdx = headers.indexOf("Name");
  const phoneIdx = headers.indexOf("Phone");
  const demoIdx = headers.indexOf("Demo Interest");
  const whatsappIdx = headers.indexOf("WhatsApp First Message");

  const due = [];

  values.slice(1).forEach((row, i) => {
    const status = row[statusIdx];
    const dueDate = row[followIdx];

    if ((status === "New Lead" || status === "Contacted") && dueDate instanceof Date && dueDate <= now) {
      due.push({
        row: i + 2,
        name: row[nameIdx],
        phone: row[phoneIdx],
        demo: row[demoIdx],
        message: row[whatsappIdx]
      });
    }
  });

  if (!due.length) return;

  let text = "Follow-up reminder\n\n";
  due.forEach(item => {
    text += `Row ${item.row}: ${item.name} | ${item.phone} | ${item.demo}\n`;
    text += `Message:\n${item.message}\n\n---\n\n`;
  });

  GmailApp.sendEmail(OWNER_EMAIL, `Follow-up due: ${due.length} lead(s)`, text, {
    name: "Prague AI Growth CRM"
  });
}

/**
 * Installs daily triggers.
 * Run manually once.
 */
function installDailyTriggers() {
  deleteProjectTriggers_();

  ScriptApp.newTrigger("sendDailyLeadSummary")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  ScriptApp.newTrigger("sendFollowUpReminders")
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();
}

function deleteProjectTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
}

function applyStatusFormatting_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const statusCol = col_("Status");
  const range = sheet.getRange(2, statusCol, 2000, 1);
  const rules = [];

  Object.keys(STATUS_COLORS).forEach(status => {
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(STATUS_COLORS[status])
      .setFontColor("#0f172a")
      .setRanges([range])
      .build();
    rules.push(rule);
  });

  sheet.setConditionalFormatRules(rules);
}

function colorStatusCell_(sheet, row) {
  const statusCol = col_("Status");
  const value = sheet.getRange(row, statusCol).getValue();
  if (STATUS_COLORS[value]) {
    sheet.getRange(row, statusCol).setBackground(STATUS_COLORS[value]).setFontColor("#0f172a");
  }
}

function col_(headerName) {
  const idx = HEADERS.indexOf(headerName);
  if (idx === -1) throw new Error(`Column not found: ${headerName}`);
  return idx + 1;
}

function normalizeLang_(lang) {
  lang = String(lang || "en").toLowerCase();
  if (lang === "sr" || lang === "cz" || lang === "en") return lang;
  return "en";
}

function clean_(value) {
  return String(value || "").trim().slice(0, 2000);
}

function escapeHtml_(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
