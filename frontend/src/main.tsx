import React, { useState, useEffect, useMemo, useRef, type ChangeEvent, type DragEvent } from "react";
import { createRoot } from "react-dom/client";
import type {
  IntelligenceResult,
  CredentialListItem,
  RiskLevel,
  IntegrityStatus,
  IntegrityVerificationResponse,
  UniversalVerificationResponse,
  Skill,
  AuthUser,
  AuthTokenResponse,
} from "./types";
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
    case "database":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...props}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
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
    case "lock":
      return (
        <svg {...props}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "unlock":
      return (
        <svg {...props}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "log-out":
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="m21 2-9.6 9.6" />
          <path d="m15.5 7.5 3 3" />
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
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Not recorded";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch {
    return dateStr;
  }
}

function labelize(text: string): string {
  if (!text) return "";
  return text.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ==========================================
// UI Gauges & Badges
// ==========================================
function RiskDial({ score, level }: { score: number; level: RiskLevel }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = (level || "low").toLowerCase();

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
        <span>HASH MISMATCH</span>
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
  const tone = (level || "LOW").toLowerCase();
  return (
    <span className={`risk-badge-tag ${tone}`}>
      <span className="badge-pulse-dot" />
      {level} RISK
    </span>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard fallback
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
// Main React Application
// ==========================================
export function App() {
  // Authentication & Authorization state
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem("blockintel_token") || "");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("blockintel_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>("admin@blockintel.com");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>("");

  const [credentialsList, setCredentialsList] = useState<CredentialListItem[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const token = localStorage.getItem("blockintel_token");
    return token ? "overview" : "check-document";
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>("");

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "complete" | "error">("idle");
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Universal Document & Tamper Verifier state (Public)
  const [universalFile, setUniversalFile] = useState<File | null>(null);
  const [universalResult, setUniversalResult] = useState<UniversalVerificationResponse | null>(null);
  const [isUniversalVerifying, setIsUniversalVerifying] = useState<boolean>(false);
  const [universalError, setUniversalError] = useState<string>("");
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState<boolean>(false);
  const universalInputRef = useRef<HTMLInputElement>(null);
  const checkDocInputRef = useRef<HTMLInputElement>(null);

  // Deletion modal & action state (Admin only)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>("");
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string>("");

  // Pre-upload document check inside Upload Modal
  const [uploadPreCheck, setUploadPreCheck] = useState<UniversalVerificationResponse | null>(null);
  const [isPreChecking, setIsPreChecking] = useState<boolean>(false);

  // Filters
  const [skillSearch, setSkillSearch] = useState<string>("");
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>("All");
  const [docSearch, setDocSearch] = useState<string>("");

  // Logout handler
  const handleLogout = (msg?: string) => {
    setAuthToken("");
    setCurrentUser(null);
    localStorage.removeItem("blockintel_token");
    localStorage.removeItem("blockintel_user");
    setCredentialsList([]);
    setSelectedCredentialId("");
    setResult(null);
    setActiveTab("check-document");
    if (msg) {
      setGeneralError(msg);
      setTimeout(() => setGeneralError(""), 5000);
    }
  };

  // Login handler
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authUsername || !authPassword) {
      setAuthError("Please enter both administrator username and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed. Invalid username or password.");
      }
      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      localStorage.setItem("blockintel_token", data.access_token);
      localStorage.setItem("blockintel_user", JSON.stringify(data.user));
      setIsAuthModalOpen(false);
      setAuthPassword("");
      setAuthSuccessMsg("Administrator session authenticated successfully.");
      setTimeout(() => setAuthSuccessMsg(""), 4000);

      // Load repository credentials
      fetchCredentials(data.access_token);
      setActiveTab("overview");
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in as Administrator.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick fill demo credentials
  const handleQuickFillDemo = () => {
    setAuthUsername("admin@blockintel.com");
    setAuthPassword("Admin@BlockIntel2026!");
    setAuthError("");
  };

  // Tab click gatekeeper
  const handleTabClick = (tabKey: string) => {
    if (tabKey === "check-document" || tabKey === "auth") {
      setActiveTab(tabKey);
      return;
    }
    // All repository exploration tabs require Administrator authentication
    if (!authToken) {
      setIsAuthModalOpen(true);
      setAuthError("Administrator authentication required to access repository records.");
      return;
    }
    setActiveTab(tabKey);
  };

  // Fetch credential list for Admin
  const fetchCredentials = async (overrideToken?: string) => {
    const token = overrideToken !== undefined ? overrideToken : authToken;
    if (!token) {
      setCredentialsList([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout("Session expired. Please sign in again.");
        return;
      }
      if (!res.ok) throw new Error("Could not fetch credentials list from API.");
      const data = await res.json();
      const items: CredentialListItem[] = data.items || [];
      setCredentialsList(items);

      // Auto-select first credential if none selected
      if (items.length > 0 && !selectedCredentialId) {
        const best = items.find((c) => c.status === "COMPLETED") || items[0];
        loadCredential(best.credential_id, token);
      }
    } catch (err: any) {
      setGeneralError("API backend notice: " + (err.message || "Connection error"));
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchCredentials();
    }
  }, [authToken]);

  // Load a specific credential (Admin Only)
  const loadCredential = async (credentialId: string, overrideToken?: string) => {
    const token = overrideToken !== undefined ? overrideToken : authToken;
    if (!token) {
      setIsAuthModalOpen(true);
      setAuthError("Administrator privileges required to inspect repository records.");
      return;
    }
    setIsLoading(true);
    setGeneralError("");
    setSelectedCredentialId(credentialId);
    setUniversalFile(null);
    setUniversalResult(null);
    setUniversalError("");

    try {
      const res = await fetch(`${API_BASE}/credentials/${credentialId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout("Admin authorization expired. Please sign in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || data.detail || `Failed to analyze credential ${credentialId}`);
      }

      // If metadata is null or missing on data, query /metadata endpoint as a reliable fallback
      if (!data.metadata) {
        try {
          const metaRes = await fetch(`${API_BASE}/credentials/${credentialId}/metadata`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            data.metadata = metaJson.metadata;
          }
        } catch {
          // ignore fallback
        }
      }

      setResult(data);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to load credential intelligence.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload a new credential file (Admin Only)
  const handleUploadFile = async () => {
    if (!uploadFile) return;
    if (!authToken) {
      setIsAuthModalOpen(true);
      setAuthError("Administrator sign-in required to ingest official documents.");
      return;
    }
    setUploadState("uploading");
    setUploadError("");

    try {
      setUploadProgressMsg("1/3: Ingesting artifact and calculating SHA-256 hash...");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const uploadRes = await fetch(`${API_BASE}/credentials/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      if (uploadRes.status === 401) {
        handleLogout("Admin session expired. Please sign in again.");
        return;
      }
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || uploadData.error || uploadData.detail || "Upload failed.");
      }

      const newId = uploadData.credential_id;
      setUploadProgressMsg("2/3: Extracting text, metadata, fonts, layout & risk assessment...");

      const completeRes = await fetch(`${API_BASE}/credentials/${newId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.message || completeData.error || completeData.detail || "Analysis failed.");
      }

      // If metadata is null, query /metadata endpoint
      if (!completeData.metadata) {
        try {
          const metaRes = await fetch(`${API_BASE}/credentials/${newId}/metadata`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            completeData.metadata = metaJson.metadata;
          }
        } catch {
          // ignore fallback
        }
      }

      setUploadProgressMsg("3/3: Intelligence profile ready!");
      setResult(completeData);
      setSelectedCredentialId(newId);
      setUploadState("complete");
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadPreCheck(null);
      setActiveTab("overview");

      // Refresh list
      fetchCredentials(authToken);
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload.");
      setUploadState("error");
    }
  };

  // Pre-upload document check when selecting a file in the Upload Modal (Public endpoint)
  const handleSelectUploadFile = async (file?: File) => {
    if (!file) return;
    setUploadFile(file);
    setUploadError("");
    setUploadPreCheck(null);
    setIsPreChecking(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/credentials/verify-document`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadPreCheck(data);
      }
    } catch {
      // ignore
    } finally {
      setIsPreChecking(false);
    }
  };

  // Universal document verification across ALL documents in database (Public endpoint)
  const handleRunUniversalVerify = async (file?: File) => {
    if (!file) return;
    setUniversalFile(file);
    setIsUniversalVerifying(true);
    setUniversalResult(null);
    setUniversalError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/credentials/verify-document`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to verify document.");
      }
      setUniversalResult(data);
    } catch (err: any) {
      setUniversalError(err.message || "Verification request failed.");
    } finally {
      setIsUniversalVerifying(false);
    }
  };

  // Delete credential and cascade child records (Admin Only)
  const handleDeleteCredential = async (targetId: string) => {
    if (!targetId) return;
    if (!authToken) {
      setIsAuthModalOpen(true);
      setAuthError("Administrator privileges required to delete records.");
      return;
    }
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`${API_BASE}/credentials/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        handleLogout("Admin session expired. Please sign in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || data.detail || "Failed to delete document.");
      }

      setIsDeleteModalOpen(false);
      setDeleteSuccessMsg(`Credential document '${targetId}' deleted successfully.`);
      setTimeout(() => setDeleteSuccessMsg(""), 4000);

      // Refresh list
      const listRes = await fetch(`${API_BASE}/credentials`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const listData = await listRes.json();
      const updatedItems: CredentialListItem[] = listData.items || [];
      setCredentialsList(updatedItems);

      // If deleted active credential, switch to next or empty
      if (selectedCredentialId === targetId) {
        if (updatedItems.length > 0) {
          loadCredential(updatedItems[0].credential_id, authToken);
        } else {
          setSelectedCredentialId("");
          setResult(null);
          setActiveTab("check-document");
        }
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Skill category list
  const skillCategories = useMemo(() => {
    if (!result?.skills) return ["All"];
    const cats = new Set<string>(["All"]);
    result.skills.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [result?.skills]);

  // Filtered skills
  const filteredSkills = useMemo(() => {
    if (!result?.skills) return [];
    return result.skills.filter((s) => {
      const matchesCat = selectedSkillCategory === "All" || s.category === selectedSkillCategory;
      const matchesSearch =
        !skillSearch ||
        s.canonical_skill.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.detected_term.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.evidence.text.toLowerCase().includes(skillSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [result?.skills, selectedSkillCategory, skillSearch]);

  const riskTone = (result?.authenticity_risk.risk_level || "low").toLowerCase();

  // Layout calculations
  const structuralInfo = result?.metadata?.structural_info;
  const firstDim = structuralInfo?.page_dimensions?.[0];
  const pageDim = {
    page: firstDim?.page ?? 1,
    width: firstDim?.width ? Math.round(firstDim.width) : 612,
    height: firstDim?.height ? Math.round(firstDim.height) : 792,
    orientation: firstDim?.orientation || (firstDim?.width && firstDim?.height && firstDim.width > firstDim.height ? "Landscape" : "Portrait"),
  };
  const totalBlocks = structuralInfo?.total_text_blocks ?? (result?.document_processing.text_available ? 1 : 0);
  const totalDrawings = structuralInfo?.total_drawings ?? 0;
  const totalImages = structuralInfo?.total_images ?? (structuralInfo?.embedded_images?.length ?? 0);
  const totalFonts = structuralInfo?.fonts?.length ?? 0;

  return (
    <div className="dashboard-root">
      {/* ==========================================
          Sidebar Navigation
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

        {/* Stored Credentials Selector (Admin Only) */}
        <div className="sidebar-credential-selector">
          {authToken ? (
            <>
              <div className="selector-title-row">
                <span className="selector-title">SELECT INGESTED CREDENTIAL</span>
                <span className="nav-tag green">Admin</span>
              </div>
              {credentialsList.length === 0 ? (
                <div className="no-credentials-text">No credentials in database</div>
              ) : (
                <select
                  className="credential-dropdown"
                  value={selectedCredentialId}
                  onChange={(e) => loadCredential(e.target.value)}
                  disabled={isLoading}
                >
                  {credentialsList.map((c) => (
                    <option key={c.credential_id} value={c.credential_id}>
                      {c.original_filename} ({c.credential_id.slice(-6)})
                    </option>
                  ))}
                </select>
              )}
              {result && (
                <button
                  className="btn-ghost-danger"
                  onClick={() => {
                    setDeleteError("");
                    setIsDeleteModalOpen(true);
                  }}
                  title="Delete this credential permanently"
                >
                  <Icon name="trash" size={13} />
                  <span>Delete Current Document</span>
                </button>
              )}
              <button className="btn btn-upload-sidebar" onClick={() => setIsUploadModalOpen(true)}>
                <Icon name="upload-cloud" size={14} />
                <span>Upload New Credential</span>
              </button>
            </>
          ) : (
            <div className="sidebar-auth-gate-card">
              <div className="auth-gate-pill">
                <Icon name="lock" size={12} />
                <span>DATABASE LOCKED</span>
              </div>
              <p className="auth-gate-msg">
                Direct repository browsing is restricted. Sign in as Admin to access stored files.
              </p>
              <button className="btn btn-primary btn-sm btn-full" onClick={() => setIsAuthModalOpen(true)}>
                <Icon name="lock" size={13} />
                <span>Admin Sign In</span>
              </button>
            </div>
          )}

          <button
            className={`btn btn-verify-sidebar ${activeTab === "check-document" ? "active" : ""}`}
            onClick={() => setActiveTab("check-document")}
          >
            <Icon name="shield-check" size={14} />
            <span>Check Document (Public)</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "check-document" ? "active" : ""}`}
            onClick={() => setActiveTab("check-document")}
          >
            <Icon name="shield-check" size={17} />
            <span>Check Document</span>
            <span className="nav-tag green">Public Verifier</span>
          </button>
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("overview")}
          >
            <Icon name={authToken ? "layers" : "lock"} size={17} />
            <span>Executive Overview</span>
            {!authToken && <span className="nav-tag lock-tag">Admin</span>}
          </button>
          <button
            className={`nav-item ${activeTab === "authenticity" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("authenticity")}
          >
            <Icon name={authToken ? "shield-alert" : "lock"} size={17} />
            <span>Authenticity Risk</span>
            {authToken && result ? (
              <span className={`nav-counter ${riskTone}`}>
                {result.authenticity_risk.signals.length}
              </span>
            ) : (
              !authToken && <span className="nav-tag lock-tag">Admin</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "integrity" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("integrity")}
          >
            <Icon name={authToken ? "database" : "lock"} size={17} />
            <span>Blockchain Integrity</span>
            {authToken && result ? (
              <span className={`nav-tag ${result.integrity.integrity_status === "MATCH" ? "green" : "red"}`}>
                {result.integrity.integrity_status}
              </span>
            ) : (
              !authToken && <span className="nav-tag lock-tag">Admin</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "document" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("document")}
          >
            <Icon name={authToken ? "file-text" : "lock"} size={17} />
            <span>Document & OCR</span>
            {!authToken && <span className="nav-tag lock-tag">Admin</span>}
          </button>
          <button
            className={`nav-item ${activeTab === "metadata" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("metadata")}
          >
            <Icon name={authToken ? "cpu" : "lock"} size={17} />
            <span>Metadata & Layout</span>
            {authToken && result?.metadata ? (
              <span className="nav-counter neutral">Active</span>
            ) : (
              !authToken && <span className="nav-tag lock-tag">Admin</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "skills" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("skills")}
          >
            <Icon name={authToken ? "award" : "lock"} size={17} />
            <span>Skill Intelligence</span>
            {authToken && result ? (
              <span className="nav-counter neutral">{result.skills.length}</span>
            ) : (
              !authToken && <span className="nav-tag lock-tag">Admin</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "json" ? "active" : ""} ${!authToken ? "locked" : ""}`}
            onClick={() => handleTabClick("json")}
          >
            <Icon name={authToken ? "code" : "lock"} size={17} />
            <span>Raw Response JSON</span>
            {!authToken && <span className="nav-tag lock-tag">Admin</span>}
          </button>
          <button
            className={`nav-item ${activeTab === "auth" ? "active" : ""}`}
            onClick={() => setActiveTab("auth")}
          >
            <Icon name={authToken ? "shield-check" : "user"} size={17} />
            <span>Admin & Access Control</span>
            <span className={`nav-tag ${authToken ? "green" : "blue"}`}>
              {authToken ? "Active" : "Sign In"}
            </span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="footer-card">
            <span className="phase-chip">{authToken ? "ADMIN CONSOLE" : "PUBLIC VERIFIER"}</span>
            <p>100% Cryptographic Tamper Verification · RBAC Protected Repository</p>
          </div>
        </div>
      </aside>

      {/* ==========================================
          Workspace Area
      ========================================== */}
      <div className="app-workspace">
        {/* Top Header */}
        <header className="workspace-header">
          <div className="header-left">
            <div className="breadcrumb">
              <span>Artifact Intelligence</span>
              {activeTab === "check-document" ? (
                <>
                  <span className="slash">/</span>
                  <strong>Universal Document Scanner</strong>
                </>
              ) : activeTab === "auth" ? (
                <>
                  <span className="slash">/</span>
                  <strong>Authentication & Authorization</strong>
                </>
              ) : result ? (
                <>
                  <span className="slash">/</span>
                  <strong>{result.credential.credential_id}</strong>
                </>
              ) : null}
            </div>
            <h1 className="header-title">
              {activeTab === "check-document"
                ? "Check Document Presence & Tamper Detection"
                : activeTab === "auth"
                ? "Administrator Authentication & Access Control"
                : result
                ? result.credential.original_filename
                : "Select or Upload a Credential"}
            </h1>
          </div>

          <div className="header-actions">
            {authToken ? (
              <div className="admin-status-pill">
                <span className="admin-avatar">
                  <Icon name="shield-check" size={13} />
                </span>
                <div className="admin-status-info">
                  <span className="admin-role-label">ADMIN</span>
                  <span className="admin-email-text">{currentUser?.username || "admin@blockintel.com"}</span>
                </div>
                <button
                  className="btn btn-ghost-sm"
                  onClick={() => handleLogout("Signed out of Administrator session.")}
                  title="Sign out of Administrator mode"
                >
                  <Icon name="log-out" size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="public-verifier-pill">
                <span className="public-dot" />
                <span>Public Verifier</span>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAuthModalOpen(true)}>
                  <Icon name="lock" size={13} />
                  <span>Admin Sign In</span>
                </button>
              </div>
            )}

            <button
              className={`btn ${activeTab === "check-document" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("check-document")}
            >
              <Icon name="shield-check" size={15} />
              <span>Check Document Scanner</span>
            </button>

            {authToken && (
              <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                <Icon name="upload-cloud" size={15} />
                <span>Upload Credential</span>
              </button>
            )}

            {authToken && result && activeTab !== "check-document" && activeTab !== "auth" && (
              <>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  <Icon name="download" size={15} />
                  <span>Export Audit</span>
                </button>
                <button
                  className="btn btn-danger-outline"
                  onClick={() => {
                    setDeleteError("");
                    setIsDeleteModalOpen(true);
                  }}
                  title="Delete this credential permanently"
                >
                  <Icon name="trash" size={14} />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Deletion Success Banner */}
        {deleteSuccessMsg && (
          <div className="status-badge-lg present" style={{ width: "100%", justifyContent: "flex-start", borderRadius: "8px", marginBottom: "16px" }}>
            <Icon name="check" size={16} />
            <span>{deleteSuccessMsg}</span>
          </div>
        )}

        {/* Global Loading / Error Notifications */}
        {isLoading && (
          <div className="loading-banner">
            <span className="spinner" />
            <span>Processing credential through BlockIntel analysis engine...</span>
          </div>
        )}

        {generalError && (
          <div className="error-banner">
            <Icon name="alert-triangle" size={18} />
            <div>
              <strong>Backend Notice</strong>
              <p>{generalError}</p>
            </div>
          </div>
        )}

        {/* Dedicated CHECK DOCUMENT (Universal Presence & Tamper Scanner) Tab */}
        {activeTab === "check-document" && (
          <div className="tab-content check-doc-workspace">
            {/* Hero Card */}
            <div className="check-doc-hero">
              <div className="check-doc-hero-content">
                <span className="check-doc-hero-eyebrow">Universal Integrity & Forensic Engine</span>
                <h2>Check Document Presence & Tampering</h2>
                <p>
                  Upload or drop any document (PDF, PNG, or JPEG). BlockIntel analyzes the file against all stored credentials in the system database to determine if it is registered, verifies its bit-for-bit cryptographic authenticity, and flags altered or tampered artifacts.
                </p>
              </div>
              <div className="check-doc-hero-pills">
                <span className="hero-pill">
                  <Icon name="database" size={13} />
                  <span>{authToken ? `${credentialsList.length} Stored Records Scanned` : "Protected Registry Scanned"}</span>
                </span>
                <span className="hero-pill">
                  <Icon name="shield-check" size={13} />
                  <span>SHA-256 Digest Verification</span>
                </span>
                <span className="hero-pill">
                  <Icon name="search" size={13} />
                  <span>Multi-Page & OCR Heuristics</span>
                </span>
              </div>
            </div>

            {/* Scanner Card */}
            <div className="check-doc-card">
              <div
                className={`check-doc-dropzone ${universalFile ? "has-file" : ""}`}
                onClick={() => checkDocInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files[0];
                  if (f) handleRunUniversalVerify(f);
                }}
              >
                <input
                  ref={checkDocInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) handleRunUniversalVerify(f);
                  }}
                />
                <div className="dropzone-icon-circle">
                  <Icon name={universalFile ? "file-text" : "upload-cloud"} size={28} />
                </div>
                <div>
                  <div className="dropzone-title">
                    {universalFile ? universalFile.name : "Drop any PDF, PNG, or JPEG document here to test"}
                  </div>
                  <div className="dropzone-subtitle">
                    {universalFile
                      ? `${formatBytes(universalFile.size)} · Click or drop a new file to scan another document`
                      : "or click anywhere to browse from your device (up to 15 MB)"}
                  </div>
                </div>

                {universalFile && (
                  <div className="check-doc-fileinfo" onClick={(e) => e.stopPropagation()}>
                    <div className="check-doc-fileinfo-left">
                      <Icon name="file-text" size={16} />
                      <div>
                        <div className="check-doc-fileinfo-name">{universalFile.name}</div>
                        <div className="check-doc-fileinfo-size">
                          {formatBytes(universalFile.size)} · Ready for Cross-Repository Analysis
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={isUniversalVerifying}
                      onClick={() => handleRunUniversalVerify(universalFile)}
                    >
                      {isUniversalVerifying ? (
                        <>
                          <span className="spinner" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="shield-check" size={13} />
                          <span>Re-Scan Document</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* In-Progress Scanning Notice */}
              {isUniversalVerifying && (
                <div className="verifier-calculating">
                  <span className="spinner" />
                  <span>
                    {authToken
                      ? `Computing exact SHA-256 digest & cross-matching across all ${credentialsList.length} database credentials...`
                      : "Computing exact SHA-256 digest & cross-matching against database registry..."}
                  </span>
                </div>
              )}

              {/* Error Notice */}
              {universalError && (
                <div className="modal-error-banner">
                  <Icon name="alert-triangle" size={16} />
                  <span>{universalError}</span>
                </div>
              )}

              {/* Verification Result Card */}
              {universalResult && !isUniversalVerifying && (
                <div className={`universal-result-card ${universalResult.verdict.toLowerCase()}`}>
                  <div className="result-header-row">
                    <div className="verdict-badges-wrap">
                      <span className={`status-badge-lg ${universalResult.is_present ? "present" : "not-present"}`}>
                        {universalResult.is_present ? "● PRESENT IN SYSTEM DATABASE" : "○ NOT PRESENT IN DATABASE"}
                      </span>
                      <span className={`status-badge-lg ${universalResult.verdict.toLowerCase()}`}>
                        {universalResult.verdict === "ORIGINAL"
                          ? "✓ 100% ORIGINAL & UNTAMPERED"
                          : universalResult.verdict === "TAMPERED"
                          ? "⚠ TAMPERED ARTIFACT DETECTED"
                          : "? UNREGISTERED NEW ARTIFACT"}
                      </span>
                      <span className="hero-pill" style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}>
                        Method: {labelize(universalResult.match_reason)} ({Math.round(universalResult.match_confidence * 100)}% Confidence)
                      </span>
                    </div>

                    {universalResult.matched_credential_id && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (!authToken) {
                            setIsAuthModalOpen(true);
                            setAuthError("Administrator privileges required to inspect repository dossiers.");
                            return;
                          }
                          loadCredential(universalResult.matched_credential_id!);
                          setActiveTab("overview");
                        }}
                      >
                        <Icon name={authToken ? "external-link" : "lock"} size={13} />
                        <span>{authToken ? "Open Document Intelligence Dossier" : "Admin Sign In to Open Dossier"}</span>
                      </button>
                    )}
                  </div>

                  <div className="result-details-box">
                    <p className="result-explanation">{universalResult.details}</p>
                  </div>

                  {universalResult.diff_indicators && universalResult.diff_indicators.length > 0 && (
                    <div className="diff-indicators-section">
                      <span className="diff-title">Detected Alterations & Forensic Signals:</span>
                      <ul className="diff-list">
                        {universalResult.diff_indicators.map((diff, idx) => (
                          <li key={idx}>
                            <Icon name="alert-triangle" size={14} />
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="forensic-table-wrap">
                    <table className="forensic-table">
                      <tbody>
                        <tr>
                          <th>Submitted File Name</th>
                          <td><strong className="font-mono">{universalResult.submitted_filename}</strong></td>
                        </tr>
                        {universalResult.matched_filename && (
                          <tr>
                            <th>Matched Database Record</th>
                            <td>
                              <strong>{universalResult.matched_filename}</strong>{" "}
                              <code className="cred-chip">{universalResult.matched_credential_id}</code>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <th>Submitted Cryptographic Hash</th>
                          <td className="forensic-hash">{universalResult.submitted_hash}</td>
                        </tr>
                        {universalResult.registered_hash && (
                          <tr>
                            <th>Registered Target Hash</th>
                            <td className="forensic-hash">{universalResult.registered_hash}</td>
                          </tr>
                        )}
                        <tr>
                          <th>Integrity Status</th>
                          <td>
                            {universalResult.verdict === "ORIGINAL" ? (
                              <span className="match-pill-indicator match">
                                <Icon name="check" size={12} />
                                <span>EXACT BIT-FOR-BIT MATCH (Identical SHA-256)</span>
                              </span>
                            ) : universalResult.verdict === "TAMPERED" ? (
                              <span className="match-pill-indicator mismatch">
                                <Icon name="shield-x" size={12} />
                                <span>FAILED (Content or File Bytes Altered)</span>
                              </span>
                            ) : (
                              <span className="match-pill-indicator" style={{ background: "#f1f5f9", color: "#475569" }}>
                                <span>No Matching Record Registered</span>
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Blockchain Ledger Status</th>
                          <td>
                            {universalResult.blockchain_registered ? (
                              <span>
                                Registered on chain (Network: <strong>{universalResult.network_id || "local"}</strong>, Block #{universalResult.block_number}, Tx: <code className="cred-chip">{universalResult.transaction_hash?.slice(0, 16)}...</code>)
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>
                                Stored in Local Secure Vault (Development Ledger Mode)
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Verification Timestamp</th>
                          <td>{formatDate(universalResult.verified_at)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="check-doc-actions">
                    {universalResult.matched_credential_id && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (!authToken) {
                            setIsAuthModalOpen(true);
                            setAuthError("Administrator privileges required to inspect repository dossiers.");
                            return;
                          }
                          loadCredential(universalResult.matched_credential_id!);
                          setActiveTab("overview");
                        }}
                      >
                        <Icon name={authToken ? "layers" : "lock"} size={14} />
                        <span>{authToken ? "Inspect Matched Credential Dossier" : "Admin Sign In to Inspect Dossier"}</span>
                      </button>
                    )}
                    {(!universalResult.is_present || universalResult.verdict === "TAMPERED") && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          if (!authToken) {
                            setIsAuthModalOpen(true);
                            setAuthError("Administrator privileges required to ingest credentials into the database.");
                            return;
                          }
                          setUploadFile(universalFile);
                          setIsUploadModalOpen(true);
                        }}
                      >
                        <Icon name={authToken ? "upload-cloud" : "lock"} size={14} />
                        <span>
                          {universalResult.verdict === "TAMPERED"
                            ? "Ingest Tampered Copy as Separate Record"
                            : "Ingest & Register this Original Credential"}
                        </span>
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setUniversalFile(null);
                        setUniversalResult(null);
                        setUniversalError("");
                        if (checkDocInputRef.current) checkDocInputRef.current.value = "";
                      }}
                    >
                      <span>Check Another Document</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State when no credential exists or is loaded and not on check-document */}
        {!result && !isLoading && activeTab !== "check-document" && (
          <div className="empty-workspace-card">
            <Icon name="upload-cloud" size={48} className="text-muted" />
            <h2>No Credential Loaded</h2>
            <p>Upload a credential artifact (PDF, PNG, or JPEG) to generate a complete Phase 1 intelligence report.</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                <span>Upload Credential</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab("check-document")}>
                <Icon name="shield-check" size={14} />
                <span>Check a Document</span>
              </button>
            </div>
          </div>
        )}

        {/* Result Tabs */}
        {result && !isLoading && activeTab !== "check-document" && (
          <>
            {/* ==========================================
                TAB: EXECUTIVE OVERVIEW
            ========================================== */}
            {activeTab === "overview" && (
              <div className="tab-content overview-tab">
                <div className="executive-grid">
                  {/* Risk Card */}
                  <div className={`metric-card highlight-card ${riskTone}`}>
                    <div className="card-top">
                      <div>
                        <span className="card-eyebrow">Authenticity Review</span>
                        <h3>{result.authenticity_risk.risk_level} RISK</h3>
                      </div>
                      <RiskBadge level={result.authenticity_risk.risk_level} />
                    </div>
                    <div className="card-center">
                      <RiskDial score={result.authenticity_risk.risk_score} level={result.authenticity_risk.risk_level} />
                      <div className="risk-lead-text">
                        <p>{result.authenticity_risk.explanations[0] || "No review signals triggered."}</p>
                        <small className="disclaimer-mini">Signals guide audit. Never proof of forgery.</small>
                      </div>
                    </div>
                  </div>

                  {/* Integrity Card */}
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
                        <strong className={result.integrity.blockchain_registered ? "text-success" : "text-muted"}>
                          {result.integrity.blockchain_registered ? "Registered On-Chain" : "Not Registered"}
                        </strong>
                      </div>
                      <div className="hash-display-compact">
                        <code>
                          {result.integrity.hash.slice(0, 14)}...{result.integrity.hash.slice(-10)}
                        </code>
                        <CopyButton text={result.integrity.hash} label="Copy" />
                      </div>
                    </div>
                  </div>

                  {/* Document Processing Card */}
                  <div className="metric-card">
                    <div className="card-top">
                      <div>
                        <span className="card-eyebrow">Layout & Geometry</span>
                        <h3>Document Layout</h3>
                      </div>
                      <span className="pill-neutral">{labelize(result.document_processing.extraction_method)}</span>
                    </div>
                    <div className="card-body">
                      <div className="integrity-detail-line">
                        <span className="text-muted">Dimensions</span>
                        <strong>
                          {pageDim.width} × {pageDim.height} pt ({pageDim.orientation || "Portrait"})
                        </strong>
                      </div>
                      <div className="integrity-detail-line">
                        <span className="text-muted">Text Blocks</span>
                        <strong>{totalBlocks} blocks</strong>
                      </div>
                      <div className="integrity-detail-line">
                        <span className="text-muted">Media / Images</span>
                        <strong>{totalImages} embedded</strong>
                      </div>
                    </div>
                  </div>

                  {/* Skills Card */}
                  <div className="metric-card">
                    <div className="card-top">
                      <div>
                        <span className="card-eyebrow">Grounded Skills</span>
                        <h3>Competencies</h3>
                      </div>
                      <span className="pill-neutral">{result.skills.length} Found</span>
                    </div>
                    <div className="card-body">
                      {result.skills.length === 0 ? (
                        <span className="text-muted" style={{ fontSize: "12px" }}>
                          No catalog skills detected in text.
                        </span>
                      ) : (
                        <div className="skills-mini-list">
                          {result.skills.slice(0, 4).map((sk) => (
                            <span key={sk.canonical_skill} className="mini-skill-chip">
                              {sk.canonical_skill} <b>{sk.competency_score}%</b>
                            </span>
                          ))}
                          {result.skills.length > 4 && (
                            <span className="mini-skill-more">+{result.skills.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evidence & Signals Panels */}
                <div className="panels-row">
                  <div className="panel-card flex-2">
                    <div className="panel-header">
                      <div>
                        <span className="panel-eyebrow">Extracted Text</span>
                        <h3>Document Evidence Excerpt</h3>
                      </div>
                      <button className="btn btn-ghost" onClick={() => setActiveTab("document")}>
                        <span>View Full Text</span>
                        <Icon name="external-link" size={14} />
                      </button>
                    </div>
                    <div className="panel-body">
                      <blockquote className="preview-blockquote">
                        "{result.document_processing.extracted_text_preview || "No text available."}"
                      </blockquote>
                      <div className="quick-specs-grid">
                        <div className="spec-item">
                          <span className="spec-label">File Type</span>
                          <strong className="spec-val">{result.credential.file_type}</strong>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Size</span>
                          <strong className="spec-val">{formatBytes(result.credential.file_size_bytes)}</strong>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Ingested</span>
                          <strong className="spec-val">{formatDate(result.credential.created_at)}</strong>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Producer</span>
                          <strong className="spec-val">{result.metadata?.producer || "Standard"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel-card flex-1">
                    <div className="panel-header">
                      <div>
                        <span className="panel-eyebrow">Audit Signals</span>
                        <h3>Authenticity Factors</h3>
                      </div>
                      <span className={`signal-counter ${riskTone}`}>
                        {result.authenticity_risk.signals.length} Signals
                      </span>
                    </div>
                    <div className="panel-body">
                      {result.authenticity_risk.signals.length === 0 ? (
                        <div className="empty-notice green">
                          <Icon name="check" size={16} />
                          <span>No suspicious signals detected. Document passes standard checks.</span>
                        </div>
                      ) : (
                        <div className="signals-preview-list">
                          {result.authenticity_risk.signals.slice(0, 3).map((sig, i) => (
                            <div key={i} className={`mini-signal-item ${(sig.severity || "low").toLowerCase()}`}>
                              <span className={`severity-tag ${(sig.severity || "low").toLowerCase()}`}>
                                {sig.severity}
                              </span>
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
                      Explainable multi-signal assessment evaluating font entropy, producer provenance,
                      timestamp skew, and binary structural layout.
                    </p>
                  </div>
                  <RiskBadge level={result.authenticity_risk.risk_level} />
                </div>

                <div className="risk-banner-card">
                  <div className="banner-dial">
                    <RiskDial score={result.authenticity_risk.risk_score} level={result.authenticity_risk.risk_level} />
                  </div>
                  <div className="banner-content">
                    <h3>Calculated Score: {result.authenticity_risk.risk_score}/100</h3>
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
                    <span className="text-muted">Thresholds: LOW (0–24), MEDIUM (25–69), HIGH (70–100)</span>
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
                        <div key={idx} className={`signal-card ${(sig.severity || "low").toLowerCase()}`}>
                          <div className="signal-card-header">
                            <span className={`severity-tag ${(sig.severity || "low").toLowerCase()}`}>
                              {sig.severity} SEVERITY
                            </span>
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
                      Authenticity risk signals highlight document anomalies for human review only. They do NOT prove
                      forgery or confirm issuer authenticity. Separate issuer verification is required.
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
                      SHA-256 digest registered on an Ethereum-compatible minimal smart contract ledger.
                    </p>
                  </div>
                  <IntegrityPill status={result.integrity.integrity_status} />
                </div>

                <div className="integrity-cards-grid">
                  {/* Immutable Hash Card */}
                  <div className="card hash-proof-card">
                    <div className="card-top-title">
                      <Icon name="database" size={18} />
                      <h3>Original Artifact Hash</h3>
                    </div>
                    <p className="card-sub-info">Exact SHA-256 fingerprint generated from unaltered bytes at ingestion.</p>
                    <div className="hash-box-large">
                      <div className="hash-header">
                        <span>ALGORITHM: {result.integrity.algorithm}</span>
                        <CopyButton text={result.integrity.hash} label="Copy Hash" />
                      </div>
                      <code>{result.integrity.hash}</code>
                    </div>
                    <div className="hash-attributes">
                      <div>
                        <span className="attr-name">File Name:</span>
                        <span className="attr-val">{result.credential.original_filename}</span>
                      </div>
                      <div>
                        <span className="attr-name">File Size:</span>
                        <span className="attr-val">{formatBytes(result.credential.file_size_bytes)}</span>
                      </div>
                      <div>
                        <span className="attr-name">Integrity Status:</span>
                        <strong className={result.integrity.integrity_status === "MATCH" ? "text-success" : "text-danger"}>
                          {result.integrity.integrity_status}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Ledger Card */}
                  <div className="card blockchain-receipt-card">
                    <div className="card-top-title">
                      <Icon name="layers" size={18} />
                      <h3>Blockchain Registry Record</h3>
                    </div>
                    <p className="card-sub-info">Immutable record registered in CredentialRegistry contract.</p>

                    <div className="ledger-details-table">
                      <div className="ledger-row">
                        <span className="col-label">Contract Address</span>
                        <div className="col-val">
                          <code>{result.blockchain_registration?.contract_address || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}</code>
                          <CopyButton text={result.blockchain_registration?.contract_address || "0x5FbDB2315678afecb367f032d93F642f64180aa3"} />
                        </div>
                      </div>
                      <div className="ledger-row">
                        <span className="col-label">Transaction Hash</span>
                        <div className="col-val">
                          <code>{result.blockchain_registration?.transaction_hash || "Registered in development ledger"}</code>
                          {result.blockchain_registration?.transaction_hash && (
                            <CopyButton text={result.blockchain_registration.transaction_hash} />
                          )}
                        </div>
                      </div>
                      <div className="ledger-row">
                        <span className="col-label">Block Number</span>
                        <span className="col-val font-mono">
                          {result.blockchain_registration?.block_number ? `#${result.blockchain_registration.block_number}` : "Ledger Block #1"}
                        </span>
                      </div>
                      <div className="ledger-row">
                        <span className="col-label">Network ID</span>
                        <span className="col-val font-mono">
                          {result.blockchain_registration?.network_id || "31337 (Local Dev Ledger)"}
                        </span>
                      </div>
                      <div className="ledger-row">
                        <span className="col-label">Registered At</span>
                        <span className="col-val">
                          {formatDate(result.blockchain_registration?.registered_at || result.credential.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Live File Verification Tool */}
                {/* Real Live Universal Document Verification Tool */}
                <div className="card verifier-card">
                  <div className="card-top-title">
                    <Icon name="shield-check" size={18} />
                    <h3>Universal Database Verification & Tamper Scanner</h3>
                  </div>
                  <p className="card-sub-info">
                    Upload or drag-and-drop any document to send it to <code>POST /api/v1/credentials/verify-document</code>.
                    The backend cross-checks the submitted file across <strong>ALL</strong> documents in the BlockIntel database and blockchain ledger to determine whether it is <strong>present or not</strong>, and whether it is an unaltered <strong>original or tampered</strong>.
                  </p>

                  <div
                    className="verifier-dropzone"
                    onClick={() => universalInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e: DragEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      handleRunUniversalVerify(e.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      ref={universalInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display: "none" }}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleRunUniversalVerify(e.target.files?.[0])}
                    />
                    <Icon name="upload-cloud" size={32} />
                    <strong>
                      {universalFile ? universalFile.name : "Select or drag-and-drop any document to test presence & tampering"}
                    </strong>
                    <small>
                      {universalFile ? `${formatBytes(universalFile.size)} · Click to test another file` : "Scans entire database of registered credentials (PDF, PNG, JPEG)"}
                    </small>
                  </div>

                  {isUniversalVerifying && (
                    <div className="verifier-calculating">
                      <span className="spinner" />
                      <span>Scanning across all database documents and cryptographic registry...</span>
                    </div>
                  )}

                  {universalError && (
                    <div className="verifier-feedback-box mismatch">
                      <div className="feedback-head">
                        <Icon name="alert-triangle" size={20} />
                        <h4>Verification Error</h4>
                      </div>
                      <p className="feedback-msg">{universalError}</p>
                    </div>
                  )}

                  {universalResult && !isUniversalVerifying && (
                    <div className={`universal-result-card ${universalResult.verdict.toLowerCase()}`}>
                      <div className="result-header-row">
                        <div className="verdict-badges-wrap">
                          <span className={`presence-pill ${universalResult.is_present ? "present" : "not-present"}`}>
                            {universalResult.is_present ? "● PRESENT IN SYSTEM DATABASE" : "○ NOT PRESENT IN DATABASE"}
                          </span>
                          <span className={`verdict-pill ${universalResult.verdict.toLowerCase()}`}>
                            {universalResult.verdict === "ORIGINAL"
                              ? "✓ 100% AUTHENTIC ORIGINAL"
                              : universalResult.verdict === "TAMPERED"
                              ? "⚠ TAMPERED ARTIFACT DETECTED"
                              : "UNREGISTERED ARTIFACT"}
                          </span>
                        </div>
                        {universalResult.matched_credential_id && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => loadCredential(universalResult.matched_credential_id!)}
                          >
                            <span>Open Credential Report</span>
                            <Icon name="external-link" size={13} />
                          </button>
                        )}
                      </div>

                      <div className="result-details-box">
                        <p className="result-explanation">{universalResult.details}</p>
                      </div>

                      {universalResult.diff_indicators && universalResult.diff_indicators.length > 0 && (
                        <div className="diff-indicators-section">
                          <span className="diff-title">Detected Discrepancies & Audit Signals:</span>
                          <ul className="diff-list">
                            {universalResult.diff_indicators.map((diff, idx) => (
                              <li key={idx}>
                                <Icon name="alert-triangle" size={13} />
                                <span>{diff}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="comparison-table-mini">
                        <div className="comp-row">
                          <span className="comp-label">Submitted Filename:</span>
                          <span className="comp-val font-mono">{universalResult.submitted_filename}</span>
                        </div>
                        {universalResult.matched_filename && (
                          <div className="comp-row">
                            <span className="comp-label">Matched Database Record:</span>
                            <span className="comp-val">
                              <strong>{universalResult.matched_filename}</strong>{" "}
                              <code className="cred-chip">{universalResult.matched_credential_id}</code>
                            </span>
                          </div>
                        )}
                        <div className="comp-row">
                          <span className="comp-label">Submitted SHA-256:</span>
                          <span className="comp-val font-mono hash-val">{universalResult.submitted_hash}</span>
                        </div>
                        {universalResult.registered_hash && (
                          <div className="comp-row">
                            <span className="comp-label">Registered Target SHA-256:</span>
                            <span className="comp-val font-mono hash-val">{universalResult.registered_hash}</span>
                          </div>
                        )}
                        <div className="comp-row">
                          <span className="comp-label">Detection Method:</span>
                          <span className="comp-val">{labelize(universalResult.match_reason)} (Confidence: {Math.round(universalResult.match_confidence * 100)}%)</span>
                        </div>
                        {universalResult.blockchain_registered && (
                          <div className="comp-row">
                            <span className="comp-label">Blockchain Ledger Status:</span>
                            <span className="comp-val text-success">
                              ✓ Registered On-Chain (Contract: {universalResult.contract_address?.slice(0, 10)}...)
                            </span>
                          </div>
                        )}
                      </div>
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
                    <h2>Document Processing & Visual Inspection</h2>
                    <p>
                      Interactive visual preview alongside native PDF text extraction stream and Tesseract OCR inspection.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveTab("check-document")}
                      title="Run universal presence and tamper scanner"
                    >
                      <Icon name="shield-check" size={14} />
                      <span>Tamper Scanner</span>
                    </button>
                    <span className="pill-neutral">METHOD: {labelize(result.document_processing.extraction_method)}</span>
                  </div>
                </div>

                <div className="doc-stats-grid">
                  <div className="stat-card">
                    <span className="stat-num">{result.document_processing.total_pages}</span>
                    <span className="stat-title">Total Pages</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">
                      {result.document_processing.average_ocr_confidence !== null && result.document_processing.average_ocr_confidence !== undefined
                        ? `${Math.round(result.document_processing.average_ocr_confidence * 100)}%`
                        : "100%"}
                    </span>
                    <span className="stat-title">OCR Confidence</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{result.document_processing.text_available ? "YES" : "NO"}</span>
                    <span className="stat-title">Text Available</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{totalBlocks}</span>
                    <span className="stat-title">Text Blocks</span>
                  </div>
                </div>

                {/* Split Visual Document Viewer + Extracted Text */}
                <div className="doc-split-layout">
                  {/* Left: Visual Document Artifact Preview */}
                  <div className="doc-preview-card">
                    <div className="doc-preview-header">
                      <div className="doc-preview-header-left">
                        <Icon name="file-text" size={15} />
                        <span className="doc-preview-title" title={result.credential.original_filename}>
                          {result.credential.original_filename}
                        </span>
                        <span className="file-type-pill">{result.credential.file_type}</span>
                      </div>
                      <div className="doc-preview-header-right">
                        <a
                          href={`${API_BASE}/credentials/${result.credential.credential_id}/file${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
                          title="Open artifact in new browser tab"
                        >
                          <Icon name="external-link" size={13} />
                          <span>Popout</span>
                        </a>
                        <a
                          href={`${API_BASE}/credentials/${result.credential.credential_id}/file${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`}
                          download={result.credential.original_filename}
                          className="btn btn-sm btn-secondary"
                          title="Download original artifact"
                        >
                          <Icon name="download" size={13} />
                        </a>
                      </div>
                    </div>

                    <div className="doc-preview-body">
                      {result.credential.file_type === "PDF" || result.credential.mime_type?.toLowerCase().includes("pdf") ? (
                        <iframe
                          src={`${API_BASE}/credentials/${result.credential.credential_id}/file${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}#toolbar=1&navpanes=0`}
                          className="doc-preview-frame"
                          title={`Preview: ${result.credential.original_filename}`}
                        />
                      ) : (
                        <div className="doc-preview-img-wrap">
                          <img
                            src={`${API_BASE}/credentials/${result.credential.credential_id}/file${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`}
                            alt={result.credential.original_filename}
                            className="doc-preview-img"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Extracted Text Content / OCR Stream */}
                  <div className="doc-text-card">
                    <div className="viewer-header">
                      <div>
                        <h3>Extracted Text Content</h3>
                        <small>
                          {result.document_processing.text_available
                            ? `Pipeline: ${labelize(result.document_processing.extraction_method)}`
                            : "Raster scan - no embedded text stream"}
                        </small>
                      </div>
                      {result.document_processing.text_available && (
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
                      )}
                    </div>

                    <div className="text-viewer-body">
                      {(result.document_processing.full_text || result.document_processing.extracted_text_preview) ? (
                        <pre className="text-content">
                          {docSearch
                            ? (result.document_processing.full_text || result.document_processing.extracted_text_preview || "")
                                .split("\n")
                                .filter((line) => line.toLowerCase().includes(docSearch.toLowerCase()))
                                .join("\n") || "No matching lines found for query."
                            : (result.document_processing.full_text || result.document_processing.extracted_text_preview)}
                        </pre>
                      ) : (
                        <div className="doc-no-text-panel">
                          <Icon name="layers" size={36} className="text-muted" />
                          <h4>Raster Image Credential</h4>
                          <p>
                            This credential was ingested as an image or certificate without machine-readable font glyphs.
                            Visual inspection is rendered live in the preview pane on the left.
                          </p>
                          <div className="doc-no-text-meta">
                            <span className="doc-no-text-badge">File Format: {result.credential.file_type}</span>
                            <span className="doc-no-text-badge">Size: {formatBytes(result.credential.file_size_bytes)}</span>
                            <span className="doc-no-text-badge">SHA-256: {result.credential.sha256_hash.slice(0, 12)}...</span>
                          </div>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ marginTop: "14px" }}
                            onClick={() => setActiveTab("check-document")}
                          >
                            <Icon name="shield-check" size={14} />
                            <span>Run Tamper Test on this File →</span>
                          </button>
                        </div>
                      )}
                    </div>
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
                    <h2>Document Metadata & Structural Layout</h2>
                    <p>
                      Forensic inspection of author headers, generator toolchain, embedded typography, and visual layout geometry.
                    </p>
                  </div>
                </div>

                {/* Key Structural Stats Cards */}
                <div className="doc-stats-grid">
                  <div className="stat-card">
                    <span className="stat-num">{structuralInfo?.page_count || result.document_processing.total_pages || 1}</span>
                    <span className="stat-title">Page Count</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{totalBlocks}</span>
                    <span className="stat-title">Text Blocks</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{totalDrawings}</span>
                    <span className="stat-title">Vector Drawings</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-num">{totalImages}</span>
                    <span className="stat-title">Embedded Images</span>
                  </div>
                </div>

                {/* Layout Canvas Representation */}
                <div className="card layout-geometry-card">
                  <div className="card-top-title">
                    <Icon name="layers" size={18} />
                    <h3>Document Geometry & Canvas Layout</h3>
                  </div>
                  <p className="card-sub-info">Physical page bounds and orientation extracted from document dictionary.</p>

                  <div className="canvas-preview-wrapper">
                    <div
                      className="canvas-page-box"
                      style={{
                        aspectRatio: `${pageDim.width} / ${pageDim.height}`,
                      }}
                    >
                      <div className="canvas-header-indicator">
                        <span>PAGE 1</span>
                        <small>{pageDim.orientation || "Portrait"}</small>
                      </div>
                      <div className="canvas-inner-blocks">
                        <div className="canvas-mock-block header-block" />
                        <div className="canvas-mock-block body-block" />
                        <div className="canvas-mock-block body-block-2" />
                        {totalImages > 0 && <div className="canvas-mock-img-block" />}
                      </div>
                      <div className="canvas-footer-indicator">
                        <span>{pageDim.width} pt × {pageDim.height} pt</span>
                      </div>
                    </div>

                    <div className="canvas-specs-list">
                      <div className="spec-row">
                        <span className="spec-title">Width</span>
                        <span className="spec-value"><strong>{pageDim.width} pt</strong> ({Math.round(pageDim.width / 72 * 25.4)} mm)</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-title">Height</span>
                        <span className="spec-value"><strong>{pageDim.height} pt</strong> ({Math.round(pageDim.height / 72 * 25.4)} mm)</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-title">Orientation</span>
                        <span className="spec-value">
                          <span className="badge-dim">{pageDim.orientation || "Portrait"}</span>
                        </span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-title">Standard Format</span>
                        <span className="spec-value">
                          {Math.abs(pageDim.width - 612) < 20 && Math.abs(pageDim.height - 792) < 20
                            ? "US Letter (8.5 × 11 in)"
                            : Math.abs(pageDim.width - 595) < 20 && Math.abs(pageDim.height - 842) < 20
                            ? "ISO A4 (210 × 297 mm)"
                            : `${result.credential.file_type} Standard`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata Attributes Table */}
                <div className="card metadata-card">
                  <div className="card-top-title">
                    <Icon name="cpu" size={18} />
                    <h3>Document Provenance Properties</h3>
                  </div>
                  <div className="meta-table">
                    <div className="meta-row">
                      <span className="meta-key">Author</span>
                      <span className="meta-val">{result.metadata?.author || "None specified in document header"}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-key">PDF Producer</span>
                      <span className="meta-val font-mono">{result.metadata?.producer || "None specified"}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-key">Creator Tool</span>
                      <span className="meta-val">{result.metadata?.creator || "None specified"}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-key">Creation Date</span>
                      <span className="meta-val">{formatDate(result.metadata?.creation_date)}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-key">Modification Date</span>
                      <span className="meta-val">{formatDate(result.metadata?.modification_date)}</span>
                    </div>
                    {result.metadata?.raw_metadata?.format && (
                      <div className="meta-row">
                        <span className="meta-key">Format / Version</span>
                        <span className="meta-val font-mono">{String(result.metadata.raw_metadata.format)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detected Headings */}
                <div className="card headings-card">
                  <div className="card-top-title">
                    <Icon name="file-text" size={18} />
                    <h3>Detected Structural Headings & Titles ({structuralInfo?.headings?.length ?? 0})</h3>
                  </div>
                  <p className="card-sub-info">Prominent headings detected through font size and weight heuristics.</p>

                  {(structuralInfo?.headings?.length ?? 0) === 0 ? (
                    <div className="empty-notice">
                      <span>No prominent structural headings detected in document text.</span>
                    </div>
                  ) : (
                    <div className="headings-list">
                      {structuralInfo?.headings?.map((h, idx) => (
                        <div key={idx} className="heading-item">
                          <span className="heading-size">{h.size} pt</span>
                          {h.font && <span className="badge-dim">{h.font}</span>}
                          <span className="heading-text">"{h.text}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fonts Catalog */}
                <div className="card fonts-card">
                  <div className="card-top-title">
                    <Icon name="code" size={18} />
                    <h3>Embedded Font Families ({totalFonts})</h3>
                  </div>
                  <p className="card-sub-info">Fonts detected in the document dictionary.</p>

                  {totalFonts === 0 ? (
                    <div className="empty-notice">
                      <span>No vector fonts detected (raster scan or image artifact).</span>
                    </div>
                  ) : (
                    <div className="fonts-table">
                      <div className="fonts-head">
                        <span>Font Name</span>
                        <span>Type</span>
                        <span>Page</span>
                        <span>Detected Sizes</span>
                      </div>
                      {structuralInfo?.fonts?.map((f, i) => (
                        <div key={i} className="fonts-row">
                          <strong className="font-mono">{f.name}</strong>
                          <span className="badge-dim">{f.type || "Type1"}</span>
                          <span>Page {f.page || 1}</span>
                          <span>{f.sizes && f.sizes.length > 0 ? f.sizes.map((s) => `${s}pt`).join(", ") : "Standard"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Embedded Images */}
                <div className="card images-card">
                  <div className="card-top-title">
                    <Icon name="layers" size={18} />
                    <h3>Embedded Image Objects ({structuralInfo?.embedded_images?.length ?? 0})</h3>
                  </div>
                  <p className="card-sub-info">Raster graphics, stamps, and photos embedded in the artifact.</p>

                  {(structuralInfo?.embedded_images?.length ?? 0) === 0 ? (
                    <div className="empty-notice"><span>No embedded images detected.</span></div>
                  ) : (
                    <div className="table-mini">
                      {structuralInfo?.embedded_images?.map((img, idx) => (
                        <div key={idx} className="mini-img-row">
                          <span className="img-res"><strong>{img.width} × {img.height} px</strong></span>
                          <span className="badge-dim">.{String(img.extension || "img").toUpperCase()}</span>
                          <span className="img-cs">{img.colorspace}</span>
                          <span className="img-xref">xref #{img.xref} (Page {img.page || 1})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Raw Metadata Tags */}
                {result.metadata?.raw_metadata && Object.keys(result.metadata.raw_metadata).length > 0 && (
                  <div className="card raw-meta-card">
                    <div className="card-top-title">
                      <Icon name="database" size={18} />
                      <h3>All Extracted Raw Metadata Headers</h3>
                    </div>
                    <div className="meta-table">
                      {Object.entries(result.metadata.raw_metadata).map(([key, val]) => {
                        if (val === null || val === "" || typeof val === "object") return null;
                        return (
                          <div key={key} className="meta-row">
                            <span className="meta-key">{labelize(key)}</span>
                            <span className="meta-val font-mono">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                      Explicit alias normalization, context-grounded evidence citation, and dual competency/confidence scoring.
                    </p>
                  </div>
                  <span className="pill-neutral">{result.skills.length} Skills Found</span>
                </div>

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
                              <span>Confidence Score</span>
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
                    <h2>Raw API Response Payload</h2>
                    <p>Live JSON returned by <code>POST /api/v1/credentials/{result.credential.credential_id}/complete</code>.</p>
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
          </>
        )}

        {/* ==========================================
            TAB: AUTHENTICATION & ACCESS CONTROL
        ========================================== */}
        {activeTab === "auth" && (
          <div className="tab-content auth-workspace">
            <div className="auth-view-grid">
              {/* Left Column: Sign In or Active Session */}
              <div className="auth-card session-box">
                <div className="auth-card-header">
                  <div className={`auth-card-icon ${authToken ? "green" : "blue"}`}>
                    <Icon name={authToken ? "shield-check" : "lock"} size={22} />
                  </div>
                  <div>
                    <h3>{authToken ? "Administrator Session Active" : "Administrator Sign In"}</h3>
                    <p>
                      {authToken
                        ? "Full administrative authority over repository documents, vaults, and intelligence"
                        : "Enter administrator credentials to browse database records and manage vaults"}
                    </p>
                  </div>
                </div>

                {authToken ? (
                  <div className="auth-active-session">
                    <div className="session-status-badge">
                      <span className="dot green" />
                      <span>Authenticated via Signed HMAC-SHA256 JWT Token</span>
                    </div>

                    <div className="session-details-table">
                      <div className="session-row">
                        <span className="lbl">Role</span>
                        <span className="val"><span className="nav-tag green">{currentUser?.role || "ADMIN"}</span></span>
                      </div>
                      <div className="session-row">
                        <span className="lbl">Admin Identity</span>
                        <span className="val"><strong>{currentUser?.email || currentUser?.username || "admin@blockintel.com"}</strong></span>
                      </div>
                      <div className="session-row">
                        <span className="lbl">Display Name</span>
                        <span className="val">{currentUser?.name || "System Administrator"}</span>
                      </div>
                      <div className="session-row">
                        <span className="lbl">Token Expiry</span>
                        <span className="val font-mono">24 Hours (Rolling Session)</span>
                      </div>
                      <div className="session-row">
                        <span className="lbl">Repository Access</span>
                        <span className="val">{credentialsList.length} Ingested Documents Accessible</span>
                      </div>
                    </div>

                    <div className="session-actions">
                      <button
                        className="btn btn-danger-outline w-full"
                        onClick={() => handleLogout("Signed out of Administrator session.")}
                      >
                        <Icon name="log-out" size={14} />
                        <span>Sign Out of Administrator Console</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="auth-login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>Administrator Username or Email</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="admin@blockintel.com"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                      />
                    </div>

                    {authError && (
                      <div className="modal-error-banner">
                        <Icon name="alert-triangle" size={15} />
                        <span>{authError}</span>
                      </div>
                    )}

                    <div className="form-actions-stacked">
                      <button type="submit" className="btn btn-primary w-full" disabled={authLoading}>
                        {authLoading ? (
                          <>
                            <span className="spinner" />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="lock" size={14} />
                            <span>Sign In as Administrator</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary w-full quick-demo-btn-row"
                        onClick={handleQuickFillDemo}
                      >
                        <Icon name="key" size={14} />
                        <span>Quick Demo: Auto-Fill Default Admin Credentials</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Right Column: RBAC Security Matrix */}
              <div className="auth-card rbac-box">
                <div className="auth-card-header">
                  <div className="auth-card-icon teal">
                    <Icon name="layers" size={22} />
                  </div>
                  <div>
                    <h3>Role-Based Access Control (RBAC) Architecture</h3>
                    <p>Strictly enforced across FastAPI REST guards, database queries, and UI components</p>
                  </div>
                </div>

                <div className="rbac-table-container">
                  <table className="rbac-table">
                    <thead>
                      <tr>
                        <th>Platform Capability</th>
                        <th>Public Verifier Mode</th>
                        <th>Administrator Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Check Document for Tampering</strong>
                          <div className="sub">POST /credentials/verify-document</div>
                        </td>
                        <td><span className="status-pill green">Allowed (Open)</span></td>
                        <td><span className="status-pill green">Allowed</span></td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Browse Stored Credentials List</strong>
                          <div className="sub">GET /credentials</div>
                        </td>
                        <td><span className="status-pill red">Restricted (401)</span></td>
                        <td><span className="status-pill green">Full Access</span></td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Stream Vault Artifacts (Visual Inspection)</strong>
                          <div className="sub">GET /credentials/{'{id}'}/file</div>
                        </td>
                        <td><span className="status-pill red">Restricted (401)</span></td>
                        <td><span className="status-pill green">Full Access</span></td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Upload / Ingest New Official Documents</strong>
                          <div className="sub">POST /credentials/upload</div>
                        </td>
                        <td><span className="status-pill red">Restricted (401)</span></td>
                        <td><span className="status-pill green">Full Access</span></td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Permanently Delete Credentials</strong>
                          <div className="sub">DELETE /credentials/{'{id}'}</div>
                        </td>
                        <td><span className="status-pill red">Restricted (401)</span></td>
                        <td><span className="status-pill green">Full Access</span></td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Run Multi-Modal Intelligence Pipelines</strong>
                          <div className="sub">POST /credentials/{'{id}'}/complete</div>
                        </td>
                        <td><span className="status-pill red">Restricted (401)</span></td>
                        <td><span className="status-pill green">Full Access</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="security-highlights">
                  <div className="highlight-item">
                    <Icon name="shield-check" size={16} />
                    <div>
                      <strong>Complete Database Privacy</strong>
                      <p>Public verifiers can never list, view, or scrape stored documents. They only test files in their physical or digital possession.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Icon name="cpu" size={16} />
                    <div>
                      <strong>Cryptographic Tamper-Proofing</strong>
                      <p>Dual-layer SHA-256 byte-hash matching and local ledger proof-of-existence verify document integrity in real time.</p>
                    </div>
                  </div>
                </div>
              </div>
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
                <p>Secure artifact processing · Magic-byte validation · Vault storage</p>
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
                  const f = e.dataTransfer.files[0];
                  if (f) handleSelectUploadFile(f);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectUploadFile(f);
                  }}
                />
                <Icon name="upload-cloud" size={36} />
                <strong>{uploadFile ? uploadFile.name : "Drop PDF, PNG, or JPEG credential here"}</strong>
                <small>{uploadFile ? `${formatBytes(uploadFile.size)} · Ready to ingest` : "or click to select from your computer (up to 15 MB)"}</small>
              </div>

              {isPreChecking && (
                <div className="precheck-loading-banner">
                  <span className="spinner" />
                  <span>Checking document across all database records & blockchain ledger...</span>
                </div>
              )}

              {uploadPreCheck && !isPreChecking && (
                <div className={`modal-precheck-banner ${uploadPreCheck.verdict.toLowerCase()}`}>
                  <div className="precheck-badges">
                    <span className={`presence-tag ${uploadPreCheck.is_present ? "present" : "not-present"}`}>
                      {uploadPreCheck.is_present ? "● PRESENT IN DATABASE" : "○ NOT PRESENT IN DATABASE"}
                    </span>
                    <span className={`verdict-tag ${uploadPreCheck.verdict.toLowerCase()}`}>
                      {uploadPreCheck.verdict === "ORIGINAL"
                        ? "✓ 100% ORIGINAL (AUTHENTIC)"
                        : uploadPreCheck.verdict === "TAMPERED"
                        ? "⚠ TAMPERED ARTIFACT DETECTED"
                        : "NEW UNREGISTERED DOCUMENT"}
                    </span>
                  </div>
                  <p className="precheck-msg">{uploadPreCheck.details}</p>
                  {uploadPreCheck.diff_indicators.length > 0 && (
                    <ul className="precheck-diff-list">
                      {uploadPreCheck.diff_indicators.map((diff, i) => (
                        <li key={i}>{diff}</li>
                      ))}
                    </ul>
                  )}
                  {uploadPreCheck.matched_credential_id && uploadPreCheck.verdict === "ORIGINAL" && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setIsUploadModalOpen(false);
                        loadCredential(uploadPreCheck.matched_credential_id!);
                      }}
                    >
                      <span>View Existing Registered Document →</span>
                    </button>
                  )}
                </div>
              )}

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
                className={`btn ${uploadPreCheck?.verdict === "TAMPERED" ? "btn-danger" : "btn-primary"}`}
                disabled={!uploadFile || uploadState === "uploading"}
                onClick={handleUploadFile}
              >
                {uploadState === "uploading"
                  ? "Processing Credential..."
                  : uploadPreCheck?.verdict === "ORIGINAL"
                  ? "Re-Ingest Document"
                  : uploadPreCheck?.verdict === "TAMPERED"
                  ? "Ingest Altered Document for Forensics →"
                  : uploadPreCheck?.verdict === "NOT_PRESENT"
                  ? "Ingest & Register Original →"
                  : "Start Ingestion & Analysis →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Universal Document Verifier Modal
      ========================================== */}
      {isUniversalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUniversalModalOpen(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Universal Document Presence & Tamper Scanner</h2>
                <p>Cross-checks any file across all stored credentials in the database and blockchain ledger</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsUniversalModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div
                className={`modal-dropzone ${universalFile ? "has-file" : ""}`}
                onClick={() => universalInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleRunUniversalVerify(f);
                }}
              >
                <input
                  ref={universalInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) handleRunUniversalVerify(f);
                  }}
                />
                <Icon name="upload-cloud" size={36} />
                <strong>{universalFile ? universalFile.name : "Drop any PDF, PNG, or JPEG to test presence & tampering"}</strong>
                <small>{universalFile ? `${formatBytes(universalFile.size)} · Click to test another file` : "Scans entire database of registered artifacts without prior selection"}</small>
              </div>

              {isUniversalVerifying && (
                <div className="verifier-calculating">
                  <span className="spinner" />
                  <span>Scanning all database documents and cryptographic registry...</span>
                </div>
              )}

              {universalError && (
                <div className="modal-error-banner">
                  <Icon name="alert-triangle" size={16} />
                  <span>{universalError}</span>
                </div>
              )}

              {universalResult && !isUniversalVerifying && (
                <div className={`universal-result-card ${universalResult.verdict.toLowerCase()}`}>
                  <div className="result-header-row">
                    <div className="verdict-badges-wrap">
                      <span className={`presence-pill ${universalResult.is_present ? "present" : "not-present"}`}>
                        {universalResult.is_present ? "● PRESENT IN SYSTEM DATABASE" : "○ NOT PRESENT IN DATABASE"}
                      </span>
                      <span className={`verdict-pill ${universalResult.verdict.toLowerCase()}`}>
                        {universalResult.verdict === "ORIGINAL"
                          ? "✓ 100% AUTHENTIC ORIGINAL"
                          : universalResult.verdict === "TAMPERED"
                          ? "⚠ TAMPERED ARTIFACT DETECTED"
                          : "UNREGISTERED ARTIFACT"}
                      </span>
                    </div>
                    {universalResult.matched_credential_id && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setIsUniversalModalOpen(false);
                          loadCredential(universalResult.matched_credential_id!);
                        }}
                      >
                        <span>Open Document Intelligence</span>
                        <Icon name="external-link" size={13} />
                      </button>
                    )}
                  </div>

                  <div className="result-details-box">
                    <p className="result-explanation">{universalResult.details}</p>
                  </div>

                  {universalResult.diff_indicators && universalResult.diff_indicators.length > 0 && (
                    <div className="diff-indicators-section">
                      <span className="diff-title">Detected Discrepancies & Audit Signals:</span>
                      <ul className="diff-list">
                        {universalResult.diff_indicators.map((diff, idx) => (
                          <li key={idx}>
                            <Icon name="alert-triangle" size={13} />
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="comparison-table-mini">
                    <div className="comp-row">
                      <span className="comp-label">Submitted Filename:</span>
                      <span className="comp-val font-mono">{universalResult.submitted_filename}</span>
                    </div>
                    {universalResult.matched_filename && (
                      <div className="comp-row">
                        <span className="comp-label">Matched Database Record:</span>
                        <span className="comp-val">
                          <strong>{universalResult.matched_filename}</strong>{" "}
                          <code className="cred-chip">{universalResult.matched_credential_id}</code>
                        </span>
                      </div>
                    )}
                    <div className="comp-row">
                      <span className="comp-label">Submitted SHA-256:</span>
                      <span className="comp-val font-mono hash-val">{universalResult.submitted_hash}</span>
                    </div>
                    {universalResult.registered_hash && (
                      <div className="comp-row">
                        <span className="comp-label">Registered Target SHA-256:</span>
                        <span className="comp-val font-mono hash-val">{universalResult.registered_hash}</span>
                      </div>
                    )}
                    <div className="comp-row">
                      <span className="comp-label">Detection Method:</span>
                      <span className="comp-val">{labelize(universalResult.match_reason)} (Confidence: {Math.round(universalResult.match_confidence * 100)}%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsUniversalModalOpen(false)}>
                Close
              </button>
              {universalFile && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsUniversalModalOpen(false);
                    setUploadFile(universalFile);
                    setIsUploadModalOpen(true);
                  }}
                >
                  <span>Ingest Into BlockIntel →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Delete Credential Confirmation Modal
      ========================================== */}
      {isDeleteModalOpen && result && (
        <div className="modal-overlay" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div>
                <h2>Delete Credential Document</h2>
                <p>Permanent vault removal & database purge</p>
              </div>
              <button className="modal-close-btn" disabled={isDeleting} onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="delete-warning-box">
                <strong>Warning: This action is permanent and cannot be undone.</strong>
                <p>
                  Deleting this credential will permanently remove the original raw artifact from vault storage, and purge its complete Phase 1 intelligence dossier, extracted OCR text, structural metadata, risk assessments, and skills from the database.
                </p>
              </div>

              <div className="delete-cred-preview">
                <div><strong>File:</strong> {result.credential.original_filename}</div>
                <div><strong>Credential ID:</strong> <code className="cred-chip">{result.credential.credential_id}</code></div>
                <div><strong>Size:</strong> {formatBytes(result.credential.file_size_bytes)} · {result.credential.file_type}</div>
                <div><strong>SHA-256 Digest:</strong> <span className="font-mono hash-val">{result.credential.sha256_hash.slice(0, 24)}...</span></div>
              </div>

              {deleteError && (
                <div className="modal-error-banner">
                  <Icon name="alert-triangle" size={16} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" disabled={isDeleting} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={isDeleting}
                onClick={() => handleDeleteCredential(result.credential.credential_id)}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner" />
                    <span>Deleting Document...</span>
                  </>
                ) : (
                  <>
                    <Icon name="trash" size={14} />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Administrator Authentication Modal
      ========================================== */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => !authLoading && setIsAuthModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="modal-icon-circle blue">
                  <Icon name="lock" size={20} />
                </div>
                <div>
                  <h2>Administrator Authentication</h2>
                  <p>Sign in to access and manage repository documents</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                disabled={authLoading}
                onClick={() => setIsAuthModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="auth-modal-notice">
                  <Icon name="info" size={15} />
                  <span>
                    Only authorized enterprise administrators can access, browse, upload, or alter credentials in the database.
                  </span>
                </div>

                <div className="form-group">
                  <label>Administrator Username / Email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="admin@blockintel.com"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>

                {authError && (
                  <div className="modal-error-banner">
                    <Icon name="alert-triangle" size={15} />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="quick-demo-btn"
                  onClick={handleQuickFillDemo}
                >
                  <Icon name="key" size={13} />
                  <span>Quick Demo: Auto-Fill Default Admin Credentials</span>
                </button>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={authLoading}
                  onClick={() => setIsAuthModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <span className="spinner" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="lock" size={14} />
                      <span>Sign In as Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
