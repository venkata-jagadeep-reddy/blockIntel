"""Explainable, signal-based document authenticity-risk assessment."""

from collections import Counter
from datetime import datetime
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.config import settings
from blockintel.core.exceptions import CredentialNotFoundError
from blockintel.domain.enums import RiskLevel, Severity
from blockintel.infrastructure.database.models import (
    CredentialModel,
    MetadataRecordModel,
    RiskAssessmentModel,
    RiskSignalModel,
)


SEVERITY_POINTS = {Severity.LOW: 10, Severity.MEDIUM: 20, Severity.HIGH: 35, Severity.CRITICAL: 50}
SUSPICIOUS_PRODUCERS = ("photoshop", "gimp", "canva", "illustrator")


class AuthenticityRiskService:
    """Produces review signals, never a verdict about issuer authenticity."""

    async def assess_credential(self, credential_id: str, db: AsyncSession) -> RiskAssessmentModel:
        credential = await self._get_credential(credential_id, db)
        await db.refresh(credential, ["extraction", "metadata_record", "risk_assessment"])
        if credential.risk_assessment:
            return credential.risk_assessment

        credential.status = "RISK_ANALYSIS"
        signals = self._analyse(credential.extraction, credential.metadata_record)
        score = min(100, sum(SEVERITY_POINTS[signal["severity"]] for signal in signals))
        level = self._risk_level(score)
        explanations = self._explanations(signals, level)

        assessment = RiskAssessmentModel(
            credential_id=credential.id,
            risk_score=score,
            risk_level=level.value,
            summary_explanations=explanations,
        )
        db.add(assessment)
        await db.flush()
        for signal in signals:
            db.add(RiskSignalModel(
                risk_assessment_id=assessment.id,
                signal_type=signal["signal_type"],
                severity=signal["severity"].value,
                description=signal["description"],
                signal_metadata=signal.get("metadata"),
            ))
        credential.status = "RISK_ASSESSED"
        await db.commit()
        await db.refresh(assessment, ["signals"])
        return assessment

    async def get_assessment(self, credential_id: str, db: AsyncSession) -> RiskAssessmentModel:
        credential = await self._get_credential(credential_id, db)
        await db.refresh(credential, ["risk_assessment"])
        if credential.risk_assessment is None:
            from blockintel.core.exceptions import ProcessingFailedError
            raise ProcessingFailedError(f"Credential '{credential_id}' has not been risk assessed yet.")
        return credential.risk_assessment

    async def _get_credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        result = await db.execute(select(CredentialModel).where(CredentialModel.credential_id == credential_id))
        credential = result.scalar_one_or_none()
        if credential is None:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        return credential

    def _analyse(self, extraction, metadata: MetadataRecordModel | None) -> list[dict]:
        signals: list[dict] = []
        text = extraction.full_raw_text if extraction else ""

        if text:
            whitespace_ratio = len(re.findall(r" {3,}|\t", text)) / max(1, len(text.split()))
            if whitespace_ratio > 0.08:
                signals.append(self._signal("text_spacing_anomaly", Severity.LOW,
                    "Unusually frequent spacing or tab patterns were detected in extracted text.",
                    {"ratio": round(whitespace_ratio, 3)}))
            letters = [char for char in text if char.isalpha()]
            capitals = sum(char.isupper() for char in letters)
            if len(letters) >= 40 and capitals / len(letters) > 0.85:
                signals.append(self._signal("capitalization_anomaly", Severity.LOW,
                    "Most extracted alphabetic text is capitalized; this should be reviewed with the document layout.",
                    {"capital_ratio": round(capitals / len(letters), 3)}))

        if metadata:
            if metadata.creation_date and metadata.modification_date and metadata.modification_date < metadata.creation_date:
                signals.append(self._signal("metadata_date_conflict", Severity.HIGH,
                    "The document modification date precedes its creation date.", None))
            producer = (metadata.producer or "").lower()
            if any(tool in producer for tool in SUSPICIOUS_PRODUCERS):
                signals.append(self._signal("metadata_editing_tool", Severity.MEDIUM,
                    "Metadata names an image or design editor; this is a review signal, not proof of alteration.",
                    {"producer": metadata.producer}))

            structure = metadata.structural_info or {}
            fonts = structure.get("fonts", [])
            distinct_fonts = {font.get("name") for font in fonts if font.get("name")}
            if len(distinct_fonts) >= 6:
                signals.append(self._signal("font_inconsistency", Severity.LOW,
                    "The document contains an unusually large number of distinct fonts.",
                    {"font_count": len(distinct_fonts)}))
            page_count = structure.get("page_count", 0)
            images = structure.get("total_images", 0)
            blocks = structure.get("total_text_blocks", 0)
            if page_count and images >= page_count * 4 and blocks == 0:
                signals.append(self._signal("image_dominant_layout", Severity.LOW,
                    "The document is image-dominant with no native text blocks; OCR and visual review may be needed.",
                    {"images": images, "pages": page_count}))
        return signals

    @staticmethod
    def _signal(signal_type: str, severity: Severity, description: str, metadata: dict | None) -> dict:
        return {"signal_type": signal_type, "severity": severity, "description": description, "metadata": metadata}

    @staticmethod
    def _risk_level(score: int) -> RiskLevel:
        if score < settings.RISK_THRESHOLD_LOW:
            return RiskLevel.LOW
        if score < settings.RISK_THRESHOLD_HIGH:
            return RiskLevel.MEDIUM
        return RiskLevel.HIGH

    @staticmethod
    def _explanations(signals: list[dict], level: RiskLevel) -> list[str]:
        if not signals:
            return ["No configured authenticity-risk signals were detected. This is not proof of issuer authenticity."]
        prefix = "This credential exhibits elevated authenticity risk and requires further verification." if level != RiskLevel.LOW else "Minor review signals were detected; they do not establish forgery."
        return [prefix, *[signal["description"] for signal in signals]]
