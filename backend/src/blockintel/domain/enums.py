from enum import Enum

class CredentialStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    RISK_ANALYSIS = "RISK_ANALYSIS"
    RISK_ASSESSED = "RISK_ASSESSED"
    BLOCKCHAIN_PENDING = "BLOCKCHAIN_PENDING"
    REGISTERED = "REGISTERED"
    SKILL_PROCESSING = "SKILL_PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class FileType(str, Enum):
    PDF = "PDF"
    PNG = "PNG"
    JPEG = "JPEG"

class ExtractionMethod(str, Enum):
    NATIVE = "NATIVE"
    OCR = "OCR"
    HYBRID = "HYBRID"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IntegrityStatus(str, Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    NOT_REGISTERED = "NOT_REGISTERED"
