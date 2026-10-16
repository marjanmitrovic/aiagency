import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('./Code.gs',import.meta.url),'utf8');
function ctx(overrides={}){const context=vm.createContext({Date,console,...overrides});vm.runInContext(code,context);return context;}
test('parses real-life Czech airbag request conservatively',()=>{
 const c=ctx();const parsed=c.AF_extract('Citroën Xsara Picasso 2008','Svítí AIRBAG FAULT, telefon +420 777 123 456. Řídicí jednotka nekomunikuje.');
 assert.equal(parsed.category,'Airbag / SRS');assert.equal(parsed.make,'Citroën');assert.equal(parsed.year,'2008');assert.match(parsed.phone,/777/);assert.ok(!parsed.missing.includes('kontaktní telefon'));
 assert.match(c.AF_customerReply({workshopName:'Test',workshopPhone:''},parsed),/není potvrzením objednání/);
});
test('asks for missing phone and model without inventing prices',()=>{
 const c=ctx();const parsed=c.AF_extract('Nejde nastartovat','Auto nestartuje. Kdy můžete?');
 assert.equal(parsed.category,'Startování / elektro');assert.ok(parsed.missing.includes('kontaktní telefon'));assert.ok(parsed.missing.includes('značku a model vozidla'));
 const reply=c.AF_customerReply({workshopName:'Test',workshopPhone:''},parsed);
 assert.ok(!/\d+\s*Kč/.test(reply));
});
test('rejects auto-replies and own messages',()=>{
 const c=ctx();const msg=(from,subject,raw='Subject: test\r\n')=>({getFrom:()=>from,getSubject:()=>subject,getRawContent:()=>raw,getPlainBody:()=> 'please repair my vehicle'});
 assert.equal(c.AF_isCustomerMail(msg('Shop <shop@example.com>','Repair'),'shop@example.com',[]),false);
 assert.equal(c.AF_isCustomerMail(msg('no-reply@any.example','Inquiry'),'shop@example.com',[]),false);
 assert.equal(c.AF_isCustomerMail(msg('customer@example.cz','Out of office'),'shop@example.com',[]),false);
 assert.equal(c.AF_isCustomerMail(msg('customer@example.cz','Repair','List-Unsubscribe: test\r\n'),'shop@example.com',[]),false);
 assert.equal(c.AF_isCustomerMail(msg('customer@example.cz','Repair'),'shop@example.com',[]),true);
});
test('processes each existing Gmail thread only once',()=>{
 const sent=[],rows=[],map=new Map([['AF_INSTALLED_AT','2025-01-01T00:00:00.000Z'],['AF_SHEET_ID','x']]);
 const props={getProperty:k=>map.get(k)||null,setProperty:(k,v)=>map.set(k,v),deleteProperty:k=>map.delete(k)};
 const msg={getFrom:()=> 'customer@example.cz',getSubject:()=> 'Airbag Xsara 2008',getPlainBody:()=> 'Citroën Xsara Picasso 2008, airbag fault, telefon +420 777 123 456',getRawContent:()=> 'Subject: Airbag',getDate:()=> new Date()};
 const thread={getId:()=> 'thread1',getMessages:()=> [msg]};
 const gmail={search:()=> [thread],getAliases:()=> [],getUserLabelByName:()=> ({addToThread(){}}),sendEmail:(...args)=> sent.push(args)};
 const c=ctx({GmailApp:gmail,Session:{getEffectiveUser:()=>({getEmail:()=> 'shop@example.com'})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},PropertiesService:{getScriptProperties:()=>props},SpreadsheetApp:{openById:()=>({getSheets:()=> [{appendRow:(row)=> rows.push(row)}]})},Logger:{log(){}}});
 c.AF_settings=()=>({workshopName:'Test',ownerEmail:'owner@example.com',workshopPhone:'',customerAutoReply:true});
 c.AF_processInbox();c.AF_processInbox();assert.equal(sent.length,2);assert.equal(rows.length,1);assert.equal(map.get('AF_DONE_thread1'),'customer_ack_sent');
});
