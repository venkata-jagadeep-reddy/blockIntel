# BlockIntel: Tamper-Evident Credential Ingestion, Risk Assessment & Blockchain Intelligence Platform

---

## 1. Executive Summary

**BlockIntel** is an enterprise-grade, tamper-evident digital credential verification and intelligence platform designed to eliminate academic and professional credential fraud.

Modern organizations, universities, and background verification agencies struggle with fraudulent certificates, edited PDF degrees, and forged transcripts. BlockIntel solves this challenge using a **hybrid on-chain/off-chain architecture**:

1. **Off-Chain Security & Intelligence:** Documents (PDF, PNG, JPEG) are validated with strict magic-byte security, stored in an encrypted local vault, parsed via an intelligent dual-engine OCR pipeline (PyMuPDF + Tesseract), forensically audited for tampering anomalies, and parsed for verified technical skills.
2. **On-Chain Blockchain Integrity:** The exact 256-bit cryptographic digest (SHA-256) of each artifact is permanently registered on an Ethereum-compatible smart contract ledger. 
3. **Zero-Knowledge Privacy:** To comply with privacy regulations (such as GDPR and FERPA), **zero Personally Identifiable Information (PII)** and zero document contents are placed on the blockchain—only the one-way cryptographic fingerprint and timestamp.
4. **Universal Tamper Detection:** Any third party can upload any document to test whether it exists in the system database, whether it is 100% authentic and unaltered, or if it is an altered/tampered document.

---

## 2. High-Level Architecture & Workflow

```
[ Candidate / Institution ]
            │
            ▼
 ┌────────────────────────────────────────────────────────┐
 │            FastAPI Security & Ingestion Layer          │
 │  - Magic-Byte Validation (PDF, PNG, JPEG)              │
 │  - Path Traversal & File Sanity Defense                │
 │  - Exact SHA-256 Checksum Computation                  │
 └──────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────┐                       ┌─────────────────┐
│ Secure Vault │                       │ SQLite Database │
│ data/vault/  │                       │ 11 Relational   │
│ (0o600 perm) │                       │ Tables          │
└───────┬──────┘                       └────────┬────────┘
        │                                       │
        ▼                                       ▼
┌────────────────────────────────────────────────────────┐
│               Analysis & Extraction Pipelines          │
│  ├─ Document Processing: PyMuPDF Native + Tesseract    │
│  ├─ Metadata Forensics: Toolchains, Fonts, Geometry    │
│  ├─ Risk Assessment: 10+ Heuristic Tampering Signals   │
│  └─ Skill Intelligence: Evidence-Grounded Extraction   │
└──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Blockchain Integrity Boundary              │
│  - Smart Contract: CredentialRegistry.sol (Solidity)   │
│  - Proof-of-Existence: bytes32 Hash + Block Timestamp   │
│  - Deterministic Dev Ledger & EVM Testnet Adaptor      │
└──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            React + TypeScript Dashboard UI             │
│  ├─ Executive Overview & Risk Score Dials              │
│  ├─ Split Live Visual Document Preview & OCR Stream    │
│  ├─ Universal Presence & Tamper Scanner Engine         │
│  ├─ Forensic Metadata & Vector Geometry Viewer         │
│  ├─ Skill Intelligence & Evidence Breakdown            │
│  └─ Permanent Document Purge & Lifecycle Deletion      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems & Technical Details

### 3.1. Ingestion & Storage Vault Security
- **File Validation:** Incoming files are strictly inspected using binary magic-byte signatures (`%PDF-` for PDFs, `PNG` for PNGs, `ÿØÿ` for JPEGs). File extensions alone are never trusted.
- **Deduplication:** Artifacts are indexed by their exact SHA-256 hash. Uploading an identical document returns the existing ledger record without duplicating storage.
- **Vault Storage:** Files are stored in `backend/data/vault/` with POSIX permissions `0o600` (owner read/write only). Paths are resolved strictly within the sandbox to defend against directory traversal attacks.

### 3.2. Document Processing & OCR Engine
- **Dual-Engine Extraction:** 
  1. Primary: Fast, high-accuracy native text stream extraction using **PyMuPDF** (`fitz`).
  2. Fallback: If native text contains fewer than 50 characters, or for image files (PNG/JPEG), the pipeline automatically activates **Tesseract OCR** at 150 DPI.
- **Text Block Geometry:** Captures text coordinates, bounding boxes, and per-block OCR confidence scores.

### 3.3. Metadata Forensics & Structure
- **Inspection Attributes:** Author headers, PDF producer, creator toolchain, creation date, and modification timestamps.
- **Structural Topology:** Counts vector drawings, embedded raster images, page dimensions, and embedded fonts.
- **Anomalies:** Flags missing author/creator headers, suspicious consumer PDF editors (e.g., Canva, Photoshop, PDFescape), font mismatches, and modification dates that precede creation dates.

### 3.4. Authenticity Risk Assessment
- **Explainable Scoring:** Calculates an objective risk score from `0` to `100` categorized into `LOW` (0–29), `MEDIUM` (30–69), and `HIGH` (70–100).
- **Rule of Evidence:** Risk is presented transparently as heuristic signals for human auditing, never as an ungrounded claim of legal forgery.
- **Audited Signals:**
  - `SUSPICIOUS_PRODUCER`: File generated or edited with image/graphic software rather than an official institutional pipeline.
  - `FUTURE_TIMESTAMP`: Document creation or modification date is in the future.
  - `MODIFIED_AFTER_CREATION`: Document altered significantly after original generation date.
  - `FONT_INCONSISTENCY`: Scanned certificate contains mixed vector fonts indicative of text overlays.
  - `LOW_OCR_CONFIDENCE`: Text clarity degraded due to scanning artifacts or intentional obfuscation.

### 3.5. Blockchain Integrity & Smart Contracts
- **Solidity Smart Contract:** `contracts/CredentialRegistry.sol` (Solidity `^0.8.20`).
- **State Storage:**
  ```solidity
  struct CredentialRecord { 
      uint256 registeredAt; 
      address registeredBy; 
  }
  mapping(bytes32 => CredentialRecord) private records;
  ```
- **Functions:**
  - `registerCredential(bytes32 credentialHash)`: Verifies uniqueness, records block timestamp and sender address, and emits `CredentialRegistered`.
  - `verifyCredential(bytes32 credentialHash)`: Constant-time `O(1)` on-chain verification returning `bool`.
  - `getCredentialRecord(bytes32 credentialHash)`: Returns `(registeredAt, registeredBy)`.
- **Hybrid Privacy Compliance:** No personal names, grades, or sensitive attributes are stored on the blockchain. Because the hash is one-way, it is fully GDPR/FERPA compliant.

### 3.6. Universal Presence & Tamper Scanner
Accessible without needing prior credential selection:
- **Presence Check:** Determines if the submitted artifact exists in the system database (`● PRESENT` vs. `○ NOT PRESENT`).
- **Tamper Detection:**
  - **`✓ 100% ORIGINAL`**: Exact cryptographic match (identical SHA-256).
  - **`⚠ TAMPERED ARTIFACT`**: Matches an existing database record by filename or text similarity (PyMuPDF vocabulary overlap), but the SHA-256 hash differs. Discrepancies (byte size differences, text variations) are displayed in a forensic comparison table.
  - **`? UNREGISTERED`**: Brand-new document not found in the repository.

### 3.7. Skill Intelligence Engine
- **Taxonomy Normalization:** Normalizes informal or varied resume terms into canonical skills (e.g., "ReactJS", "React.js" → "React").
- **Grounded Evidence:** Every detected skill is linked to the exact page number, text excerpt, character offset, and source classification.
- **Evaluations:** Assigns competency (0–100) and confidence (0–100) scores with clear rationales.

#### 3.8. Permanent Document Deletion (Data Lifecycle)
- Clean deletion via UI or API (`DELETE /api/v1/credentials/{credential_id}`).
- Cascades across all 11 database tables and purges the physical file from `backend/data/vault/`.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Python 3.12, FastAPI, Uvicorn, AnyIO |
| **ORM & Database** | SQLAlchemy 2.0 (Async), SQLite 3, `aiosqlite` |
| **Document Processing** | PyMuPDF (`fitz`), Tesseract OCR (`pytesseract`), Pillow |
| **Validation & Serialization** | Pydantic v2, Pydantic-Settings |
| **Frontend Framework** | React 18, TypeScript, Vite, Tailwind-grade Vanilla CSS |
| **Smart Contracts** | Solidity `^0.8.20`, Minimal Byte32 Hash Registry |

---

## 5. Database Architecture & Schema

The database is an embedded SQLite store located at `backend/data/blockintel.db`, consisting of **11 relational tables** configured with cascading orphan deletion:

```
┌───────────────────────────────────────────────────────────┐
│                       credentials                         │
│  PK: id (UUID) | credential_id (Unique) | original_fname  │
│  file_type | mime_type | file_size_bytes | storage_path   │
│  sha256_hash | status | created_at | updated_at           │
└─────────────────────────────┬─────────────────────────────┘
                              │ 1:1 / 1:N Cascades
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
│ document_extractions ││   metadata_records   ││   risk_assessments   │
│ PK: id               ││ PK: id               ││ PK: id               │
│ FK: credential_id    ││ FK: credential_id    ││ FK: credential_id    │
│ extraction_method    ││ author, producer     ││ risk_score (0-100)   │
│ text_available       ││ creator, dates       ││ risk_level           │
│ average_ocr_conf     ││ raw_metadata (JSON)  ││ summary_explanations │
│ full_raw_text        ││ structural_info      │└──────────┬───────────┘
└──────────┬───────────┘└──────────────────────┘           │ 1:N
           │ 1:N                                           ▼
           ▼                                    ┌──────────────────────┐
┌──────────────────────┐                        │     risk_signals     │
│   extracted_pages    │                        │ PK: id               │
│ PK: id               │                        │ FK: risk_assess_id   │
│ FK: credential_id    │                        │ signal_type, severity│
│ page_number, text    │                        │ description, metadata│
│ blocks (JSON)        │                        └──────────────────────┘
└──────────────────────┘
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
│  blockchain_records  ││        skills        ││  verification_logs   │
│ PK: id               ││ PK: id               ││ PK: id               │
│ FK: credential_id    ││ FK: credential_id    ││ submitted_hash       │
│ contract_address     ││ canonical_skill      ││ registered_hash      │
│ transaction_hash     ││ detected_term        ││ hash_match (bool)    │
│ block_number         ││ category             ││ integrity_status     │
│ network_id           │└──────────┬───────────┘│ verified_at          │
└──────────────────────┘           │ 1:1         └──────────────────────┘
                       ┌───────────┴───────────┐
                       ▼                       ▼
            ┌──────────────────────┐┌──────────────────────┐
            │    skill_evidence    ││  skill_evaluations   │
            │ PK: id, FK: skill_id ││ PK: id, FK: skill_id │
            │ evidence_text        ││ competency_score     │
            │ page_number, offsets ││ confidence_score     │
            └──────────────────────┘└──────────────────────┘
```

---

## 6. Complete REST API Reference

### 6.1. Credential Operations

#### `POST /api/v1/credentials/upload`
Uploads and validates a digital credential file.
- **Request:** `multipart/form-data` with `file: UploadFile` (PDF, PNG, JPEG up to 15 MB).
- **Response `201 Created`:**
  ```json
  {
    "credential_id": "CRD-BEA7261221B1",
    "original_filename": "diploma.pdf",
    "file_type": "PDF",
    "mime_type": "application/pdf",
    "file_size_bytes": 195535,
    "sha256_hash": "8c9a114bb3f0be531bbede4484fcdee1e3c399a6e2e7efc1ec48b58555374469",
    "status": "UPLOADED",
    "is_duplicate": false,
    "message": "Credential uploaded and securely stored successfully."
  }
  ```

#### `GET /api/v1/credentials`
Lists all credentials in the database.
- **Query Params:** `skip=0`, `limit=50`.
- **Response `200 OK`:** `{ "total": 14, "items": [ ... ] }`.

#### `GET /api/v1/credentials/{credential_id}`
Retrieves details for a specific credential.

#### `GET /api/v1/credentials/{credential_id}/file`
Streams the raw document bytes inline with appropriate `Content-Type` header (`application/pdf`, `image/png`, `image/jpeg`). Powers the in-browser PDF iframe and image viewer.

#### `DELETE /api/v1/credentials/{credential_id}`
Permanently deletes the credential, its vault file, and all cascading database relations.
- **Response `200 OK`:**
  ```json
  {
    "status": "deleted",
    "credential_id": "CRD-BEA7261221B1",
    "message": "Credential 'CRD-BEA7261221B1' and all associated records deleted successfully."
  }
  ```

---

### 6.2. Intelligence & Complete Pipeline

#### `POST /api/v1/credentials/{credential_id}/complete`
Executes the full Phase 1 intelligence pipeline in a single transaction (OCR extraction, metadata analysis, risk heuristics, blockchain registration, and skill identification).
- **Response `200 OK`:** Returns `IntelligenceResult` containing:
  - `credential`: Stored artifact metadata.
  - `document_processing`: OCR confidence, pages, extracted text.
  - `metadata`: Toolchain, author, geometry, embedded fonts.
  - `authenticity_risk`: Score (0-100), level (`LOW`/`MEDIUM`/`HIGH`), signal breakdown.
  - `integrity`: Cryptographic hash match status and blockchain transaction receipt.
  - `skills`: Identified skills with evidence and competency evaluations.

---

### 6.3. Verification & Tamper Detection

#### `POST /api/v1/credentials/verify-document`
Universal presence and tamper verification. Accepts **any** file and checks across all stored database credentials.
- **Request:** `multipart/form-data` with `file: UploadFile`.
- **Response `200 OK` (Tamper Detected Example):**
  ```json
  {
    "is_present": true,
    "verdict": "TAMPERED",
    "is_tampered": true,
    "is_original": false,
    "submitted_filename": "altered_diploma.pdf",
    "submitted_hash": "27db4a9279cf538b0a93bd7c1ea28eb9c785e8bd161f0cfdd394d7168ae35a68",
    "submitted_size_bytes": 915,
    "matched_credential_id": "CRD-7D88C8933108",
    "matched_filename": "original_diploma.pdf",
    "registered_hash": "7f213a00df8adf7a824b951deaf67ed379e31843d4ef84b1a8f4a8d781da57ec",
    "match_confidence": 0.88,
    "match_reason": "TEXT_CONTENT_SIMILARITY_88PCT",
    "details": "TAMPER DETECTED: Document matches registered record 'original_diploma.pdf' (CRD-7D88C8933108), but its cryptographic SHA-256 digest does not match the registered ledger fingerprint.",
    "diff_indicators": [
      "Text content shares 88% vocabulary overlap with 'original_diploma.pdf'.",
      "File size disparity: submitted 915 bytes vs registered 892 bytes (+23 bytes).",
      "Cryptographic integrity check failed: file bytes have been altered."
    ],
    "blockchain_registered": true,
    "block_number": 3279407630,
    "transaction_hash": "0xc377ca0eb7332c775b4dff3ff87ef5c16f27bc95dc7d204900daea973505f4a3"
  }
  ```

---

## 7. Frontend Dashboard Walkthrough

The web client is an enterprise-grade dark/light dashboard accessible at `http://localhost:5173`:

1. **Sidebar Navigation:**
   - **Credential Selector:** Dropdown listing all stored credentials with instant switching.
   - **Delete Current Document:** Red danger action to permanently purge the selected document.
   - **Check Document [Scanner]:** Dedicated top-level tab for universal presence and tamper detection.
   - **Intelligence Tabs:** Executive Overview, Authenticity Risk, Blockchain Integrity, Document & OCR, Metadata & Layout, Skill Intelligence, Raw Response JSON.

2. **Check Document Workspace:**
   - Universal drag-and-drop dropzone supporting any credential file.
   - Instant presence status (`● PRESENT IN SYSTEM DATABASE` vs `○ NOT PRESENT`).
   - Authenticity badge (`✓ 100% ORIGINAL` vs `⚠ TAMPERED ARTIFACT` vs `? UNREGISTERED`).
   - Side-by-side comparison table of submitted vs registered hashes, sizes, and detection engines.
   - Quick action to open the matched credential’s complete dossier.

3. **Split Document & OCR Inspection:**
   - **Left Pane:** In-browser interactive artifact preview (`<iframe>` for PDFs, responsive `<img>` for PNG/JPEG) with Popout and Download actions.
   - **Right Pane:** Real-time searchable OCR text stream. Displays a high-contrast inspection card if the file is a raster graphic without font glyphs.

---

## 8. Installation, Configuration & Execution

### 8.1. Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Tesseract OCR (`tesseract-ocr`)

### 8.2. Backend Setup
```bash
cd /home/jagadeep-reddy/blockintel/backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies in editable mode
pip install -e .

# Start the FastAPI server
uvicorn blockintel.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### 8.3. Frontend Setup
```bash
cd /home/jagadeep-reddy/blockintel/frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
- Web Application: `http://localhost:5173`

### 8.4. Running the Test Suite
```bash
cd /home/jagadeep-reddy/blockintel/backend
.venv/bin/pytest -v
```
All **52 unit and integration tests** execute in under 6 seconds, validating:
- Magic-byte security and path traversal defense
- Duplicate detection and local vault storage
- PyMuPDF and Tesseract OCR pipelines
- Metadata and layout geometry extraction
- Heuristic risk scoring
- Smart contract registration and local ledger provider
- Universal document presence and tamper detection
- Deletion lifecycle and cascading database purging

---

## 9. Frequently Asked Questions (Viva / Presentation Q&A)

### Q1: Why use a hybrid off-chain/on-chain architecture?
> **Answer:** Blockchains are optimized for distributed consensus and state immutability, not large file storage. Storing a 500 KB PDF on Ethereum would require millions of gas units, costing thousands of dollars. By anchoring only the 32-byte cryptographic SHA-256 fingerprint on-chain while storing the artifact off-chain, we achieve the exact same mathematical guarantee of tamper evidence at negligible cost and zero blockchain bloat.

### Q2: How does the system guarantee privacy (GDPR / Right to be Forgotten)?
> **Answer:** Personal data (names, IDs, graduation dates) is strictly kept off-chain. The smart contract stores only `bytes32 credentialHash` and timestamps. Because SHA-256 is a one-way cryptographic function, the hash cannot be reversed to reveal personal identity. When a document is deleted via our deletion API, all personal data is permanently purged off-chain while the on-chain hash remains an anonymous cryptographic timestamp.

### Q3: What happens if an attacker modifies a single character in a certificate?
> **Answer:** Due to the avalanche effect of SHA-256, altering a single byte causes a completely different, unpredictable 256-bit hash. When the tampered document is submitted to the **Check Document** scanner, the backend detects that the text or filename matches an existing record, but the submitted hash differs from the registered ledger fingerprint, immediately flagging **`⚠ TAMPERED ARTIFACT DETECTED`**.

### Q4: How does the smart contract verify credential authenticity?
> **Answer:** In `contracts/CredentialRegistry.sol`, when `verifyCredential(bytes32 credentialHash)` is called, the contract performs a constant-time lookup in its private `records` mapping. If `registeredAt != 0`, it proves that the hash was registered by an authorized issuer at a verified block timestamp.

### Q5: What if an attacker renames a tampered certificate file?
> **Answer:** BlockIntel uses multi-layered detection. Even if the filename is changed, the system runs a token-similarity check using PyMuPDF to compare vocabulary overlap against registered database artifacts. If text similarity exceeds the matching threshold while the cryptographic hash fails, it flags the document as a tampered variant.

---

*Document generated for BlockIntel — Phase 1 Trust & Intelligence Engine.*
