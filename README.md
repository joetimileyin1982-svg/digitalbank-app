# Digital Banking System — Backend

A backend system for a digital bank, built as a Backend Engineering assignment for TS Academy. It handles customer onboarding, KYC verification, account management, and core banking operations, integrating with the **NIBSS by Phoenix** simulated interbank API.

## Overview

As the sole backend engineer, this system covers the full lifecycle of a bank customer:

1. **Sign up** and log in with JWT-based authentication
2. **Submit KYC** (BVN or NIN) — verified against NIBSS's identity store before any account can be created
3. **Create a bank account** — one per customer, pre-funded with ₦15,000 via NIBSS
4. **Perform core banking operations** — name enquiry, fund transfers (intra- and inter-bank), balance checks, and transaction status queries
5. **View transaction history** — strictly isolated per customer, reflecting both outgoing and incoming transfers between the app's own users

## Architecture

config/ → DB connection, NIBSS axios instance, email transporter, Swagger config
models/ → User, Account, Kyc, Transaction, Notification
services/ → nibssTokenManager (auto-refreshing NIBSS auth), nibssService (all NIBSS API calls)
controllers/ → userController, kycController, accountController
middleware/ → verifyToken (JWT auth), authorizeRoles (RBAC), emailsender, rateLimiter
routes/ → userRoutes, kycRoutes, accountRoutes
scripts/ → seedAdmin (one-time admin creation)


The **models → services → controllers → routes** split keeps each layer focused: models define data shape, services wrap external NIBSS calls, controllers hold business logic, routes just wire URLs to controller functions.

## Key Design Decisions

- **One account per customer**, enforced both at the schema level (`unique` constraint) and in application logic.
- **Account creation is gated behind KYC verification** — a customer must have a `Verified` KYC record before an account can be created.
- **Balance is fetched live from NIBSS** on every balance check, since NIBSS is the authoritative source of truth for actual funds. The local `balance` field is a best-effort cache, kept in sync after transfers, but never treated as ground truth for customer-facing balance queries.
- **NIBSS's own transaction reference** (`nibssTransactionId`) is stored separately from a locally-generated `reference`, since status queries must use NIBSS's own identifier, not an internally generated one.
- **Both sides of an internal transfer are recorded.** When a transfer's recipient is also one of the app's own users, a corresponding `Deposit` transaction is created on their account (in addition to the sender's `Transfer` record), so both parties see the movement in their own transaction history.
- **Data isolation** is enforced on transaction history and transaction status lookups — a customer can only view their own account's data, verified by cross-checking the requester's `userId` against the account/transaction ownership.
- **Optional transaction PIN** — customers can set a 4-digit PIN via a separate endpoint. If set, it's required (hashed, bcrypt-compared) on every transfer; if never set, transfers proceed without a PIN check.
- **Toggleable email notifications** — customers can opt out of transactional emails (KYC verified, transfer success). Admin notifications on new account creation always fire, regardless of the customer's preference.
- **Admin account listing** reads from the local database rather than live NIBSS data, matching how real banking systems treat their own database as the source of truth for internal reporting/admin views.

## Known Limitation

Transaction history reflects transfers initiated through this application, including deposits received from other users of this same app. **Incoming transfers from external fintechs (a different bank/fintech entirely) are not automatically detected**, since NIBSS by Phoenix does not provide a webhook or callback mechanism to notify a receiving bank of an incoming external transfer in this training environment. In a production system, this would be resolved via NIBSS's real settlement notification infrastructure.

## Setup

```bash
npm install
```

Create a `.env` file:

PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com
NIBSS_API_KEY=your_nibss_api_key
NIBSS_API_SECRET=your_nibss_api_secret
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=admin_notification_email
ADMIN_PASSWORD=admin_seed_password
ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=User
ADMIN_PHONE=08000000000


Seed the one admin account:

```bash
node scripts/seedAdmin.js
```

Run the server:

```bash
nodemon app.js
```

## API Documentation

Interactive Swagger docs are available at:

http://localhost:3000/api-docs


## Endpoints

**Users**
- `POST /users/signup`
- `POST /users/login` *(rate-limited: 5 attempts / 15 min)*
- `PATCH /users/notifications` — toggle email notifications
- `PATCH /users/set-pin` — set a transaction PIN

**KYC**
- `POST /kyc/submit-kyc` — submit BVN or NIN for verification

**Accounts**
- `POST /accounts/create-account` — requires verified KYC
- `POST /accounts/transfer`
- `GET /accounts/balance`
- `GET /accounts/transaction-status/:nibssTransactionId`
- `GET /accounts/transaction-history`
- `GET /accounts/name-enquiry/:accountNumber`
- `GET /accounts/all-accounts` — admin only

## Full Testing Flow

1. Sign up → 2. Log in → 3. Submit KYC → 4. Create account → 5. Transfer → 6. Check balance → 7. Check transaction status → 8. View transaction history → 9. Name enquiry → 10. Admin: view all accounts

## A Note on the NIBSS API Documentation

Several NIBSS by Phoenix endpoints return response shapes that differ from the official documentation. For example:
- `validateBvn`/`validateNin` return `{ success, data }` or `{ message, response }` rather than the documented flat `{ valid, ... }` shape
- `account/create` nests all account fields under an `account` key rather than returning them flat, and does not return a `bankName` field at all
- `transfer` returns the transaction identifier under `reference`, not `transactionId` as documented
- Status values are returned in uppercase (`SUCCESS`, `PENDING`) rather than the documented mixed case

These discrepancies were identified through direct testing against the live API, and the integration code was written to match observed behavior rather than the documentation.
