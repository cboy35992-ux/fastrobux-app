RSR SHOP FRESH V3 ACCOUNTS

This is a clean restart with NO Supabase and NO login system.

Included:
- Covered Tax, Not Covered Tax, Instant, and Gifting
- Roblox username lookup and avatar preview
- GCash and GoTyme QR selection
- Receipt uploads
- Private order number + token
- Customer tracking and private chat
- Admin approve/decline/status controls
- Admin stock editing
- Instant minimum 10 Robux
- Default Instant stock: 50,000
- Optional Discord webhook

RENDER SETTINGS
Language: Node
Build Command: npm install
Start Command: node server.js
Root Directory: leave blank

RENDER ENVIRONMENT VARIABLES
ADMIN_KEY = create a private admin password
PUBLIC_BASE_URL = your exact Render URL
DISCORD_WEBHOOK_URL = optional

IMPORTANT
This simple version stores orders in data/orders.json and receipts in uploads/.
Render's local filesystem is not permanent. Data can reset after redeploys or service replacement.
Use this version first to prove the shop works. Add a permanent database only after the basic version is stable.

TEST
Open /api/health. It should show:
{"ok":true,"version":"Fresh V2","storage":"local JSON","message":"Server is working."}


FRESH V2 IMPROVEMENTS
- Support starts Online by default
- “Offline” changed to clearer “Away”
- Added server health check on page startup
- Added trust cards and marketplace feature strip
- Improved admin support wording
- Cleaner connection error messages


FRESH V3 ACCOUNT FEATURES
- Customer register/login using email and a separate shop password
- Passwords hashed with bcrypt
- 30-day local sessions
- Customer dashboard
- Recent transaction history
- Dashboard links to private tracking and support chat
- Guest checkout remains available
- Orders appear in dashboard only when submitted while logged in

SECURITY
Never request or store Roblox passwords.
This local account system is for initial testing. Render local JSON data can reset after redeployment.
