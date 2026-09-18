// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Stores only credential fingerprints and timestamps, never credential content or PII.
contract CredentialRegistry {
    struct CredentialRecord { uint256 registeredAt; address registeredBy; }
    mapping(bytes32 => CredentialRecord) private records;

    event CredentialRegistered(bytes32 indexed credentialHash, uint256 registeredAt, address indexed registeredBy);

    function registerCredential(bytes32 credentialHash) external {
        require(records[credentialHash].registeredAt == 0, "Credential already registered");
        records[credentialHash] = CredentialRecord(block.timestamp, msg.sender);
        emit CredentialRegistered(credentialHash, block.timestamp, msg.sender);
    }

    function verifyCredential(bytes32 credentialHash) external view returns (bool) {
        return records[credentialHash].registeredAt != 0;
    }

    function getCredentialRecord(bytes32 credentialHash) external view returns (uint256, address) {
        CredentialRecord memory record = records[credentialHash];
        return (record.registeredAt, record.registeredBy);
    }
}
