import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Enterprise Terms & DPA - ContinuumAI",
  description:
    "Enterprise terms of service and Data Processing Agreement (DPA) for ContinuumAI Technologies LLC.",
};

export default function EnterpriseTermsPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="en" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Enterprise Terms
            <br />& <span className="text-accent">Data Processing Agreement (DPA)</span>
          </h1>

          <div
            className="glass-card"
            style={{
              padding: 40,
              maxWidth: 900,
              margin: "0 auto",
              borderTop: "3px solid var(--accent-primary)",
            }}
          >
            <div
              className="legal-content"
              style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}
            >
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  Legal Document Exclusive to Enterprise Plan Clients -
                  ContinuumAI Technologies LLC
                </strong>
              </p>
              <p style={{ marginBottom: 16 }}>
                Last updated: March 2026
              </p>
              <p style={{ marginBottom: 16 }}>
                This document supplements the general Terms and Conditions
                of ContinuumAI and establishes the specific conditions
                applicable to clients subscribed to the Enterprise Plan,
                including the Data Processing Agreement (DPA) in compliance
                with international data protection regulations.
              </p>

              {/* -- 1. IDENTIFICATION AND LEGAL FRAMEWORK -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. IDENTIFICATION AND LEGAL FRAMEWORK
              </h3>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>Service Provider:</strong>{" "}
                ContinuumAI Technologies LLC, a limited liability company
                incorporated under the laws of the State of Wyoming, United
                States of America, with registered address at 1021 E
                Lincolnway 9440, Cheyenne, WY 82001.
              </p>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>Enterprise Client:</strong>{" "}
                The legal or natural person who has subscribed to the
                ContinuumAI Enterprise Plan and who acts as the Data
                Controller in the context of this DPA.
              </p>
              <p style={{ marginBottom: 16 }}>
                This document is jointly governed by the laws of the State
                of Wyoming and by applicable international regulations on
                data protection, including the General Data Protection
                Regulation (GDPR) of the European Union, the California
                Consumer Privacy Act (CCPA) and any other relevant
                legislation according to the Client&apos;s jurisdiction.
              </p>

              {/* -- 2. DATA PROCESSING AGREEMENT (DPA) -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. DATA PROCESSING AGREEMENT (DPA)
              </h3>
              <p style={{ marginBottom: 16 }}>
                This Data Processing Agreement forms an integral part of the
                Enterprise contract and establishes the obligations of both
                parties in relation to the processing of personal data.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.1 Roles and Responsibilities.</strong>{" "}
                For the purposes of this DPA, the Client acts as the Data
                Controller and ContinuumAI Technologies LLC acts as the Data
                Processor. ContinuumAI shall process personal data only in
                accordance with the Client&apos;s documented instructions
                and for the provision of the contracted services.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.2 Purpose and Scope of Processing.</strong>{" "}
                ContinuumAI shall process the Client&apos;s personal data
                exclusively for: (a) the provision of the contracted
                Enterprise platform services; (b) the maintenance and
                improvement of service security and performance; (c)
                compliance with applicable legal obligations; and (d) any
                other purpose expressly authorized by the Client through
                written instructions.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.3 Security Measures.</strong>{" "}
                ContinuumAI shall implement and maintain appropriate
                technical and organizational measures to protect personal
                data against unauthorized or unlawful processing, and
                against accidental loss, destruction or damage. These
                measures include, among others:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Encryption of data in transit (TLS 1.2 or higher) and at
                  rest (AES-256).
                </li>
                <li style={{ marginBottom: 8 }}>
                  Role-based access controls with multi-factor
                  authentication (MFA).
                </li>
                <li style={{ marginBottom: 8 }}>
                  Logical data isolation between Enterprise clients.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Audit logs and continuous access monitoring.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Periodic vulnerability assessments and penetration testing.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Incident response and business continuity plans.
                </li>
              </ul>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>2.4 Sub-processors.</strong>{" "}
                ContinuumAI may engage sub-processors for the processing of
                personal data, provided that: (a) the Client is notified at
                least 30 days in advance before incorporating a new
                sub-processor; (b) contracts are formalized with
                sub-processors that offer guarantees equivalent to those
                contained in this DPA; and (c) ContinuumAI remains fully
                liable to the Client for the actions of its sub-processors.
              </p>

              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  2.5 International Data Transfers.
                </strong>{" "}
                In cases where data processing involves international
                transfers outside the European Economic Area (EEA) or
                jurisdictions with equivalent regulations, ContinuumAI shall
                ensure the existence of adequate transfer mechanisms, such as
                Standard Contractual Clauses approved by the European
                Commission, adequacy decisions or any other legally
                recognized mechanism.
              </p>

              {/* -- 3. SERVICE LEVELS AND SUPPORT (SLA) -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. SERVICE LEVELS AND SUPPORT (SLA)
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI commits to maintaining a minimum service
                availability of 99.9% monthly, calculated as the percentage
                of minutes during which the platform is operational and
                accessible during the billing period, excluding previously
                communicated scheduled maintenance windows.
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Critical incidents (P1):</strong> maximum response
                  time of 1 hour. Target resolution in 4 hours. Service
                  completely inaccessible or data loss.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Major incidents (P2):</strong> maximum response
                  time of 4 hours. Target resolution in 24 hours.
                  Significantly degraded functionality.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Minor incidents (P3):</strong> maximum response
                  time of 24 hours. Target resolution in 72 hours. Issues
                  that do not affect critical operations.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>General requests (P4):</strong> maximum response
                  time of 48 hours. Queries, information requests and
                  improvements.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                In the event of SLA non-compliance, the Client may request
                service credits proportional to the excess downtime, in
                accordance with the compensation table established in the
                Enterprise contract.
              </p>

              {/* -- 4. DATA RETENTION AND DESTRUCTION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. DATA RETENTION AND DESTRUCTION
              </h3>
              <p style={{ marginBottom: 16 }}>
                Upon termination of the Enterprise contractual relationship,
                ContinuumAI shall proceed, at the Client&apos;s election,
                to: (a) return all of the Client&apos;s personal data in a
                structured, commonly used and machine-readable format; or
                (b) securely and irreversibly destroy all personal data
                within a maximum period of 30 calendar days after contract
                termination.
              </p>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI shall issue a data destruction certificate when
                requested by the Client. Data whose retention is required by
                legal or regulatory obligations is exempt from the
                destruction obligation and shall be maintained in an
                isolated and protected manner exclusively for said purpose.
              </p>

              {/* -- 5. AUDIT RIGHTS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. AUDIT RIGHTS
              </h3>
              <p style={{ marginBottom: 16 }}>
                The Enterprise Client shall have the right to conduct or
                commission audits to verify compliance with the obligations
                established in this document and in the DPA, subject to the
                following conditions:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Audits shall be conducted with a minimum notice period of
                  30 calendar days.
                </li>
                <li style={{ marginBottom: 8 }}>
                  They shall be limited to the scope of the Client&apos;s
                  data processing and shall not interfere with the operations
                  of other clients.
                </li>
                <li style={{ marginBottom: 8 }}>
                  The auditor must sign a confidentiality agreement before
                  the audit begins.
                </li>
                <li style={{ marginBottom: 8 }}>
                  ContinuumAI shall provide reasonable access to
                  documentation, facilities and relevant personnel.
                </li>
                <li style={{ marginBottom: 8 }}>
                  A maximum of one audit per calendar year is permitted,
                  unless a security incident or regulatory requirement
                  justifies additional audits.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI shall make available to the Client compliance
                reports, security certifications and results of independent
                audits conducted by accredited third parties.
              </p>

              {/* -- 6. ADDITIONAL INDEMNIFICATIONS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. ADDITIONAL INDEMNIFICATIONS
              </h3>
              <p style={{ marginBottom: 16 }}>
                In addition to the indemnifications provided in the general
                Terms and Conditions, ContinuumAI shall indemnify the
                Enterprise Client against any claim, penalty, fine or direct
                damage resulting from: (a) a demonstrable breach of DPA
                obligations by ContinuumAI; (b) a security breach caused by
                ContinuumAI&apos;s negligence in implementing the committed
                security measures; or (c) the processing of personal data
                outside the scope of the Client&apos;s documented
                instructions.
              </p>
              <p style={{ marginBottom: 16 }}>
                The total cumulative liability of ContinuumAI under this
                indemnification clause shall not exceed the total amount paid
                by the Client for Enterprise services during the 12 months
                preceding the event that gave rise to the claim, except in
                cases of willful misconduct or gross negligence.
              </p>

              {/* -- 7. TERMINATION, LEGAL COMPLIANCE AND GOVERNING LAW -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. TERMINATION, LEGAL COMPLIANCE AND GOVERNING LAW
              </h3>
              <p style={{ marginBottom: 16 }}>
                The Enterprise contract may be terminated by either party
                with a minimum notice period of 90 calendar days. In the
                event of material breach by either party, the affected party
                may terminate the contract with immediate effect if the
                breach is not remedied within 30 days of written
                notification.
              </p>
              <p style={{ marginBottom: 16 }}>
                Both parties commit to complying with all applicable laws
                and regulations in connection with the provision and use of
                Enterprise services, including but not limited to data
                protection, technology export and anti-corruption
                regulations.
              </p>
              <p style={{ marginBottom: 16 }}>
                This document shall be governed by and construed in
                accordance with the laws of the State of Wyoming, United
                States of America. Any dispute shall be submitted to the
                exclusive jurisdiction of the courts of the State of
                Wyoming, without prejudice to the right of the parties to
                resort to arbitration mechanisms in accordance with the
                rules of the American Arbitration Association (AAA).
              </p>
              <p style={{ marginBottom: 16 }}>
                The provisions of the DPA that by their nature should
                survive the termination of the contract, including those
                relating to confidentiality, data retention and destruction,
                indemnification and limitation of liability, shall remain in
                effect after the conclusion of the contractual relationship.
              </p>
              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  For inquiries related to the Enterprise Plan or the DPA,
                  please contact our dedicated team through the Enterprise
                  support channels available on the platform.
                </em>
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lang="en" />
    </>
  );
}
