# BlockIntel — Phase 1

BlockIntel processes credential artifacts without altering them and produces a Phase 1 trust-and-intelligence profile.

> **Full Technical & Operational Documentation:**
> For comprehensive system architecture, database schema, REST API specification, universal tamper detection mechanics, and technical viva/interview Q&A, see [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md).

## What is implemented

1. Secure PDF, PNG, and JPEG ingestion with magic-byte validation, SHA-256 duplicate detection, and restricted local-vault storage.
2. Native PDF text extraction with Tesseract OCR fallback, plus image OCR.
3. PDF/image metadata and document-structure extraction.
4. Explainable authenticity-risk signals and configurable LOW/MEDIUM/HIGH scoring. Risk is never presented as proof of forgery or issuer authenticity.
5. Exact-original-byte SHA-256 registration and integrity verification.
6. Evidence-grounded skill extraction, explicit alias normalization, competency evidence scoring, and confidence scoring.
7. One complete Phase 1 result endpoint.

Recruitment features (job matching, ranking, recruiter dashboards, and recommendations) are deliberately outside this phase.

## Run locally

### 1. Backend API

```bash
python3 -m venv .venv
.venv/bin/python -m ensurepip --upgrade
.venv/bin/python -m pip install -e .
.venv/bin/python -m uvicorn blockintel.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the API documentation.

### 2. Frontend React Dashboard

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the real-time trust and intelligence dashboard. You can ingest credential artifacts (PDF, PNG, JPEG), switch between stored credentials in the database, inspect evidence-grounded skills and forensic metadata, and verify file integrity in real time with the backend verification API.

Run tests with:

```bash
.venv/bin/python -m pytest -q
```

## Primary workflow

1. `POST /api/v1/credentials/upload`
2. `POST /api/v1/credentials/{credential_id}/complete`

The complete endpoint performs processing, metadata analysis, risk assessment, registration, stored-artifact verification, and skill intelligence. Individual endpoints are also available for `/process`, `/metadata`, `/risk`, `/register`, `/verify`, and `/skills`.

## Blockchain boundary

`contracts/CredentialRegistry.sol` is an Ethereum-compatible minimal-hash registry contract. The running application uses a deterministic **local development ledger provider** by default so the workflow can operate without a deployed chain. It intentionally does not claim Ethereum registration. Replace `LocalBlockchainProvider` with a Web3-backed provider after deploying the contract and configuring a network/account.

## Important trust model

- **Authenticity risk:** suspicious document signals only; never a forgery verdict.
- **Artifact integrity:** whether submitted bytes exactly match the registered artifact hash.
- **Issuer authenticity:** not established by the hash or local ledger and requires separate issuer verification.
