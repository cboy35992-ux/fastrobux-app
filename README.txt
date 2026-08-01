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
