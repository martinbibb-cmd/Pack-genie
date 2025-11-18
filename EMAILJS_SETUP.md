# EmailJS Setup for Bug Reporting

The bug reporting feature uses EmailJS to send bug reports directly to martinbibb@gmail.com. Here's how to set it up:

## Setup Steps

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (allows 200 emails/month)

### 2. Add Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. Note down your **Service ID**

### 3. Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Set up the template with the following content:

**Template Name:** Bug Report Template

**Subject:** Bug Report - Pack-Builder Genie

**Body:**
```
New Bug Report

Submitted: {{timestamp}}

Description:
{{bug_description}}

---

System Diagnostics:
{{diagnostics}}

---

Screenshots:
{{screenshots_count}} screenshot(s) attached
{{screenshots}}

---

Packs Data:
{{packs_data}}
```

4. Note down your **Template ID**

### 4. Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (or API Key)
3. Copy it

### 5. Update the Code

Open `/pack-genie/pack-builder/app.js` and update these lines (around line 639-641):

```javascript
const EMAILJS_PUBLIC_KEY = "YOUR_ACTUAL_PUBLIC_KEY_HERE";
const EMAILJS_SERVICE_ID = "YOUR_ACTUAL_SERVICE_ID_HERE";
const EMAILJS_TEMPLATE_ID = "YOUR_ACTUAL_TEMPLATE_ID_HERE";
```

Replace the placeholder values with your actual EmailJS credentials.

## Fallback Mode

If EmailJS is not configured, the bug report feature will still work in fallback mode:
- Bug report data will be copied to the user's clipboard
- An alert will prompt them to email it manually to martinbibb@gmail.com
- The data is also logged to the browser console for easy access

## What Data is Collected

The bug report includes:
- User's bug description
- Screenshots (if provided)
- Browser information (user agent, platform, screen resolution)
- Application state (number of packs, current pricebook)
- Recent console errors (last 10)
- Performance metrics (memory usage if available)
- Current packs data (for debugging)
- Timestamp and URL

## Privacy Note

All data is sent directly to martinbibb@gmail.com and is not stored anywhere else. Users are informed about what data is being collected through the bug report form.

## Testing

To test the bug reporting feature:
1. Open Pack-Builder Genie
2. Click the "🐛 Report Bug" button
3. Fill in a test bug description
4. Optionally attach screenshots
5. Click "Send Bug Report"
6. Check martinbibb@gmail.com for the report

## Troubleshooting

- **Email not received:** Check spam folder, verify EmailJS credentials
- **Clipboard fallback:** If EmailJS isn't configured, the data is copied to clipboard
- **Screenshot size errors:** Each screenshot must be under 5MB
- **Console errors:** Open browser console (F12) to see detailed error messages
