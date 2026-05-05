# Prague AI Growth — Advanced CRM Automation

Ova verzija dodaje:

- boje statusa u Google Sheet-u
- kalkulator ponude: Starter / Growth / Premium
- automatski dnevni email pregled leadova
- follow-up reminder ako lead nije obrađen posle 24h
- nove CRM kolone:
  - Recommended Package
  - Estimated Price
  - Follow-Up Due
  - Last Contacted

## Instalacija

1. Otvori Google Sheet.
2. Extensions -> Apps Script.
3. Zameni stari kod sa `apps_script_advanced_crm_automation.gs`.
4. Sačuvaj.
5. Pokreni `setupCrmSheet`.
6. Pokreni `installDailyTriggers`.

## Važno

`setupCrmSheet` resetuje tabelu. Ako već imaš prave leadove, prvo napravi kopiju Sheet-a.

## Deploy

Ako već imaš Web App:

Deploy -> Manage deployments -> Edit -> New version -> Deploy

Ako praviš novi:

Deploy -> New deployment -> Web app

- Execute as: Me
- Who has access: Anyone

## Test

1. Popuni formu na sajtu.
2. Proveri novi red u Google Sheet-u.
3. Treba da vidiš:
   - Status: New Lead
   - Recommended Package
   - Estimated Price
   - WhatsApp First Message
   - Proposal Template
   - Follow-Up Due

## Ručni test automatizacija

U Apps Script-u pokreni:

- `sendDailyLeadSummary`
- `sendFollowUpReminders`

Ako dobiješ email, automatizacija radi.

## Status tok

New Lead -> Contacted -> Demo Booked -> Offer Sent -> Won / Lost
