import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator
from blockintel.infrastructure.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UTCDateTime(TypeDecorator):
    """Round-trip UTC awareness through SQLite, which otherwise drops tzinfo."""
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc) if value is not None and value.tzinfo is None else value

class CredentialModel(Base):
    __tablename__ = "credentials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(64), unique=True, index=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(16), nullable=False)
    mime_type = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String(512), nullable=False)
    sha256_hash = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(32), default="UPLOADED", nullable=False)
    created_at = Column(UTCDateTime(), default=utc_now, nullable=False)
    updated_at = Column(UTCDateTime(), default=utc_now, onupdate=utc_now, nullable=False)

    extraction = relationship(
        "DocumentExtractionModel",
        back_populates="credential",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    pages = relationship(
        "ExtractedPageModel",
        back_populates="credential",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    metadata_record = relationship(
        "MetadataRecordModel",
        back_populates="credential",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    risk_assessment = relationship(
        "RiskAssessmentModel",
        back_populates="credential",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    blockchain_record = relationship(
        "BlockchainRecordModel",
        back_populates="credential",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    skills = relationship(
        "SkillModel",
        back_populates="credential",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class DocumentExtractionModel(Base):
    __tablename__ = "document_extractions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), unique=True, nullable=False)
    extraction_method = Column(String(32), nullable=False)
    text_available = Column(Boolean, default=False, nullable=False)
    average_ocr_confidence = Column(Float, nullable=True)
    total_pages = Column(Integer, default=1, nullable=False)
    full_raw_text = Column(Text, nullable=False, default="")
    layout_structure = Column(JSON, nullable=True)
    extracted_at = Column(UTCDateTime(), default=utc_now, nullable=False)

    credential = relationship("CredentialModel", back_populates="extraction", lazy="selectin")

class ExtractedPageModel(Base):
    __tablename__ = "extracted_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    page_text = Column(Text, nullable=False, default="")
    ocr_confidence = Column(Float, nullable=True)
    blocks = Column(JSON, nullable=True)
    created_at = Column(UTCDateTime(), default=utc_now, nullable=False)

    credential = relationship("CredentialModel", back_populates="pages")

class MetadataRecordModel(Base):
    __tablename__ = "metadata_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), unique=True, nullable=False)
    author = Column(String(255), nullable=True)
    producer = Column(String(255), nullable=True)
    creator = Column(String(255), nullable=True)
    creation_date = Column(UTCDateTime(), nullable=True)
    modification_date = Column(UTCDateTime(), nullable=True)
    raw_metadata = Column(JSON, nullable=True)
    structural_info = Column(JSON, nullable=True)

    credential = relationship("CredentialModel", back_populates="metadata_record")

class RiskAssessmentModel(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), unique=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(16), nullable=False)
    summary_explanations = Column(JSON, default=list, nullable=False)
    assessed_at = Column(UTCDateTime(), default=utc_now, nullable=False)

    credential = relationship("CredentialModel", back_populates="risk_assessment")
    signals = relationship(
        "RiskSignalModel",
        back_populates="risk_assessment",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class RiskSignalModel(Base):
    __tablename__ = "risk_signals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    risk_assessment_id = Column(String(36), ForeignKey("risk_assessments.id"), nullable=False, index=True)
    signal_type = Column(String(64), nullable=False)
    severity = Column(String(16), nullable=False)
    description = Column(Text, nullable=False)
    signal_metadata = Column(JSON, nullable=True)

    risk_assessment = relationship("RiskAssessmentModel", back_populates="signals")

class BlockchainRecordModel(Base):
    __tablename__ = "blockchain_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), unique=True, nullable=False)
    contract_address = Column(String(42), nullable=False)
    transaction_hash = Column(String(66), nullable=False)
    block_number = Column(Integer, nullable=False)
    network_id = Column(String(32), nullable=False)
    registered_at = Column(UTCDateTime(), default=utc_now, nullable=False)
    registered_by = Column(String(42), nullable=False)

    credential = relationship("CredentialModel", back_populates="blockchain_record")

class VerificationLogModel(Base):
    __tablename__ = "verification_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    submitted_hash = Column(String(64), index=True, nullable=False)
    registered_hash = Column(String(64), nullable=True)
    hash_match = Column(Boolean, nullable=False)
    integrity_status = Column(String(32), nullable=False)
    ip_address = Column(String(64), nullable=True)
    verified_at = Column(UTCDateTime(), default=utc_now, nullable=False)

class SkillModel(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(36), ForeignKey("credentials.id"), nullable=False, index=True)
    canonical_skill = Column(String(128), nullable=False)
    detected_term = Column(String(128), nullable=False)
    category = Column(String(64), nullable=True)
    extracted_at = Column(UTCDateTime(), default=utc_now, nullable=False)

    credential = relationship("CredentialModel", back_populates="skills")
    evidence = relationship(
        "SkillEvidenceModel",
        back_populates="skill",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    evaluation = relationship(
        "SkillEvaluationModel",
        back_populates="skill",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class SkillEvidenceModel(Base):
    __tablename__ = "skill_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id"), unique=True, nullable=False)
    evidence_text = Column(Text, nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    char_start = Column(Integer, nullable=True)
    char_end = Column(Integer, nullable=True)
    source_type = Column(String(32), default="credential", nullable=False)
    confidence_weight = Column(Float, default=1.0, nullable=False)

    skill = relationship("SkillModel", back_populates="evidence")

class SkillEvaluationModel(Base):
    __tablename__ = "skill_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id"), unique=True, nullable=False)
    competency_score = Column(Integer, nullable=False)
    confidence_score = Column(Integer, nullable=False)
    competency_reasons = Column(JSON, default=list, nullable=False)
    confidence_reasons = Column(JSON, default=list, nullable=False)

    skill = relationship("SkillModel", back_populates="evaluation")
