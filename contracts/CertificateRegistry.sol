// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev ChainCert - Decentralized Academic Credential Verification
 * @notice Allows authorized institutions to issue, manage, and revoke certificates
 */
contract CertificateRegistry {
    // ─────────────────────────────────────────────────────────
    //  Structs
    // ─────────────────────────────────────────────────────────
    struct Certificate {
        string  studentName;
        string  course;
        string  grade;
        string  ipfsHash;       // IPFS CID of the PDF certificate
        uint256 issuedAt;
        uint256 expiresAt;      // 0 = never expires
        bool    revoked;
        address issuedBy;       // issuer wallet
        address studentWallet;
    }

    struct Issuer {
        string  institutionName;
        bool    active;
    }

    // ─────────────────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────────────────
    address public admin;

    mapping(bytes32  => Certificate) public certificates;
    mapping(address  => Issuer)      public issuers;
    mapping(address  => bytes32[])   public studentCerts;  // student => certIds

    // ─────────────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────────────
    event IssuerAdded(address indexed issuer, string institutionName);
    event IssuerRevoked(address indexed issuer);
    event CertificateIssued(
        bytes32 indexed certId,
        address indexed student,
        address indexed issuer,
        string course
    );
    event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy);

    // ─────────────────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "CertReg: not admin");
        _;
    }

    modifier onlyActiveIssuer() {
        require(issuers[msg.sender].active, "CertReg: not an authorized issuer");
        _;
    }

    // ─────────────────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────────────────
    constructor() {
        admin = msg.sender;
    }

    // ─────────────────────────────────────────────────────────
    //  Admin functions
    // ─────────────────────────────────────────────────────────
    function addIssuer(address _issuer, string calldata _institutionName)
        external
        onlyAdmin
    {
        require(_issuer != address(0), "CertReg: zero address");
        issuers[_issuer] = Issuer({ institutionName: _institutionName, active: true });
        emit IssuerAdded(_issuer, _institutionName);
    }

    function revokeIssuer(address _issuer) external onlyAdmin {
        require(issuers[_issuer].active, "CertReg: not active issuer");
        issuers[_issuer].active = false;
        emit IssuerRevoked(_issuer);
    }

    // ─────────────────────────────────────────────────────────
    //  Issuer functions
    // ─────────────────────────────────────────────────────────
    /**
     * @dev Issues a new certificate on-chain
     * @param _student      Wallet address of the student
     * @param _studentName  Full name of the student
     * @param _course       Course / degree name
     * @param _grade        Grade achieved (e.g., "A", "First Class")
     * @param _ipfsHash     IPFS CID pointing to the PDF certificate
     * @param _validityDays 0 = no expiry, otherwise days until expiry
     * @return certId       Unique bytes32 identifier for this certificate
     */
    function issueCertificate(
        address _student,
        string calldata _studentName,
        string calldata _course,
        string calldata _grade,
        string calldata _ipfsHash,
        uint256 _validityDays
    ) external onlyActiveIssuer returns (bytes32 certId) {
        require(_student != address(0), "CertReg: zero student address");
        require(bytes(_studentName).length > 0, "CertReg: empty student name");
        require(bytes(_course).length > 0,      "CertReg: empty course");
        require(bytes(_ipfsHash).length > 0,    "CertReg: empty IPFS hash");

        certId = keccak256(
            abi.encodePacked(_student, _course, msg.sender, block.timestamp)
        );

        uint256 expiry = _validityDays > 0
            ? block.timestamp + (_validityDays * 1 days)
            : 0;

        certificates[certId] = Certificate({
            studentName:   _studentName,
            course:        _course,
            grade:         _grade,
            ipfsHash:      _ipfsHash,
            issuedAt:      block.timestamp,
            expiresAt:     expiry,
            revoked:       false,
            issuedBy:      msg.sender,
            studentWallet: _student
        });

        studentCerts[_student].push(certId);

        emit CertificateIssued(certId, _student, msg.sender, _course);
    }

    function revokeCertificate(bytes32 _certId) external onlyActiveIssuer {
        Certificate storage cert = certificates[_certId];
        require(cert.issuedAt != 0,       "CertReg: cert does not exist");
        require(cert.issuedBy == msg.sender, "CertReg: not the original issuer");
        require(!cert.revoked,             "CertReg: already revoked");

        cert.revoked = true;
        emit CertificateRevoked(_certId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────
    //  View / verify functions
    // ─────────────────────────────────────────────────────────
    function verifyCertificate(bytes32 _certId)
        external
        view
        returns (bool valid, string memory status, Certificate memory cert)
    {
        cert = certificates[_certId];

        if (cert.issuedAt == 0) {
            return (false, "NOT_FOUND", cert);
        }
        if (cert.revoked) {
            return (false, "REVOKED", cert);
        }
        if (cert.expiresAt != 0 && block.timestamp > cert.expiresAt) {
            return (false, "EXPIRED", cert);
        }
        return (true, "VALID", cert);
    }

    function getStudentCertificates(address _student)
        external
        view
        returns (bytes32[] memory)
    {
        return studentCerts[_student];
    }

    function getCertificate(bytes32 _certId)
        external
        view
        returns (Certificate memory)
    {
        return certificates[_certId];
    }
}
