import hashlib
import os
import re
import secrets
from pathlib import Path
from typing import Tuple
from blockintel.domain.enums import FileType
from blockintel.core.exceptions import InvalidFileFormatError, FileSizeLimitExceededError

# Magic byte signatures
MAGIC_SIGNATURES: dict[FileType, list[bytes]] = {
    FileType.PDF: [b"%PDF-"],
    FileType.PNG: [b"\x89PNG\r\n\x1a\n"],
    FileType.JPEG: [b"\xff\xd8\xff"]
}

MIME_MAPPING: dict[FileType, str] = {
    FileType.PDF: "application/pdf",
    FileType.PNG: "image/png",
    FileType.JPEG: "image/jpeg"
}

ALLOWED_EXTENSIONS: dict[FileType, set[str]] = {
    FileType.PDF: {".pdf"},
    FileType.PNG: {".png"},
    FileType.JPEG: {".jpg", ".jpeg"}
}

def compute_sha256_bytes(content: bytes) -> str:
    """Computes SHA-256 hex digest over exact raw bytes."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()

def validate_magic_bytes(header: bytes) -> Tuple[FileType, str]:
    """
    Inspects leading bytes of a file to verify true file format.
    Does NOT rely on client-supplied extension or headers.
    """
    for file_type, signatures in MAGIC_SIGNATURES.items():
        for sig in signatures:
            if header.startswith(sig):
                return file_type, MIME_MAPPING[file_type]
                
    raise InvalidFileFormatError(
        "File failed magic byte signature inspection. Only authentic PDF, PNG, and JPEG files are supported."
    )

def validate_file_extension(filename: str, expected_type: FileType) -> None:
    """
    Cross-validates the file extension against the detected magic byte type.
    """
    ext = Path(filename).suffix.lower()
    allowed = ALLOWED_EXTENSIONS.get(expected_type, set())
    if ext not in allowed:
        raise InvalidFileFormatError(
            f"File extension '{ext}' does not match detected format '{expected_type.value}'."
        )

def sanitize_filename(filename: str) -> str:
    """Removes any path traversal components and dangerous characters."""
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    return clean_name or "unnamed_credential"

def generate_credential_id() -> str:
    """Generates secure, unique credential identifier: CRD-<12 hex chars>."""
    token = secrets.token_hex(6).upper()
    return f"CRD-{token}"
