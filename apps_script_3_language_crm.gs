/**
 * Prague AI Growth - 3 Language CRM System
 * Google Apps Script Web App
 *
 * 1. Create Google Sheet -> Extensions -> Apps Script.
 * 2. Paste this file.
 * 3. Run setupCrmSheet once.
 * 4. Deploy -> New deployment -> Web app.
 * 5. Execute as: Me. Access: Anyone.
 * 6. Copy Web App URL into index_3_language_crm.html:
 *    const CRM_WEB_APP_URL = "YOUR_URL";
 */

const SHEET_NAME = "CRM Leads";
const OWNER_EMAIL = "marjan.posao@gmail.com";
const WHATSAPP_NUMBER = "+420722080268";

const HEADERS = [
  "Timestamp", "Language", "Name", "Email", "Phone", "Business Type",
  "Demo Interest", "Problem", "Message", "Source", "Page URL", "User Agent",
  "Status", "Next Step", "Notes"
];

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
  const statusCol = HEADERS.indexOf("Status") + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New Lead", "Contacted", "Demo Booked", "Offer Sent", "Won", "Lost"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, 1000, 1).setDataValidation(rule);
}

function doPost(e) {
  try {
    const data = parsePayload_(e);
    const row = saveLead_(data);
    sendLeadEmail_(data);
    notifyOwner_(data, row);
    return jsonResponse_({ ok: true, message: "Lead saved", row });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, service: "Prague AI Growth CRM", status: "running" });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error("No POST body received");
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { throw new Error("Invalid JSON body"); }
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

function saveLead_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { setupCrmSheet(); sheet = ss.getSheetByName(SHEET_NAME); }
  sheet.appendRow([
    new Date(), data.language, data.name, data.email, data.phone,
    data.business_type, data.demo_interest, data.problem, data.message,
    data.source, data.page_url, data.user_agent,
    "New Lead", "Contact within 24h", ""
  ]);
  return sheet.getLastRow();
}

function sendLeadEmail_(data) {
  if (!data.email) return;
  const content = emailContent_(normalizeLang_(data.language), data);
  GmailApp.sendEmail(data.email, content.subject, content.text, {
    name: "Prague AI Growth",
    htmlBody: content.html
  });
}

function notifyOwner_(data, row) {
  const subject = `New AI Lead: ${data.demo_interest || "Demo request"} - ${data.name || "Unknown"}`;
  const text = `New lead received.\n\nRow: ${row}\nLanguage: ${data.language}\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nBusiness Type: ${data.business_type}\nDemo Interest: ${data.demo_interest}\nProblem: ${data.problem}\n\nMessage:\n${data.message}\n\nPage:\n${data.page_url}`;
  GmailApp.sendEmail(OWNER_EMAIL, subject, text, { name: "Prague AI Growth CRM" });
}

function emailContent_(lang, data) {
  const waUrl = "https://wa.me/420722080268";
  if (lang === "sr") {
    const subject = "Vaš AI demo zahtev je primljen";
    const text = `Zdravo ${data.name || ""},\n\nHvala na interesovanju za AI demo.\n\nPrimio sam vaš zahtev za:\n${data.demo_interest}\n\nNajveći problem koji ste naveli:\n${data.problem}\n\nSledeći korak je kratak besplatan AI audit gde ćemo videti kako AI može da pomogne vašoj firmi.\n\nWhatsApp: ${WHATSAPP_NUMBER}\n\nSrdačno,\nPrague AI Growth`;
    return { subject, text, html: htmlEmail_(subject, `Zdravo ${escapeHtml_(data.name || "")},`, ["Hvala na interesovanju za AI demo.", `<strong>Demo:</strong> ${escapeHtml_(data.demo_interest)}`, `<strong>Problem:</strong> ${escapeHtml_(data.problem)}`, "Sledeći korak je kratak besplatan AI audit gde ćemo videti kako AI može da pomogne vašoj firmi."], "Kontakt preko WhatsApp-a", waUrl) };
  }
  if (lang === "cz") {
    const subject = "Vaše žádost o AI demo byla přijata";
    const text = `Dobrý den ${data.name || ""},\n\nděkujeme za váš zájem o AI demo.\n\nObdrželi jsme vaši žádost o:\n${data.demo_interest}\n\nNejvětší problém, který jste uvedli:\n${data.problem}\n\nDalším krokem je krátký bezplatný AI audit, kde se podíváme, jak může AI pomoci vaší firmě.\n\nWhatsApp: ${WHATSAPP_NUMBER}\n\nS pozdravem,\nPrague AI Growth`;
    return { subject, text, html: htmlEmail_(subject, `Dobrý den ${escapeHtml_(data.name || "")},`, ["děkujeme za váš zájem o AI demo.", `<strong>Demo:</strong> ${escapeHtml_(data.demo_interest)}`, `<strong>Problém:</strong> ${escapeHtml_(data.problem)}`, "Dalším krokem je krátký bezplatný AI audit, kde se podíváme, jak může AI pomoci vaší firmě."], "Kontaktovat přes WhatsApp", waUrl) };
  }
  const subject = "Your AI demo request has been received";
  const text = `Hi ${data.name || ""},\n\nThank you for your interest in our AI demo.\n\nI received your request for:\n${data.demo_interest}\n\nBiggest problem you selected:\n${data.problem}\n\nThe next step is a short free AI audit where we look at how AI can help your business save time and automate daily work.\n\nWhatsApp: ${WHATSAPP_NUMBER}\n\nBest regards,\nPrague AI Growth`;
  return { subject, text, html: htmlEmail_(subject, `Hi ${escapeHtml_(data.name || "")},`, ["Thank you for your interest in our AI demo.", `<strong>Demo:</strong> ${escapeHtml_(data.demo_interest)}`, `<strong>Problem:</strong> ${escapeHtml_(data.problem)}`, "The next step is a short free AI audit where we look at how AI can help your business save time and automate daily work."], "Contact on WhatsApp", waUrl) };
}

function htmlEmail_(title, greeting, paragraphs, buttonText, buttonUrl) {
  const body = paragraphs.map(p => `<p style="margin:0 0 14px;color:#334155;line-height:1.6">${p}</p>`).join("");
  return `<div style="margin:0;padding:28px;background:#f8fafc;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#ffffff;border-radius:22px;padding:28px;border:1px solid #e2e8f0"><div style="font-weight:800;color:#0891b2;letter-spacing:.04em;margin-bottom:12px">PRAGUE AI GROWTH</div><h1 style="margin:0 0 18px;color:#0f172a;font-size:26px">${escapeHtml_(title)}</h1><p style="margin:0 0 14px;color:#334155;line-height:1.6">${greeting}</p>${body}<a href="${buttonUrl}" style="display:inline-block;margin-top:10px;background:#06b6d4;color:#06111f;text-decoration:none;padding:14px 18px;border-radius:14px;font-weight:800">${escapeHtml_(buttonText)}</a><p style="margin:22px 0 0;color:#64748b;font-size:13px">Prague AI Growth • ${WHATSAPP_NUMBER}</p></div></div>`;
}

function normalizeLang_(lang) { lang = String(lang || "en").toLowerCase(); return ["sr", "cz", "en"].includes(lang) ? lang : "en"; }
function clean_(value) { return String(value || "").trim().slice(0, 2000); }
function escapeHtml_(str) { return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function jsonResponse_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
