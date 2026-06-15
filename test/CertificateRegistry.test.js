const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("CertificateRegistry", function () {
  let registry, admin, issuer, student, other;

  beforeEach(async function () {
    [admin, issuer, student, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("sets deployer as admin", async function () {
    expect(await registry.admin()).to.equal(admin.address);
  });

  describe("Issuer management", function () {
    it("admin can add an issuer", async function () {
      await registry.addIssuer(issuer.address, "MIT");
      const data = await registry.issuers(issuer.address);
      expect(data.active).to.be.true;
      expect(data.institutionName).to.equal("MIT");
    });

    it("non-admin cannot add issuer", async function () {
      await expect(registry.connect(other).addIssuer(issuer.address, "XYZ"))
        .to.be.revertedWith("CertReg: not admin");
    });

    it("admin can revoke an issuer", async function () {
      await registry.addIssuer(issuer.address, "MIT");
      await registry.revokeIssuer(issuer.address);
      const data = await registry.issuers(issuer.address);
      expect(data.active).to.be.false;
    });
  });

  describe("Certificate issuance", function () {
    beforeEach(async function () {
      await registry.addIssuer(issuer.address, "MIT");
    });

    it("authorized issuer can issue a certificate", async function () {
      const tx = await registry.connect(issuer).issueCertificate(
        student.address, "Alice", "B.Tech CS", "A+", "QmTestHash", 365
      );
      const receipt = await tx.wait();
      const event   = receipt.logs.find(l => l.fragment?.name === "CertificateIssued");
      expect(event).to.not.be.undefined;
    });

    it("unauthorized address cannot issue certificate", async function () {
      await expect(
        registry.connect(other).issueCertificate(student.address, "Bob", "MBA", "B", "QmHash", 0)
      ).to.be.revertedWith("CertReg: not an authorized issuer");
    });

    it("verify returns VALID for a fresh certificate", async function () {
      const tx      = await registry.connect(issuer).issueCertificate(student.address, "Alice", "B.Tech CS", "A+", "QmHash", 365);
      const receipt = await tx.wait();
      const event   = receipt.logs.find(l => l.fragment?.name === "CertificateIssued");
      const certId  = event.args[0];

      const [valid, status] = await registry.verifyCertificate(certId);
      expect(valid).to.be.true;
      expect(status).to.equal("VALID");
    });

    it("verify returns REVOKED after revocation", async function () {
      const tx      = await registry.connect(issuer).issueCertificate(student.address, "Alice", "B.Tech CS", "A+", "QmHash", 365);
      const receipt = await tx.wait();
      const certId  = receipt.logs.find(l => l.fragment?.name === "CertificateIssued").args[0];

      await registry.connect(issuer).revokeCertificate(certId);
      const [valid, status] = await registry.verifyCertificate(certId);
      expect(valid).to.be.false;
      expect(status).to.equal("REVOKED");
    });

    it("getStudentCertificates returns correct certs", async function () {
      await registry.connect(issuer).issueCertificate(student.address, "Alice", "B.Tech", "A", "QmA", 0);
      await registry.connect(issuer).issueCertificate(student.address, "Alice", "MBA", "B+", "QmB", 0);
      const certs = await registry.getStudentCertificates(student.address);
      expect(certs.length).to.equal(2);
    });
  });
});
