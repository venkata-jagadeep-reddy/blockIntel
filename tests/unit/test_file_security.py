import pytest
from blockintel.core.security import (
    validate_magic_bytes, validate_file_extension, sanitize_filename,
    compute_sha256_bytes, generate_credential_id
)
from blockintel.domain.enums import FileType
from blockintel.core.exceptions import InvalidFileFormatError

def test_validate_magic_bytes_valid_pdf():
    header = b"%PDF-1.7 header content here"
    ft, mime = validate_magic_bytes(header)
    assert ft == FileType.PDF
    assert mime == "application/pdf"

def test_validate_magic_bytes_valid_png():
    header = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    ft, mime = validate_magic_bytes(header)
    assert ft == FileType.PNG
    assert mime == "image/png"

def test_validate_magic_bytes_valid_jpeg():
    header = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    ft, mime = validate_magic_bytes(header)
    assert ft == FileType.JPEG
    assert mime == "image/jpeg"

def test_validate_magic_bytes_rejects_spoofed_file():
    header = b"Plain text disguised as a PDF"
    with pytest.raises(InvalidFileFormatError) as exc:
        validate_magic_bytes(header)
    assert "magic byte signature" in str(exc.value)

def test_validate_file_extension_mismatch():
    with pytest.raises(InvalidFileFormatError) as exc:
        validate_file_extension("degree.exe", FileType.PDF)
    assert "does not match detected format" in str(exc.value)

    with pytest.raises(InvalidFileFormatError) as exc:
        validate_file_extension("certificate.png", FileType.PDF)
    assert "does not match detected format" in str(exc.value)

def test_sanitize_filename_prevents_path_traversal():
    dangerous = "../../../etc/cron.d/malicious.pdf"
    cleaned = sanitize_filename(dangerous)
    assert "/" not in cleaned
    assert ".." not in cleaned
    assert cleaned.endswith(".pdf")

def test_compute_sha256_bytes_deterministic():
    content = b"%PDF-1.4 sample byte payload"
    hash1 = compute_sha256_bytes(content)
    hash2 = compute_sha256_bytes(content)
    assert hash1 == hash2
    assert len(hash1) == 64

def test_generate_credential_id_format():
    cid = generate_credential_id()
    assert cid.startswith("CRD-")
    assert len(cid) == 16
