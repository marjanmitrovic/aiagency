# Prague AI Growth — CRM Sales Workflow Update

Dodato je:

- workflow prikaz na sajtu
- status tok: New Lead -> Contacted -> Demo Booked -> Offer Sent -> Won / Lost
- nova CRM kolona: WhatsApp First Message
- nova CRM kolona: Proposal Template
- automatski email korisniku na SR / EN / CZ
- email notifikacija vlasniku sa copy/paste WhatsApp porukom i proposal šablonom

## Instalacija

1. U Google Sheets otvori Extensions -> Apps Script.
2. Zameni stari kod fajlom `apps_script_3_language_crm_workflow.gs`.
3. Pokreni `setupCrmSheet`.
4. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
5. Ako dobiješ novi Web App URL, ubaci ga u HTML u `CRM_WEB_APP_URL`.

## GitHub

Linux / Mac:

```bash
cp index_3_language_crm_workflow.html index.html
git add index.html
git commit -m "Add CRM sales workflow automation"
git push origin main
```

Windows:

```powershell
copy index_3_language_crm_workflow.html index.html
git add index.html
git commit -m "Add CRM sales workflow automation"
git push origin main
```
