"""Deterministic development provider; replace with a Web3 provider in deployment."""

from dataclasses import dataclass
from hashlib import sha256
from time import time


@dataclass(frozen=True)
class RegistrationReceipt:
    transaction_hash: str
    block_number: int
    contract_address: str
    network_id: str
    registered_by: str


class LocalBlockchainProvider:
    """Provides a truthful local ledger receipt without pretending to call Ethereum."""

    def register_hash(self, artifact_hash: str, credential_id: str) -> RegistrationReceipt:
        nonce = f"{credential_id}:{artifact_hash}:{time_ns()}"
        transaction_hash = "0x" + sha256(nonce.encode()).hexdigest()
        block_number = int(transaction_hash[2:10], 16)
        return RegistrationReceipt(
            transaction_hash=transaction_hash,
            block_number=block_number,
            contract_address="local-development-ledger",
            network_id="local",
            registered_by="local-service",
        )


def time_ns() -> int:
    return int(time() * 1_000_000_000)
