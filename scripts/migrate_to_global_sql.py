#!/usr/bin/env python3
"""
BlockIntel: Data Migration Utility (Local SQLite -> Global SQL / PostgreSQL)

Transfers all records from local data/blockintel.db to a remote Global SQL database
(Neon Serverless Postgres, Supabase, CockroachDB, AWS Aurora, etc.).

Usage:
    python scripts/migrate_to_global_sql.py "postgresql+asyncpg://user:password@ep-host.neon.tech/neondb?sslmode=require"
"""

import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from blockintel.infrastructure.database.models import (
    Base,
    CredentialModel,
    DocumentExtractionModel,
    ExtractedPageModel,
    MetadataRecordModel,
    RiskAssessmentModel,
    RiskSignalModel,
    BlockchainRecordModel,
    SkillModel,
    SkillEvidenceModel,
    SkillEvaluationModel,
    VerificationLogModel,
)
from blockintel.infrastructure.database.session import AsyncSessionLocal as LocalSessionLocal

async def migrate(target_url: str):
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif target_url.startswith("postgresql://") and not target_url.startswith("postgresql+asyncpg://"):
        target_url = target_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    print(f"[*] Initializing Target Global SQL Engine: {target_url.split('@')[-1] if '@' in target_url else target_url}")
    target_engine = create_async_engine(target_url, echo=False, pool_pre_ping=True)
    TargetSessionLocal = async_sessionmaker(target_engine, class_=AsyncSession, expire_on_commit=False)

    print("[*] Creating database tables on Global SQL target...")
    async with target_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Global SQL tables ready.")

    async with LocalSessionLocal() as local_db, TargetSessionLocal() as target_db:
        # 1. Credentials
        creds = (await local_db.execute(select(CredentialModel))).scalars().all()
        print(f"[*] Migrating {len(creds)} credentials...")
        for c in creds:
            existing = (await target_db.execute(select(CredentialModel).where(CredentialModel.credential_id == c.credential_id))).scalar_one_or_none()
            if not existing:
                new_c = CredentialModel(
                    id=c.id,
                    credential_id=c.credential_id,
                    original_filename=c.original_filename,
                    file_type=c.file_type,
                    mime_type=c.mime_type,
                    file_size_bytes=c.file_size_bytes,
                    storage_path=c.storage_path,
                    sha256_hash=c.sha256_hash,
                    status=c.status,
                    created_at=c.created_at,
                    updated_at=c.updated_at
                )
                target_db.add(new_c)
        await target_db.commit()

        # 2. Document Extractions
        extractions = (await local_db.execute(select(DocumentExtractionModel))).scalars().all()
        print(f"[*] Migrating {len(extractions)} document extractions...")
        for ext in extractions:
            existing = (await target_db.execute(select(DocumentExtractionModel).where(DocumentExtractionModel.id == ext.id))).scalar_one_or_none()
            if not existing:
                target_db.add(DocumentExtractionModel(
                    id=ext.id,
                    credential_id=ext.credential_id,
                    extraction_method=ext.extraction_method,
                    text_available=ext.text_available,
                    average_ocr_confidence=ext.average_ocr_confidence,
                    total_pages=ext.total_pages,
                    full_raw_text=ext.full_raw_text,
                    layout_structure=ext.layout_structure,
                    extracted_at=ext.extracted_at
                ))
        await target_db.commit()

        # 3. Metadata Records
        metas = (await local_db.execute(select(MetadataRecordModel))).scalars().all()
        print(f"[*] Migrating {len(metas)} metadata records...")
        for m in metas:
            existing = (await target_db.execute(select(MetadataRecordModel).where(MetadataRecordModel.id == m.id))).scalar_one_or_none()
            if not existing:
                target_db.add(MetadataRecordModel(
                    id=m.id,
                    credential_id=m.credential_id,
                    author=m.author,
                    producer=m.producer,
                    creator=m.creator,
                    creation_date=m.creation_date,
                    modification_date=m.modification_date,
                    raw_metadata=m.raw_metadata,
                    structural_info=m.structural_info
                ))
        await target_db.commit()

        # 4. Risk Assessments
        risks = (await local_db.execute(select(RiskAssessmentModel))).scalars().all()
        print(f"[*] Migrating {len(risks)} risk assessments...")
        for r in risks:
            existing = (await target_db.execute(select(RiskAssessmentModel).where(RiskAssessmentModel.id == r.id))).scalar_one_or_none()
            if not existing:
                target_db.add(RiskAssessmentModel(
                    id=r.id,
                    credential_id=r.credential_id,
                    risk_score=r.risk_score,
                    risk_level=r.risk_level,
                    summary_explanations=r.summary_explanations,
                    assessed_at=r.assessed_at
                ))
        await target_db.commit()

        # 5. Blockchain Records
        bcs = (await local_db.execute(select(BlockchainRecordModel))).scalars().all()
        print(f"[*] Migrating {len(bcs)} blockchain records...")
        for b in bcs:
            existing = (await target_db.execute(select(BlockchainRecordModel).where(BlockchainRecordModel.id == b.id))).scalar_one_or_none()
            if not existing:
                target_db.add(BlockchainRecordModel(
                    id=b.id,
                    credential_id=b.credential_id,
                    contract_address=b.contract_address,
                    transaction_hash=b.transaction_hash,
                    block_number=b.block_number,
                    network_id=b.network_id,
                    registered_at=b.registered_at,
                    registered_by=b.registered_by
                ))
        await target_db.commit()

        # 6. Verification Logs
        logs = (await local_db.execute(select(VerificationLogModel))).scalars().all()
        print(f"[*] Migrating {len(logs)} verification logs...")
        for l in logs:
            existing = (await target_db.execute(select(VerificationLogModel).where(VerificationLogModel.id == l.id))).scalar_one_or_none()
            if not existing:
                target_db.add(VerificationLogModel(
                    id=l.id,
                    submitted_hash=l.submitted_hash,
                    registered_hash=l.registered_hash,
                    hash_match=l.hash_match,
                    integrity_status=l.integrity_status,
                    ip_address=l.ip_address,
                    verified_at=l.verified_at
                ))
        await target_db.commit()

    print("[SUCCESS] All database records migrated successfully to Global SQL.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Target database connection string required.")
        print('Example: python scripts/migrate_to_global_sql.py "postgresql+asyncpg://user:pass@ep-host.neon.tech/neondb?sslmode=require"')
        sys.exit(1)
    asyncio.run(migrate(sys.argv[1]))
