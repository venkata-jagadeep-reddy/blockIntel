from typing import Any, Optional

class BlockIntelError(Exception):
    """Base exception for all BlockIntel domain errors."""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

class CredentialNotFoundError(BlockIntelError):
    """Raised when requested credential is not found in registry."""
    pass

class InvalidFileFormatError(BlockIntelError):
    """Raised when uploaded file fails MIME, magic byte, or extension validation."""
    pass

class FileSizeLimitExceededError(BlockIntelError):
    """Raised when uploaded file exceeds allowed byte limit."""
    pass

class ProcessingFailedError(BlockIntelError):
    """Raised when document processing (native text or OCR) fails."""
    pass

class BlockchainError(BlockIntelError):
    """Raised during smart contract communication or transaction failures."""
    pass

class SkillExtractionError(BlockIntelError):
    """Raised when NLP extraction or normalization fails."""
    pass
