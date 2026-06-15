import { ethers } from "ethers";

// Paste your compiled ABI here after running: npx hardhat compile
// Then copy from artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json
export const CONTRACT_ABI = [
  "function addIssuer(address _issuer, string calldata _institutionName) external",
  "function revokeIssuer(address _issuer) external",
  "function issueCertificate(address _student, string calldata _studentName, string calldata _course, string calldata _grade, string calldata _ipfsHash, uint256 _validityDays) external returns (bytes32)",
  "function revokeCertificate(bytes32 _certId) external",
  "function verifyCertificate(bytes32 _certId) external view returns (bool valid, string memory status, tuple(string studentName, string course, string grade, string ipfsHash, uint256 issuedAt, uint256 expiresAt, bool revoked, address issuedBy, address studentWallet) cert)",
  "function getStudentCertificates(address _student) external view returns (bytes32[])",
  "function getCertificate(bytes32 _certId) external view returns (tuple(string studentName, string course, string grade, string ipfsHash, uint256 issuedAt, uint256 expiresAt, bool revoked, address issuedBy, address studentWallet))",
  "function issuers(address) external view returns (string institutionName, bool active)",
  "event CertificateIssued(bytes32 indexed certId, address indexed student, address indexed issuer, string course)",
  "event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy)",
];

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export async function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install it.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function getContract(withSigner = false) {
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  const provider = await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function connectWallet(): Promise<string> {
  const signer = await getSigner();
  return signer.getAddress();
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) * 1000 : ts * 1000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}
