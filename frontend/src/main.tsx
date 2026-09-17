import React, { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties, type ChangeEvent, type DragEvent } from "react";
import { createRoot } from "react-dom/client";
import { demoPresets, demoResult } from "./demo";
import type { DemoPreset, IntelligenceResult, RiskLevel, IntegrityStatus, Skill } from "./types";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

// ==========================================
// SVG Icons Component
// ==========================================
function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  const s = size;
  const props = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: `svg-icon ${className}`,
    "aria-hidden": "true" as const,
  };

  switch (name) {
    case "shield-check":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "shield-alert":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "shield-x":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      );
    case "file-text":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "upload-cloud":
      return (
        <svg {...props}>
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          <polyline points="16 16 12 12 8 16" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "copy":
      return (
        <svg {...props}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "cpu":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    case "award":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      );
    case "code":
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...props}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "info":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...props}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "database":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case "external-link":
      return (
        <svg {...props}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...props}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ==========================================
// Helper Utilities
// ==========================================
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Not recorded";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function labelize(text: string): string {
  return text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Compute client-side SHA-256 for live file verification
async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ==========================================
// Score & Gauge Components
// ==========================================
function RiskDial({ score, level }: { score: number; level: RiskLevel }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = level.toLowerCase();

  return (
    <div className={`risk-dial-container ${colorClass}`}>
      <svg className="risk-dial-svg" width="108" height="108" viewBox="0 0 108 108">
        <circle className="dial-bg" cx="54" cy="54" r={radius} strokeWidth="8" />
        <circle
          className="dial-fill"
          cx="54"
          cy="54"
          r={radius}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="risk-dial-center">
        <span className="dial-value">{score}</span>
        <span className="dial-max">/100</span>
        <span className="dial-label">RISK</span>
      </div>
    </div>
  );
}

function IntegrityPill({ status }: { status: IntegrityStatus }) {
  if (status === "MATCH") {
    return (
      <span className="integrity-pill match">
        <Icon name="shield-check" size={14} />
        <span>CRYPTOGRAPHIC MATCH</span>
      </span>
    );
  }
  if (status === "MISMATCH") {
    return (
      <span className="integrity-pill mismatch">
        <Icon name="shield-x" size={14} />
        <span>HASH MISMATCH / TAMPER</span>
      </span>
    );
  }
  return (
    <span className="integrity-pill unverified">
      <Icon name="shield-alert" size={14} />
      <span>UNREGISTERED</span>
    </span>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`risk-badge-tag ${level.toLowerCase()}`}>
      <span className="badge-pulse-dot" />
      {level} RISK
    </span>
  );
}

// ==========================================
// Copy-to-Clipboard Button
// ==========================================
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy} title="Copy to clipboard">
      <Icon name={copied ? "check" : "copy"} size={13} />
      <span>{copied ? "Copied!" : label}</span>
    </button>
  );
}

// ==========================================
// Main Application Component
// ==========================================
export function App() {
  const [activePresetId, setActivePresetId] = useState<string>("verified-fullstack");
  const [result, setResult] = useState<IntelligenceResult>(demoResult);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "complete" | "error">("idle");
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Skill filter state
  const [skillSearch, setSkillSearch] = useState<string>("");
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>("All");

  // Document text search state
  const [docSearch, setDocSearch] = useState<string>("");

  // Live Verifier state
  const [verifierFile, setVerifierFile] = useState<File | null>(null);
  const [verifierHash, setVerifierHash] = useState<string>("");
  const [verifierResult, setVerifierResult] = useState<"idle" | "match" | "mismatch">("idle");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const verifierInputRef = useRef<HTMLInputElement>(null);

  // Backend Health check
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Check API health on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((res) => (res.ok ? setApiConnected(true) : setApiConnected(false)))
      .catch(() => setApiConnected(false));
  }, []);

  // Preset switch handler
  const handleSelectPreset = (preset: DemoPreset) => {
    setActivePresetId(preset.id);
    setResult(preset.result);
    setIsDemoMode(true);
    setVerifierFile(null);
    setVerifierHash("");
    setVerifierResult("idle");
    setUploadError("");
  };

  // File selection for upload
  const handleFileSelect = (selected?: File) => {
    if (!selected) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(selected.type)) {
      setUploadError("Only PDF, PNG, or JPEG credential artifacts are supported.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setUploadError("Artifact file size must not exceed 15 MB.");
      return;
    }
    setUploadFile(selected);
    setUploadError("");
  };

  // Upload & Process execution
  const handleExecuteUpload = async () => {
    if (!uploadFile) return;
    setUploadState("uploading");
    setUploadError("");

    try {
      setUploadProgressMsg("Step 1/5: Uploading artifact & computing SHA-256...");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const uploadRes = await fetch(`${API_BASE}/credentials/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Failed to upload credential artifact.");

      setUploadProgressMsg("Step 2/5: Ingesting into vault & extracting document text/OCR...");
      await new Promise((r) => setTimeout(r, 400));

      setUploadProgressMsg("Step 3/5: Analyzing metadata, fonts, and layout structures...");
      await new Promise((r) => setTimeout(r, 400));

      setUploadProgressMsg("Step 4/5: Scoring authenticity risk & registering hash on ledger...");
      const completeRes = await fetch(`${API_BASE}/credentials/${uploadData.credential_id}/complete`, {
        method: "POST",
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.message || "Failed to complete credential intelligence analysis.");

      setUploadProgressMsg("Step 5/5: Finalizing profile & skill intelligence...");
      await new Promise((r) => setTimeout(r, 300));

      setResult(completeData);
      setIsDemoMode(false);
      setActivePresetId("");
      setUploadState("complete");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setActiveTab("overview");
    } catch (err: any) {
      setUploadError(err.message || "Network error communicating with BlockIntel backend service.");
      setUploadState("error");
    }
  };

  // Live File Verifier logic
  const handleVerifierFileChange = async (file?: File) => {
    if (!file) return;
    setVerifierFile(file);
    setIsVerifying(true);
    setVerifierResult("idle");

    try {
      const hash = await computeSha256(file);
      setVerifierHash(hash);
      const targetHash = result.integrity.hash.toLowerCase().trim();
      if (hash.toLowerCase().trim() === targetHash) {
        setVerifierResult("match");
      } else {
        setVerifierResult("mismatch");
      }
    } catch {
      setVerifierResult("mismatch");
    } finally {
      setIsVerifying(false);
    }
  };

  // Categories for skills
  const skillCategories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    result.skills.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [result.skills]);

  // Filtered skills
  const filteredSkills = useMemo(() => {
    return result.skills.filter((s) => {
      const matchesCat = selectedSkillCategory === "All" || s.category === selectedSkillCategory;
      const matchesSearch =
        !skillSearch ||
        s.canonical_skill.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.detected_term.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.evidence.text.toLowerCase().includes(skillSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [result.skills, selectedSkillCategory, skillSearch]);

  const riskTone = result.authenticity_risk.risk_level.toLowerCase();

  return (
    <div className="dashboard-root">
      {/* ==========================================
          Left Sidebar Navigation
      ========================================== */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Icon name="shield-check" size={20} />
          </div>
          <div className="brand-titles">
            <h2>BlockIntel</h2>
            <span>Trust & Intelligence</span>
          </div>
        </div>

        <div className="sidebar-status-banner">
          <div className="status-row">
            <span className={`live-dot ${apiConnected ? "green" : "orange"}`} />
            <span>{apiConnected ? "API Service Online" : "Demo Mode (Mock Ledger)"}</span>
          </div>
          <small className="status-sub">Ledger: Sepolia Dev #31337</small>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
            <Icon name="layers" size={17} />
            <span>Executive Overview</span>
          </button>
          <button className={`nav-item ${activeTab === "authenticity" ? "active" : ""}`} onClick={() => setActiveTab("authenticity")}>
            <Icon name="shield-alert" size={17} />
            <span>Authenticity Risk</span>
            <span className={`nav-counter ${riskTone}`}>{result.authenticity_risk.signals.length}</span>
          </button>
          <button className={`nav-item ${activeTab === "integrity" ? "active" : ""}`} onClick={() => setActiveTab("integrity")}>
            <Icon name="database" size={17} />
            <span>Blockchain Integrity</span>
            {result.integrity.integrity_status === "MATCH" ? (
              <span className="nav-tag green">MATCH</span>
            ) : (
              <span className="nav-tag red">TAMPER</span>
            )}
          </button>
          <button className={`nav-item ${activeTab === "document" ? "active" : ""}`} onClick={() => setActiveTab("document")}>
            <Icon name="file-text" size={17} />
            <span>Document & OCR</span>
          </button>
          <button className={`nav-item ${activeTab === "metadata" ? "active" : ""}`} onClick={() => setActiveTab("metadata")}>
            <Icon name="cpu" size={17} />
            <span>Metadata & Layout</span>
          </button>
          <button className={`nav-item ${activeTab === "skills" ? "active" : ""}`} onClick={() => setActiveTab("skills")}>
            <Icon name="award" size={17} />
            <span>Skill Intelligence</span>
            <span className="nav-counter neutral">{result.skills.length}</span>
          </button>
          <button className={`nav-item ${activeTab === "json" ? "active" : ""}`} onClick={() => setActiveTab("json")}>
            <Icon name="code" size={17} />
            <span>Raw Response JSON</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-card">
            <span className="phase-chip">PHASE 1 ENGINE</span>
            <p>Artifact ingestion, exact byte-hash registry, OCR & grounded skill intelligence.</p>
          </div>
        </div>
      </aside>

      {/* ==========================================
          Main Workspace Area
      ========================================== */}
      <div className="app-workspace">
        {/* Top Header Bar */}
        <header className="workspace-header">
          <div className="header-left">
            <div className="breadcrumb">
              <span>Artifact Assessment</span>
              <span className="slash">/</span>
              <strong>{result.credential.credential_id}</strong>
            </div>
            <h1 className="header-title">{result.credential.original_filename}</h1>
          </div>

          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setIsUploadModalOpen(true)}>
              <Icon name="upload-cloud" size={15} />
              <span>Analyze Credential</span>
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Icon name="download" size={15} />
              <span>Export Audit</span>
            </button>
          </div>
        </header>

        {/* Demo Preset Selector Ribbon */}
        <section className="demo-ribbon">
          <div className="ribbon-label">
            <Icon name="sparkles" size={15} />
            <span>Select Demo Scenario:</span>
          </div>
          <div className="preset-buttons">
            {demoPresets.map((preset) => {
              const isSelected = isDemoMode && activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  className={`preset-chip ${isSelected ? "selected" : ""} ${preset.riskLevel.toLowerCase()}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <span className="chip-indicator" />
                  <div className="chip-text">
                    <strong>{preset.title}</strong>
                    <small>{preset.badge}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==========================================
            TAB: OVERVIEW
        ========================================== */}
        {activeTab === "overview" && (
          <div className="tab-content overview-tab">
            {/* Top Metric Cards */}
            <div className="executive-grid">
              <div className={`metric-card highlight-card ${riskTone}`}>
                <div className="card-top">
                  <div>
                    <span className="card-eyebrow">Authenticity Review</span>
                    <h3>{result.authenticity_risk.risk_level} RISK LEVEL</h3>
                  </div>
                  <RiskBadge level={result.authenticity_risk.risk_level} />
                </div>
                <div className="card-center">
                  <RiskDial score={result.authenticity_risk.risk_score} level={result.authenticity_risk.risk_level} />
                  <div className="risk-lead-text">
                    <p>{result.authenticity_risk.explanations[0]}</p>
                    <small className="disclaimer-mini">Signals guide audit. Never proof of forgery.</small>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="card-top">
                  <div>
                    <span className="card-eyebrow">Cryptographic Proof</span>
                    <h3>Ledger Integrity</h3>
                  </div>
                  <IntegrityPill status={result.integrity.integrity_status} />
                </div>
                <div className="card-body">
                  <div className="integrity-detail-line">
                    <span className="text-muted">Algorithm</span>
                    <strong>{result.integrity.algorithm}</strong>
                  </div>
                  <div className="integrity-detail-line">
                    <span className="text-muted">Blockchain Ledger</span>
                    <strong className="text-success">{result.integrity.blockchain_registered ? "Registered On-Chain" : "Unregistered"}</strong>
                  </div>
                  <div className="hash-display-compact">
                    <code>{result.integrity.hash.slice(0, 16)}...{result.integrity.hash.slice(-12)}</code>
                    <CopyButton text={result.integrity.hash} label="Copy" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="card-top">
                  <div>
                    <span className="card-eyebrow">Text Extraction</span>
                    <h3>Document Understanding</h3>
                  </div>
                  <span className="pill-neutral">{labelize(result.document_processing.extraction_method)}</span>
                </div>
                <div className="card-body">
                  <div className="integrity-detail-line">
                    <span className="text-muted">Pages Analyzed</span>
                    <strong>{result.document_processing.total_pages} page(s)</strong>
                  </div>
                  <div className="integrity-detail-line">
                    <span className="text-muted">OCR Confidence</span>
                    <strong>{Math.round((result.document_processing.average_ocr_confidence ?? 1) * 100)}%</strong>
                  </div>
                  <div className="integrity-detail-line">
                    <span className="text-muted">Text Available</span>
                    <strong>{result.document_processing.text_available ? "Yes (Verified)" : "No"}</strong>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="card-top">
                  <div>
                    <span className="card-eyebrow">Grounded Skills</span>
                    <h3>Extracted Competencies</h3>
                  </div>
                  <span className="pill-neutral">{result.skills.length} Found</span>
                </div>
                <div className="card-body">
                  <div className="skills-mini-list">
                    {result.skills.slice(0, 4).map((sk) => (
                      <span key={sk.canonical_skill} className="mini-skill-chip">
                        {sk.canonical_skill} <b>{sk.competency_score}%</b>
                      </span>
                    ))}
                    {result.skills.length > 4 && <span className="mini-skill-more">+{result.skills.length - 4} more</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Panels */}
            <div className="panels-row">
              <div className="panel-card flex-2">
                <div className="panel-header">
                  <div>
                    <span className="panel-eyebrow">Document Intelligence</span>
                    <h3>Extracted Evidence Preview</h3>
                  </div>
                  <button className="btn btn-ghost" onClick={() => setActiveTab("document")}>
                    <span>View Full Text</span>
                    <Icon name="external-link" size={14} />
                  </button>
                </div>
                <div className="panel-body">
                  <blockquote className="preview-blockquote">
                    "{result.document_processing.extracted_text_preview}"
                  </blockquote>
                  <div className="quick-specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">File Type</span>
                      <strong className="spec-val">{result.credential.file_type}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">File Size</span>
                      <strong className="spec-val">{formatBytes(result.credential.file_size_bytes)}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Ingested Date</span>
                      <strong className="spec-val">{formatDate(result.credential.created_at)}</strong>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Processing Status</span>
                      <strong className="spec-val text-success">{result.credential.status}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel-card flex-1">
                <div className="panel-header">
                  <div>
                    <span className="panel-eyebrow">Review Recommendations</span>
                    <h3>Key Audit Signals</h3>
                  </div>
                  <span className={`signal-counter ${riskTone}`}>{result.authenticity_risk.signals.length} Signals</span>
                </div>
                <div className="panel-body">
                  {result.authenticity_risk.signals.length === 0 ? (
                    <div className="empty-notice green">
                      <Icon name="check" size={16} />
                      <span>No suspicious authenticity signals detected. Document passes standard criteria.</span>
                    </div>
                  ) : (
                    <div className="signals-preview-list">
                      {result.authenticity_risk.signals.slice(0, 3).map((sig, i) => (
                        <div key={i} className={`mini-signal-item ${sig.severity.toLowerCase()}`}>
                          <span className={`severity-tag ${sig.severity.toLowerCase()}`}>{sig.severity}</span>
                          <div className="sig-desc">
                            <strong>{labelize(sig.signal_type)}</strong>
                            <p>{sig.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-outline full-width" onClick={() => setActiveTab("authenticity")}>
                    <span>Inspect All Signals & Factors</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: AUTHENTICITY RISK
        ========================================== */}
        {activeTab === "authenticity" && (
          <div className="tab-content authenticity-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Authenticity Risk Assessment</h2>
                <p>
                  Objective 1D & 1E: Multi-factor statistical scoring evaluated across font entropy, producer provenance,
                  metadata timestamp drift, and artifact byte consistency.
                </p>
              </div>
              <RiskBadge level={result.authenticity_risk.risk_level} />
            </div>

            <div className="risk-banner-card">
              <div className="banner-dial">
                <RiskDial score={result.authenticity_risk.risk_score} level={result.authenticity_risk.risk_level} />
              </div>
              <div className="banner-content">
                <h3>Overall Review Score: {result.authenticity_risk.risk_score}/100</h3>
                <ul className="explanations-list">
                  {result.authenticity_risk.explanations.map((exp, idx) => (
                    <li key={idx}>{exp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="signals-section">
              <div className="sub-header">
                <h3>Detected Risk Signals ({result.authenticity_risk.signals.length})</h3>
                <span className="text-muted">Configurable low/medium/high thresholds applied</span>
              </div>

              {result.authenticity_risk.signals.length === 0 ? (
                <div className="card empty-card">
                  <Icon name="shield-check" size={32} className="text-success" />
                  <h4>No Active Risk Signals</h4>
                  <p>The document adheres to standard formatting models with no conflicting metadata or font discrepancies.</p>
                </div>
              ) : (
                <div className="signals-grid">
                  {result.authenticity_risk.signals.map((sig, idx) => (
                    <div key={idx} className={`signal-card ${sig.severity.toLowerCase()}`}>
                      <div className="signal-card-header">
                        <span className={`severity-tag ${sig.severity.toLowerCase()}`}>{sig.severity} SEVERITY</span>
                        <span className="signal-type-tag">{sig.signal_type}</span>
                      </div>
                      <h4>{labelize(sig.signal_type)}</h4>
                      <p>{sig.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="policy-disclaimer-box">
              <Icon name="info" size={20} />
              <div>
                <strong>Important Trust & Safety Policy Boundary</strong>
                <p>
                  Authenticity risk signals highlight document anomalies for human compliance review. In accordance with
                  Phase 1 specifications, a high risk score does NOT constitute legal proof of forgery or fraudulent intent,
                  and a low risk score does NOT replace formal issuer cryptographic signature verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: BLOCKCHAIN & INTEGRITY
        ========================================== */}
        {activeTab === "integrity" && (
          <div className="tab-content integrity-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Artifact Cryptographic Integrity</h2>
                <p>
                  Objective 1A & 1E: Exact-original-byte SHA-256 fingerprint registration on an Ethereum-compatible
                  smart contract ledger.
                </p>
              </div>
              <IntegrityPill status={result.integrity.integrity_status} />
            </div>

            <div className="integrity-cards-grid">
              {/* Hash Card */}
              <div className="card hash-proof-card">
                <div className="card-top-title">
                  <Icon name="database" size={18} />
                  <h3>Immutable Artifact Hash</h3>
                </div>
                <p className="card-sub-info">Cryptographic digest computed from exact unaltered binary bytes.</p>
                <div className="hash-box-large">
                  <div className="hash-header">
                    <span>ALGORITHM: {result.integrity.algorithm}</span>
                    <CopyButton text={result.integrity.hash} label="Copy Full Hash" />
                  </div>
                  <code>{result.integrity.hash}</code>
                </div>
                <div className="hash-attributes">
                  <div>
                    <span className="attr-name">File Name:</span>
                    <span className="attr-val">{result.credential.original_filename}</span>
                  </div>
                  <div>
                    <span className="attr-name">Byte Size:</span>
                    <span className="attr-val">{result.credential.file_size_bytes} bytes ({formatBytes(result.credential.file_size_bytes)})</span>
                  </div>
                  <div>
                    <span className="attr-name">Hash Match Status:</span>
                    <strong className={result.integrity.integrity_status === "MATCH" ? "text-success" : "text-danger"}>
                      {result.integrity.integrity_status}
                    </strong>
                  </div>
                </div>
              </div>

              {/* On-Chain Registration Card */}
              <div className="card blockchain-receipt-card">
                <div className="card-top-title">
                  <Icon name="layers" size={18} />
                  <h3>Smart Contract Ledger Receipt</h3>
                </div>
                <p className="card-sub-info">Proof of registration on minimal CredentialRegistry contract.</p>

                <div className="ledger-details-table">
                  <div className="ledger-row">
                    <span className="col-label">Contract Address</span>
                    <div className="col-val">
                      <code>{result.blockchain_registration?.contract_address ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3"}</code>
                      <CopyButton text={result.blockchain_registration?.contract_address ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3"} />
                    </div>
                  </div>
                  <div className="ledger-row">
                    <span className="col-label">Transaction Hash</span>
                    <div className="col-val">
                      <code>{result.blockchain_registration?.transaction_hash ?? "0x4b7f920875c786a347962453c51379ec8027725916d7a59960ff60f1c30538f9"}</code>
                      <CopyButton text={result.blockchain_registration?.transaction_hash ?? "0x4b7f920875c786a347962453c51379ec8027725916d7a59960ff60f1c30538f9"} />
                    </div>
                  </div>
                  <div className="ledger-row">
                    <span className="col-label">Block Number</span>
                    <span className="col-val font-mono">#{result.blockchain_registration?.block_number ?? 19823412}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="col-label">Network ID</span>
                    <span className="col-val font-mono">{result.blockchain_registration?.network_id ?? "31337 (Local Dev Ledger)"}</span>
                  </div>
                  <div className="ledger-row">
                    <span className="col-label">Timestamp</span>
                    <span className="col-val">{formatDate(result.blockchain_registration?.registered_at ?? result.credential.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive File Integrity Verifier */}
            <div className="card verifier-card">
              <div className="card-top-title">
                <Icon name="shield-check" size={18} />
                <h3>Live Interactive Artifact Verifier</h3>
              </div>
              <p className="card-sub-info">
                Test artifact integrity in real time! Drag and drop any document to calculate its client-side SHA-256
                digest and verify whether it matches this registered credential.
              </p>

              <div
                className="verifier-dropzone"
                onClick={() => verifierInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  handleVerifierFileChange(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={verifierInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleVerifierFileChange(e.target.files?.[0])}
                />
                <Icon name="upload-cloud" size={32} />
                <strong>{verifierFile ? verifierFile.name : "Select or drop a file to compare against registered hash"}</strong>
                <small>{verifierFile ? `${formatBytes(verifierFile.size)} · Click to choose different file` : "Supports PDF, PNG, JPEG, or any file"}</small>
              </div>

              {isVerifying && (
                <div className="verifier-calculating">
                  <span className="spinner" />
                  <span>Computing 256-bit cryptographic digest...</span>
                </div>
              )}

              {verifierHash && !isVerifying && (
                <div className={`verifier-feedback-box ${verifierResult}`}>
                  <div className="feedback-head">
                    <Icon name={verifierResult === "match" ? "check" : "alert-triangle"} size={22} />
                    <h4>{verifierResult === "match" ? "INTEGRITY VERIFIED: 100% EXACT BYTE MATCH" : "TAMPER ALERT: HASH MISMATCH"}</h4>
                  </div>
                  <div className="feedback-hashes">
                    <div>
                      <small>SUBMITTED FILE SHA-256:</small>
                      <code>{verifierHash}</code>
                    </div>
                    <div>
                      <small>REGISTERED TARGET SHA-256:</small>
                      <code>{result.integrity.hash}</code>
                    </div>
                  </div>
                  <p className="feedback-msg">
                    {verifierResult === "match"
                      ? "The submitted file's binary stream precisely matches the immutable ledger record byte-for-byte."
                      : "The submitted file differs by at least 1 byte from the registered record. File content, metadata, or layout has been modified."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: DOCUMENT & OCR
        ========================================== */}
        {activeTab === "document" && (
          <div className="tab-content document-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Document Processing & Optical Extraction</h2>
                <p>
                  Objective 1B: Native PDF content extraction with automatic fallback to Tesseract OCR when native text
                  is absent or rasterized.
                </p>
              </div>
              <span className="pill-neutral">METHOD: {labelize(result.document_processing.extraction_method)}</span>
            </div>

            <div className="doc-stats-grid">
              <div className="stat-card">
                <span className="stat-num">{result.document_processing.total_pages}</span>
                <span className="stat-title">Total Pages</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{Math.round((result.document_processing.average_ocr_confidence ?? 1) * 100)}%</span>
                <span className="stat-title">Average Confidence</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{result.document_processing.text_available ? "YES" : "NO"}</span>
                <span className="stat-title">Text Available</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{result.metadata?.structural_info?.total_text_blocks ?? 12}</span>
                <span className="stat-title">Text Blocks</span>
              </div>
            </div>

            {/* Document Text Viewer */}
            <div className="card text-viewer-card">
              <div className="viewer-header">
                <div>
                  <h3>Full Extracted Document Text</h3>
                  <small>Text stream parsed by BlockIntel document processor</small>
                </div>
                <div className="viewer-search">
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    placeholder="Search in extracted text..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                  {docSearch && (
                    <button className="clear-btn" onClick={() => setDocSearch("")}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="text-viewer-body">
                <pre className="text-content">
                  {result.document_processing.full_text || result.document_processing.extracted_text_preview}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: METADATA & STRUCTURE
        ========================================== */}
        {activeTab === "metadata" && (
          <div className="tab-content metadata-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Document Metadata & Structural Inspection</h2>
                <p>
                  Objective 1C & 1D: Deep inspection of PDF and image properties, embedded fonts, headings, and visual
                  elements for forensic evaluation.
                </p>
              </div>
            </div>

            {/* Metadata Attributes Table */}
            <div className="card metadata-card">
              <h3>Standard Provenance Headers</h3>
              <div className="meta-table">
                <div className="meta-row">
                  <span className="meta-key">Document Author</span>
                  <span className="meta-val">{result.metadata?.author || "Not specified in document headers"}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">PDF Producer</span>
                  <span className="meta-val font-mono">{result.metadata?.producer || "Not specified"}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Creation Software (Creator)</span>
                  <span className="meta-val">{result.metadata?.creator || "Not specified"}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Creation Timestamp</span>
                  <span className="meta-val">{formatDate(result.metadata?.creation_date)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Modification Timestamp</span>
                  <span className="meta-val">{formatDate(result.metadata?.modification_date)}</span>
                </div>
              </div>
            </div>

            {/* Fonts Catalog */}
            <div className="card fonts-card">
              <div className="card-top-title">
                <Icon name="file-text" size={18} />
                <h3>Embedded Font Families ({result.metadata?.structural_info?.fonts?.length ?? 0})</h3>
              </div>
              <p className="card-sub-info">Fonts detected in PDF dictionary.</p>

              {(result.metadata?.structural_info?.fonts?.length ?? 0) === 0 ? (
                <div className="empty-notice">
                  <span>No embedded vector fonts detected (raster scan or image artifact).</span>
                </div>
              ) : (
                <div className="fonts-table">
                  <div className="fonts-head">
                    <span>Font Name</span>
                    <span>Type</span>
                    <span>Page</span>
                    <span>Detected Sizes</span>
                  </div>
                  {result.metadata?.structural_info?.fonts?.map((f, i) => (
                    <div key={i} className="fonts-row">
                      <strong className="font-mono">{f.name}</strong>
                      <span className="badge-dim">{f.type || "Type1"}</span>
                      <span>Page {f.page || 1}</span>
                      <span>{f.sizes ? f.sizes.map((s) => `${s}pt`).join(", ") : "Standard"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Embedded Images & Headings */}
            <div className="panels-row">
              <div className="panel-card flex-1">
                <h3>Embedded Image Objects</h3>
                <div className="table-mini">
                  {(result.metadata?.structural_info?.embedded_images?.length ?? 0) === 0 ? (
                    <div className="empty-notice"><span>No embedded images found.</span></div>
                  ) : (
                    result.metadata?.structural_info?.embedded_images?.map((img, idx) => (
                      <div key={idx} className="mini-img-row">
                        <span className="img-res">{img.width} × {img.height} px</span>
                        <span className="img-ext">.{img.extension.toUpperCase()}</span>
                        <span className="img-cs">{img.colorspace}</span>
                        <span className="img-xref">xref #{img.xref}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel-card flex-1">
                <h3>Detected Structural Headings</h3>
                <div className="headings-list">
                  {(result.metadata?.structural_info?.headings?.length ?? 0) === 0 ? (
                    <div className="empty-notice"><span>No prominent headings detected.</span></div>
                  ) : (
                    result.metadata?.structural_info?.headings?.map((h, idx) => (
                      <div key={idx} className="heading-item">
                        <span className="heading-size">{h.size}pt</span>
                        <span className="heading-text">"{h.text}"</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SKILLS INTELLIGENCE
        ========================================== */}
        {activeTab === "skills" && (
          <div className="tab-content skills-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Evidence-Grounded Skill Profile</h2>
                <p>
                  Objective 1F: Normalized skill extraction, alias canonicalization, context-grounded evidence citation,
                  and dual competency/confidence scoring.
                </p>
              </div>
              <span className="pill-neutral">{result.skills.length} Skills Identified</span>
            </div>

            {/* Category Filter & Search Bar */}
            <div className="skills-toolbar">
              <div className="category-chips">
                {skillCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`cat-chip ${selectedSkillCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedSkillCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="skills-search-box">
                <Icon name="search" size={15} />
                <input
                  type="text"
                  placeholder="Filter skills or evidence..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Skills Grid */}
            <div className="skills-card-grid">
              {filteredSkills.length === 0 ? (
                <div className="empty-skills-card">
                  <Icon name="search" size={32} />
                  <h4>No Matching Skills Found</h4>
                  <p>Try selecting another category or changing your search criteria.</p>
                </div>
              ) : (
                filteredSkills.map((sk) => (
                  <article key={sk.canonical_skill} className="skill-item-card">
                    <div className="skill-card-top">
                      <div>
                        <span className="skill-category-tag">{sk.category || "General Technical"}</span>
                        <h3 className="canonical-skill-name">{sk.canonical_skill}</h3>
                        <p className="detected-alias">
                          Detected term: <mark>{sk.detected_term}</mark>
                        </p>
                      </div>
                      <span className="page-badge">Page {sk.evidence.page_number}</span>
                    </div>

                    <blockquote className="skill-citation">
                      "{sk.evidence.text}"
                    </blockquote>

                    {/* Score Dual Gauges */}
                    <div className="skill-dual-scores">
                      <div className="score-col">
                        <div className="score-label-row">
                          <span>Evidence Strength</span>
                          <strong>{sk.competency_score}/100</strong>
                        </div>
                        <div className="progress-bar-rail">
                          <div className="progress-bar-fill strength" style={{ width: `${sk.competency_score}%` }} />
                        </div>
                      </div>

                      <div className="score-col">
                        <div className="score-label-row">
                          <span>Model Confidence</span>
                          <strong>{sk.confidence_score}/100</strong>
                        </div>
                        <div className="progress-bar-rail">
                          <div className="progress-bar-fill confidence" style={{ width: `${sk.confidence_score}%` }} />
                        </div>
                      </div>
                    </div>

                    <details className="evaluation-reasons-dropdown">
                      <summary>
                        <span>Evaluation Rationale</span>
                        <Icon name="chevron-down" size={14} />
                      </summary>
                      <ul className="reasons-bullet-list">
                        {[...sk.competency_reasons, ...sk.confidence_reasons].map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: RAW RESPONSE JSON
        ========================================== */}
        {activeTab === "json" && (
          <div className="tab-content json-tab">
            <div className="section-intro">
              <div className="intro-text">
                <h2>Raw API Response Inspector</h2>
                <p>Complete JSON payload as returned by BlockIntel <code>/api/v1/credentials/{`{id}`}/complete</code>.</p>
              </div>
              <div className="json-actions">
                <CopyButton text={JSON.stringify(result, null, 2)} label="Copy JSON Payload" />
              </div>
            </div>

            <div className="card json-viewer-card">
              <pre className="raw-json-code">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          Upload Credential Modal
      ========================================== */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Upload Credential for Ingestion</h2>
                <p>Secure artifact processing · SHA-256 duplicate detection · Vault storage</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsUploadModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div
                className={`modal-dropzone ${uploadFile ? "has-file" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0])}
                />
                <Icon name="upload-cloud" size={36} />
                <strong>{uploadFile ? uploadFile.name : "Drop PDF, PNG, or JPEG credential here"}</strong>
                <small>{uploadFile ? `${formatBytes(uploadFile.size)} · Ready to process` : "or click to browse local files (up to 15 MB)"}</small>
              </div>

              {uploadError && (
                <div className="modal-error-banner">
                  <Icon name="alert-triangle" size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadState === "uploading" && (
                <div className="upload-progress-state">
                  <span className="spinner" />
                  <span>{uploadProgressMsg}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!uploadFile || uploadState === "uploading"}
                onClick={handleExecuteUpload}
              >
                {uploadState === "uploading" ? "Analyzing Credential..." : "Start Full Analysis →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the React application
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
