RSR SHOP V5 FULL SUITE

This package includes:
- SQLite permanent database
- Private persistent receipt storage
- Register/login/logout
- Password reset
- Optional email verification
- Customer dashboard and order history
- Roblox username/avatar verification
- Private order tracking
- Customer/admin chat
- Unread message notifications
- Approve/decline/status controls
- Instant stock reservation and deduction
- Reviews and ratings
- Promo codes
- Sales analytics
- FAQ, privacy, terms and refund pages
- Mobile layout
- robots.txt and sitemap.xml
- GCash, GoTyme, PayPal, Wise and Payoneer payment choices

SAFE DEPLOYMENT PLAN

DO NOT replace your working production service immediately.

1. Create a separate GitHub repository, for example:
   rsr-shop-v5-staging
2. Upload this package to that repository.
3. Create a separate Render web service:
   fastrobux-app-staging
4. Use:
   Runtime: Node
   Build command: npm install
   Start command: node server.js
   Root directory: blank
5. Use a paid Render instance and attach a persistent disk:
   Mount path: /var/data
   Suggested size: 1 GB
6. Add environment variables:
   DATA_ROOT=/var/data
   PUBLIC_BASE_URL=https://YOUR-STAGING-URL.onrender.com
   ADMIN_KEY=a new long random private password
   DISCORD_WEBHOOK_URL=optional
   SESSION_DAYS=30
   RESERVATION_MINUTES=60
   REQUIRE_EMAIL_VERIFICATION=false

EMAIL SETUP

Start with:
EMAIL_ENABLED=false
ALLOW_DEV_EMAIL_LINKS=true

This allows testing registration and password reset without SMTP.

After the rest of the shop works, configure SMTP:
EMAIL_ENABLED=true
ALLOW_DEV_EMAIL_LINKS=false
SMTP_HOST=your provider's SMTP host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your SMTP username
SMTP_PASS=your SMTP password
EMAIL_FROM=Reck Shop <your verified sender email>
REQUIRE_EMAIL_VERIFICATION=true

TEST CHECKLIST

1. Open /api/health and confirm:
   ok: true
   version: V5 Full Suite
   database: SQLite
   storage: persistent disk
2. Register a new customer account.
3. Login and open dashboard.
4. Search a real Roblox username.
5. Create a low-value test order with a sample receipt.
6. Open the order from customer dashboard.
7. Open /admin.html and log in using ADMIN_KEY.
8. Open the order receipt.
9. Send admin/customer chat messages.
10. Approve, process and complete the test order.
11. Submit a customer review.
12. Publish the review in Admin.
13. Create and test a promo code.
14. Restart the Render service and confirm the account/order still exists.
15. Only after every test passes, connect your real domain or move traffic from the old service.

CUSTOM DOMAIN AND SEO

- Add your custom domain in Render after staging tests pass.
- Change PUBLIC_BASE_URL to the exact custom domain.
- Update public/robots.txt and public/sitemap.xml with the custom domain.
- Submit /sitemap.xml in Google Search Console.
- Set DNS records exactly as Render instructs.
- Keep the old service available until the custom domain works.

IMPORTANT SECURITY

- Never ask for a Roblox password, verification code, authentication cookie or recovery information.
- Regenerate the Discord webhook and ADMIN_KEY if they appeared in screenshots.
- Back up /var/data regularly.
- SQLite is suitable for a small shop on one Render instance. For high traffic, migrate to PostgreSQL and object storage.
- Confirm that your products and payment workflow follow Roblox and payment-provider rules before promotion.


V6 STAGING IMPROVEMENTS
- Installable PWA app, icons and offline fallback
- Install App button
- Live support, stock, banner and payment availability refresh
- Customer order and chat auto-refresh
- Admin auto-refresh
- Enable/disable payment methods
- Announcement banner and maintenance mode
- Admin audit log
- Manual and daily SQLite backups
- Mobile and visual improvements

Deploy to a separate staging service first. Use a separate staging disk. Test everything before replacing V5.


V6.1 ENHANCED UPDATE
- Replaced GCash QR using the newly supplied GCash/InstaPay image.
- Replaced GoTyme QR using the newly supplied GoTyme/InstaPay image.
- Added redesigned Reck Shop icons for Android, iOS, favicon and 1024px store artwork.
- Improved PWA manifest with app shortcuts and maskable icons.
- Added second Install App call-to-action.
- Added QR click-to-enlarge view.
- Added Copy Exact Amount button.
- Added safer payment reminders and improved mobile payment layout.
- Updated service-worker cache so browsers receive the new QR and icon files.

IMPORTANT
Deploy and test this as staging before replacing the live V5/V6 site.
After deployment, uninstall any older Reck Shop PWA and reinstall it so the new icon appears.
If an old QR or icon remains, clear the browser site data or wait for the service worker update.


RSR SHOP V7 TRUST EDITION

New trust and legitimacy features:
- Public Trust Center page.
- Real completed-order count from the database.
- Real published-review count and average rating.
- Partially hidden recent completed orders for privacy.
- Verified-purchase review explanation.
- Public customer-protection safeguards.
- Business profile and contact information controlled by Admin.
- Public support hours, Facebook and Discord links.
- Clear independent-shop and Roblox non-affiliation notice.
- Trust Center link on the homepage and PWA shortcuts.
- No fake badges, fake customer totals or invented business claims.

IMPORTANT:
Only publish business details that are accurate and verifiable.
Do not claim government registration, SSL certification, encryption standards,
customer totals or success rates unless you can prove them.


RSR SHOP V7.1 GAME PASS VERIFIED

Default editable Trust Center details:
- Facebook: https://www.facebook.com/profile.php?id=61592736479803
- Email: reckshopemergencycontact@gmail.com
- Phone: 09121656529
- Business location: Philippines

These details can be changed anytime in:
Admin → Trust Center & Business Profile → Save Trust Center

CT / NCT improvements:
- Roblox username is required.
- Roblox Game Pass link is required.
- The server checks the live Game Pass price with Roblox.
- Covered Tax required price = ceiling(desired Robux / 0.70).
- Not Covered Tax required Game Pass price = desired Robux amount.
- If the live Game Pass price does not exactly match the required price, checkout is blocked.
- The server checks the price again when the customer submits the order.
- Verified Game Pass information is stored with the order when supported by the existing database migration.

IMPORTANT:
Test with a low-value private Game Pass in staging first.
Do not ask customers for Roblox passwords, cookies or verification codes.


RSR SHOP V7.2 MOBILE & TRUST EDITION
===================================
Included:
- Updated GCash and GoTyme QR images supplied by the owner.
- Android install support through the web app manifest.
- iPhone/iPad Add to Home Screen instructions.
- New Android and iOS app icons.
- Visible official Facebook, email, phone and Philippines location.
- Contact values remain editable from Admin > Trust Center & Business Profile.
- Existing CT/NCT Game Pass verification remains included.

Official contact defaults:
Facebook: https://www.facebook.com/profile.php?id=61592736479803
Email: reckshopemergencycontact@gmail.com
Phone: 09121656529
Location: Philippines

DEPLOYMENT
1. Upload all extracted project files to the root of the GitHub repository.
2. Commit with: Upgrade to RSR Shop V7.2 Mobile & Trust Edition
3. In Render, select Manual Deploy > Deploy latest commit.
4. After deployment, hard-refresh the browser or clear the old service worker cache.

IOS NOTE
This is an installable PWA. App Store publication is a separate process requiring an Apple Developer account and Apple review.


V7.5 adds tutorial.html, the supplied YouTube Shorts tutorial, clearer customer instructions and expanded admin analytics.


RSR SHOP V8
- Tutorial/reel URL is editable at Admin → Tutorial / Reels Settings.
- Buyers can switch between English, Filipino, Cebuano, Spanish, Portuguese and Vietnamese.
- Admin can select the default language and enable browser-language detection.
- iPhone users receive Safari Add to Home Screen instructions.


V9.4 adds editable delivery estimates, loyalty summaries, CSV order export, mobile navigation and final security/stability improvements.


V10 Smart Operations: see CHANGELOG-V10.txt. Keep the same persistent DATA_ROOT and uploads disk during deployment.


V10.1 FULL TRANSLATION
Use Admin → Translation Editor to correct or add any exact customer-facing phrase. Overrides are stored in SQLite and require no redeploy.


V10.2 MOBILE CHECKOUT
The public order form is separated into Method, Account, Game Pass, and Payment steps. CT/NCT includes Game Pass; Instant/Gifting skips that step automatically.


V11 AUTHENTICATION & RELIABILITY
Read AUTH-SETUP-V11.txt before enabling email verification or Google/Facebook login. The V10.2 separated order checkout remains included.


V12 PERMANENT COMMERCE
Read PERMANENT-STORAGE-SETUP-V12.txt. Create Account now changes to the customer dashboard after login, and the separated mobile checkout remains preserved.


V12.1 DASHBOARD ORDER HUB
Logged-in customers start from dashboard.html and choose CT, NCT, Instant or Gifting. Orders open in the focused shop.html step checkout.
