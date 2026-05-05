# Prague AI Growth — 3 Language CRM System

Paket sadrži:

- `index_3_language_crm.html` — sajt sa SR/EN/CZ CRM formom
- `apps_script_3_language_crm.gs` — Google Apps Script backend

## 1. Google Sheet

Napravi novi Google Sheet: `Prague AI Growth CRM`.

Idi na `Extensions → Apps Script` i nalepi sadržaj iz `apps_script_3_language_crm.gs`.

## 2. Setup sheet

U Apps Script editoru izaberi funkciju `setupCrmSheet` i klikni Run.

## 3. Deploy Web App

`Deploy → New deployment → Web app`

Podesi:

- Execute as: `Me`
- Who has access: `Anyone`

Kopiraj Web App URL.

## 4. Poveži sa sajtom

U `index_3_language_crm.html` pronađi:

```js
const CRM_WEB_APP_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Zameni sa Web App URL-om.

## 5. Test

Popuni formu na sajtu. Treba da dobiješ:

1. novi red u Google Sheets CRM-u
2. automatski email leadu na SR/EN/CZ
3. email notifikaciju na `marjan.posao@gmail.com`

## 6. Push

Kada sve radi:

```bash
cp index_3_language_crm.html index.html
git add index.html
git commit -m "Add 3 language CRM lead system"
git push origin main
```

Na Windows:

```bash
copy index_3_language_crm.html index.html
git add index.html
git commit -m "Add 3 language CRM lead system"
git push origin main
```
