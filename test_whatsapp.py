"""
Quick test script for the Interakt WhatsApp API.
Run: python test_whatsapp.py

NOTE: API_KEY is NOT your login email/password.
      Go to: Interakt Dashboard → Settings → Developer Settings → API Key
      Copy that key and paste it below.
"""

import requests

# ── Fill these in ────────────────────────────────────────────────────────────
API_KEY        = ""               # from Interakt Dashboard → Settings → Developer Settings
TO_PHONE       = "8923406146"     # test phone number (digits only)
COUNTRY_CODE   = "+91"
TEMPLATE_NAME  = "Order ready template"   # exact template name from Interakt dashboard
BODY_VALUES    = ["SG3"]          # match the {{1}}, {{2}} variables in your template
# ─────────────────────────────────────────────────────────────────────────────

# Interakt API key is already base64-encoded — use it directly
auth = f"Basic {API_KEY}"

payload = {
    "countryCode": COUNTRY_CODE,
    "phoneNumber": TO_PHONE,
    "callbackData": "test",
    "type": "Template",
    "template": {
        "name": TEMPLATE_NAME,
        "languageCode": "en",
        "bodyValues": BODY_VALUES,
    },
}

response = requests.post(
    "https://api.interakt.ai/v1/public/message/",
    json=payload,
    headers={"Authorization": auth, "Content-Type": "application/json"},
    timeout=10,
)

print("Status :", response.status_code)
print("Response:", response.text)
