/**
 * Prague AI Growth - 3 Language CRM + Sales Workflow System
 * Save leads, email lead, email owner with WhatsApp/proposal templates.
 */
const SHEET_NAME = "CRM Leads";
const OWNER_EMAIL = "marjan.posao@gmail.com";
const WHATSAPP_NUMBER = "+420722080268";
const HEADERS = ["Timestamp","Language","Name","Email","Phone","Business Type","Demo Interest","Problem","Message","Source","Page URL","User Agent","Status","Next Step","WhatsApp First Message","Proposal Template","Notes"];

function setupCrmSheet(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sheet=ss.getSheetByName(SHEET_NAME); if(!sheet) sheet=ss.insertSheet(SHEET_NAME);
  sheet.clear();
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold").setBackground("#07111f").setFontColor("#ffffff");
  sheet.setFrozenRows(1); sheet.autoResizeColumns(1,HEADERS.length);
  const statusCol=HEADERS.indexOf("Status")+1;
  const rule=SpreadsheetApp.newDataValidation().requireValueInList(["New Lead","Contacted","Demo Booked","Offer Sent","Won","Lost"],true).setAllowInvalid(false).build();
  sheet.getRange(2,statusCol,2000,1).setDataValidation(rule);
}
function doGet(){return json_({ok:true,service:"Prague AI Growth CRM Workflow",status:"running"});}
function doPost(e){
  try{
    const data=parse_(e); const wf=workflow_(data.language,data); const row=save_(data,wf);
    sendLeadEmail_(data); notifyOwner_(data,wf,row);
    return json_({ok:true,message:"Lead saved",row});
  }catch(err){return json_({ok:false,error:String(err)});}
}
function parse_(e){
  if(!e||!e.postData||!e.postData.contents) throw new Error("No POST body received");
  const d=JSON.parse(e.postData.contents);
  return {language:clean_(d.language||"en"),name:clean_(d.name||""),email:clean_(d.email||""),phone:clean_(d.phone||""),business_type:clean_(d.business_type||""),demo_interest:clean_(d.demo_interest||""),problem:clean_(d.problem||""),message:clean_(d.message||""),source:clean_(d.source||"Website"),page_url:clean_(d.page_url||""),user_agent:clean_(d.user_agent||"")};
}
function save_(d,wf){
  const ss=SpreadsheetApp.getActiveSpreadsheet(); let sh=ss.getSheetByName(SHEET_NAME); if(!sh){setupCrmSheet(); sh=ss.getSheetByName(SHEET_NAME);} 
  sh.appendRow([new Date(),d.language,d.name,d.email,d.phone,d.business_type,d.demo_interest,d.problem,d.message,d.source,d.page_url,d.user_agent,"New Lead",wf.nextStep,wf.whatsapp,wf.proposal,""]);
  return sh.getLastRow();
}
function workflow_(lang,d){
  lang=norm_(lang); const demo=d.demo_interest||"AI demo";
  if(lang==="sr") return {nextStep:"Pošalji WhatsApp poruku i promeni status u Contacted", whatsapp:`Zdravo ${d.name||""}, video sam vaš zahtev za ${demo} preko Prague AI Growth sajta.\n\nHvala na interesovanju.\n\nMogu kratko da pogledam vaš slučaj i pokažem kako bi AI sistem mogao da pomogne vašoj firmi oko zakazivanja, poruka, leadova ili organizacije posla.\n\nDa li vam više odgovara kratak poziv danas ili sutra?`, proposal:`Zdravo ${d.name||""},\n\nna osnovu vašeg zahteva, preporučujem fokusiran AI automation setup.\n\nSistem bi uključivao:\n- AI lead/kontakt formu\n- automatski odgovor klijentu\n- Google Sheets CRM\n- email notifikacije\n- WhatsApp follow-up tok\n- osnovni demo/booking workflow\n\nSetup cena: 299–699 € u zavisnosti od složenosti.\n\nCilj: manje propuštenih leadova, brži odgovori i manje ručnog rada.\n\nSrdačno,\nPrague AI Growth`};
  if(lang==="cz") return {nextStep:"Poslat WhatsApp zprávu a změnit status na Contacted", whatsapp:`Dobrý den ${d.name||""}, viděl jsem vaši žádost o ${demo} přes web Prague AI Growth.\n\nDěkuji za zájem.\n\nMůžu se krátce podívat na váš případ a ukázat, jak by AI systém mohl pomoci vaší firmě s rezervacemi, zprávami, leady nebo každodenním provozem.\n\nHodí se vám krátký hovor dnes nebo zítra?`, proposal:`Dobrý den ${d.name||""},\n\nna základě vaší žádosti doporučuji začít cíleným AI automation setupem.\n\nSystém by zahrnoval:\n- AI lead/kontaktní formulář\n- automatickou odpověď zákazníkovi\n- Google Sheets CRM\n- emailové notifikace\n- WhatsApp follow-up tok\n- základní demo/rezervační workflow\n\nCena setupu: 299–699 € podle složitosti.\n\nCíl: méně ztracených leadů, rychlejší odpovědi a méně ruční práce.\n\nS pozdravem,\nPrague AI Growth`};
  return {nextStep:"Send WhatsApp message and change status to Contacted", whatsapp:`Hi ${d.name||""}, I saw your ${demo} request through the Prague AI Growth website.\n\nThanks for your interest.\n\nI can quickly review your case and show how an AI system could help your business with bookings, messages, leads, or daily operations.\n\nWould a short call work better today or tomorrow?`, proposal:`Hi ${d.name||""},\n\nbased on your request, I recommend starting with a focused AI automation setup.\n\nThe system would include:\n- AI lead/contact form\n- automated customer reply\n- Google Sheets CRM\n- email notification\n- WhatsApp follow-up flow\n- basic demo/booking workflow\n\nSetup price: €299–€699 depending on complexity.\n\nThe goal is simple: fewer missed leads, faster replies, and less manual work.\n\nBest regards,\nPrague AI Growth`};
}
function notifyOwner_(d,wf,row){
  const subject=`New AI Lead: ${d.demo_interest||"Demo request"} - ${d.name||"Unknown"}`;
  const text=`New lead received.\n\nCRM Row: ${row}\n\nLANGUAGE: ${d.language}\nNAME: ${d.name}\nEMAIL: ${d.email}\nPHONE: ${d.phone}\nBUSINESS TYPE: ${d.business_type}\nDEMO INTEREST: ${d.demo_interest}\nPROBLEM: ${d.problem}\n\nMESSAGE:\n${d.message}\n\nNEXT STEP:\n${wf.nextStep}\n\nWHATSAPP FIRST MESSAGE:\n${wf.whatsapp}\n\nPROPOSAL TEMPLATE:\n${wf.proposal}\n\nPAGE:\n${d.page_url}`;
  GmailApp.sendEmail(OWNER_EMAIL,subject,text,{name:"Prague AI Growth CRM"});
}
function sendLeadEmail_(d){
  if(!d.email) return; const lang=norm_(d.language); const c=email_(lang,d);
  GmailApp.sendEmail(d.email,c.subject,c.text,{name:"Prague AI Growth",htmlBody:c.html});
}
function email_(lang,d){
  if(lang==="sr") return makeEmail_("Vaš AI demo zahtev je primljen",`Zdravo ${d.name||""},`,["Hvala na interesovanju za AI demo.",`Primio sam vaš zahtev za: ${d.demo_interest}`,`Najveći problem koji ste naveli: ${d.problem}`,"Sledeći korak je kratak besplatan AI audit gde ćemo videti kako AI može da pomogne vašoj firmi."],"Kontakt preko WhatsApp-a");
  if(lang==="cz") return makeEmail_("Vaše žádost o AI demo byla přijata",`Dobrý den ${d.name||""},`,["děkujeme za váš zájem o AI demo.",`Obdrželi jsme vaši žádost o: ${d.demo_interest}`,`Největší problém, který jste uvedli: ${d.problem}`,"Dalším krokem je krátký bezplatný AI audit, kde se podíváme, jak může AI pomoci vaší firmě."],"Kontaktovat přes WhatsApp");
  return makeEmail_("Your AI demo request has been received",`Hi ${d.name||""},`,["Thank you for your interest in our AI demo.",`I received your request for: ${d.demo_interest}`,`Biggest problem you selected: ${d.problem}`,"The next step is a short free AI audit where we look at how AI can help your business save time and automate daily work."],"Contact on WhatsApp");
}
function makeEmail_(subject,greeting,lines,buttonText){
  const wa="https://wa.me/420722080268";
  const text=`${greeting}\n\n${lines.join("\n\n")}\n\n${buttonText}:\n${wa}\n\nPrague AI Growth\n${WHATSAPP_NUMBER}`;
  const ps=lines.map(x=>`<p style="margin:0 0 14px;color:#334155;line-height:1.6">${esc_(x)}</p>`).join("");
  const html=`<div style="margin:0;padding:28px;background:#f8fafc;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:22px;padding:28px;border:1px solid #e2e8f0"><div style="font-weight:800;color:#0891b2;letter-spacing:.04em;margin-bottom:12px">PRAGUE AI GROWTH</div><h1 style="margin:0 0 18px;color:#0f172a;font-size:26px">${esc_(subject)}</h1><p style="margin:0 0 14px;color:#334155;line-height:1.6">${esc_(greeting)}</p>${ps}<a href="${wa}" style="display:inline-block;margin-top:10px;background:#06b6d4;color:#06111f;text-decoration:none;padding:14px 18px;border-radius:14px;font-weight:800">${esc_(buttonText)}</a><p style="margin:22px 0 0;color:#64748b;font-size:13px">Prague AI Growth • ${WHATSAPP_NUMBER}</p></div></div>`;
  return {subject,text,html};
}
function norm_(lang){lang=String(lang||"en").toLowerCase(); return ["sr","cz","en"].includes(lang)?lang:"en";}
function clean_(v){return String(v||"").trim().slice(0,2000);}
function esc_(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
