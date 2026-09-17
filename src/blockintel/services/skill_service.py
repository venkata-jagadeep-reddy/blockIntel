"""Evidence-only skill extraction; no generative or inferred skills."""

from dataclasses import dataclass
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from blockintel.core.exceptions import CredentialNotFoundError, ProcessingFailedError
from blockintel.infrastructure.database.models import (
    CredentialModel,
    ExtractedPageModel,
    SkillEvidenceModel,
    SkillEvaluationModel,
    SkillModel,
)


@dataclass(frozen=True)
class SkillDefinition:
    canonical: str
    category: str
    aliases: tuple[str, ...]


# Intentionally small, auditable catalog. Additions are explicit product decisions.
SKILL_CATALOG = (
    SkillDefinition("React", "Frontend", ("React", "React.js", "ReactJS", "React JS")),
    SkillDefinition("Node.js", "Backend", ("Node.js", "NodeJS", "Node JS")),
    SkillDefinition("Express.js", "Backend", ("Express.js", "ExpressJS", "Express JS", "Express")),
    SkillDefinition("MongoDB", "Database", ("MongoDB",)),
    SkillDefinition("PostgreSQL", "Database", ("PostgreSQL", "Postgres")),
    SkillDefinition("Python", "Programming Language", ("Python",)),
    SkillDefinition("JavaScript", "Programming Language", ("JavaScript", "Javascript")),
    SkillDefinition("SQL", "Database", ("SQL",)),
    SkillDefinition("Docker", "DevOps", ("Docker",)),
    SkillDefinition("AWS", "Cloud", ("AWS", "Amazon Web Services")),
    SkillDefinition("Git", "Developer Tool", ("Git",)),
)
CONTEXT_TERMS = ("certificate", "certification", "completed", "program", "course", "proficiency", "training", "covering")
PRACTICAL_TERMS = ("project", "built", "developed", "implemented", "assessment", "practical", "capstone")


class SkillIntelligenceService:
    async def extract_and_evaluate(self, credential_id: str, db: AsyncSession) -> list[SkillModel]:
        credential = await self._credential(credential_id, db)
        await db.refresh(credential, ["skills", "extraction"])
        if credential.skills:
            return credential.skills
        if credential.extraction is None or not credential.extraction.text_available:
            raise ProcessingFailedError("Credential must have usable extracted text before skill processing.")

        pages = (await db.execute(select(ExtractedPageModel).where(
            ExtractedPageModel.credential_id == credential.id).order_by(ExtractedPageModel.page_number)
        )).scalars().all()
        credential.status = "SKILL_PROCESSING"
        for definition in SKILL_CATALOG:
            match = self._first_match(definition, pages)
            if match is None:
                continue
            page, detected_term, start, end = match
            evidence_text = self._evidence_window(page.page_text, start, end)
            competency_score, competency_reasons = self._competency(evidence_text, definition.canonical, pages)
            confidence_score, confidence_reasons = self._confidence(page.ocr_confidence, detected_term, definition.canonical, evidence_text)
            skill = SkillModel(
                credential_id=credential.id,
                canonical_skill=definition.canonical,
                detected_term=detected_term,
                category=definition.category,
            )
            db.add(skill)
            await db.flush()
            db.add(SkillEvidenceModel(
                skill_id=skill.id,
                evidence_text=evidence_text,
                page_number=page.page_number,
                char_start=start,
                char_end=end,
                source_type="credential",
                confidence_weight=page.ocr_confidence if page.ocr_confidence is not None else 0.5,
            ))
            db.add(SkillEvaluationModel(
                skill_id=skill.id,
                competency_score=competency_score,
                confidence_score=confidence_score,
                competency_reasons=competency_reasons,
                confidence_reasons=confidence_reasons,
            ))
        credential.status = "COMPLETED"
        await db.commit()
        await db.refresh(credential, ["skills"])
        return credential.skills

    async def get_skills(self, credential_id: str, db: AsyncSession) -> list[SkillModel]:
        credential = await self._credential(credential_id, db)
        await db.refresh(credential, ["skills"])
        return credential.skills

    async def _credential(self, credential_id: str, db: AsyncSession) -> CredentialModel:
        result = await db.execute(select(CredentialModel).where(CredentialModel.credential_id == credential_id))
        credential = result.scalar_one_or_none()
        if credential is None:
            raise CredentialNotFoundError(f"Credential '{credential_id}' not found.")
        return credential

    @staticmethod
    def _first_match(definition: SkillDefinition, pages: list[ExtractedPageModel]):
        # Sort longest aliases first so `React.js` keeps its original, most specific term.
        for page in pages:
            for alias in sorted(definition.aliases, key=len, reverse=True):
                # A full stop may be sentence punctuation after a plain skill (e.g. `MongoDB.`),
                # while dotted aliases are tried first to keep `React.js` intact.
                found = re.search(r"(?<![\w.])" + re.escape(alias) + r"(?!\w)", page.page_text, re.IGNORECASE)
                if found:
                    return page, found.group(0), found.start(), found.end()
        return None

    @staticmethod
    def _evidence_window(text: str, start: int, end: int) -> str:
        sentence_start = max(text.rfind(".", 0, start), text.rfind("\n", 0, start)) + 1
        sentence_end = min([position for position in (text.find(".", end), text.find("\n", end)) if position >= 0] or [len(text)])
        return text[sentence_start:sentence_end].strip()

    @staticmethod
    def _competency(evidence: str, canonical: str, pages: list[ExtractedPageModel]) -> tuple[int, list[str]]:
        lowered = evidence.lower()
        score, reasons = 45, ["Skill is explicitly mentioned in credential text."]
        if any(term in lowered for term in CONTEXT_TERMS):
            score += 15
            reasons.append("Technical learning or certification context is present.")
        if any(term in lowered for term in PRACTICAL_TERMS):
            score += 20
            reasons.append("Practical, project, or assessment context is present.")
        mentions = sum(len(re.findall(r"(?<![\w.])" + re.escape(canonical) + r"(?![\w.])", page.page_text, re.I)) for page in pages)
        if mentions > 1:
            score += min(10, (mentions - 1) * 5)
            reasons.append("Skill appears repeatedly in the available credential text.")
        reasons.append("This score represents credential evidence strength, not real-world mastery.")
        return min(score, 100), reasons

    @staticmethod
    def _confidence(ocr_confidence: float | None, detected: str, canonical: str, evidence: str) -> tuple[int, list[str]]:
        extraction_confidence = 1.0 if ocr_confidence is None else ocr_confidence
        score = round(extraction_confidence * 55)
        reasons = ["High-quality native text" if extraction_confidence >= 0.99 else "OCR confidence was included in this score."]
        score += 25
        reasons.append("A clear, exact skill term was found in the credential.")
        score += 15 if detected.lower() != canonical.lower() else 20
        reasons.append("The detected term was normalized using an explicit catalog alias.")
        if len(evidence) >= len(detected) + 12:
            score += 5
            reasons.append("Surrounding evidence provides clear context.")
        return min(score, 100), reasons
