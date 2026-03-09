import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Privacy Policy - ContinuumAI",
  description:
    "Privacy policy and data protection of ContinuumAI Technologies LLC.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="en" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Privacy <span className="text-accent">Policy</span>
          </h1>

          <div
            className="glass-card"
            style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}
          >
            <div
              className="legal-content"
              style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}
            >
              <p style={{ marginBottom: 16 }}>
                Last updated: March 2026
              </p>

              <p style={{ marginBottom: 16 }}>
                This Privacy Policy describes how ContinuumAI Technologies
                LLC collects, uses, stores, protects and, where applicable,
                shares the personal data of users of the ContinuumAI
                platform. This document forms an integral part of the Terms
                and Conditions of the service.
              </p>

              {/* -- 1. DATA CONTROLLER IDENTIFICATION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. DATA CONTROLLER IDENTIFICATION
              </h3>
              <p style={{ marginBottom: 16 }}>
                The data controller responsible for the processing of
                personal data is:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legal name:</strong> ContinuumAI Technologies LLC
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Jurisdiction:</strong> State of Wyoming, United
                  States of America
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Registered address:</strong> 1021 E Lincolnway 9440,
                  Cheyenne, WY 82001
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Entity type:</strong> Limited Liability Company
                  (LLC)
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI Technologies LLC acts as Data Controller with
                respect to the data necessary for platform and user account
                management, and as Data Processor with respect to the data
                that clients enter into the platform for processing through
                AI services.
              </p>

              {/* -- 2. DATA WE COLLECT -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. DATA WE COLLECT
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI collects the following categories of personal
                data:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Registration data:</strong> name, email address,
                  username, profile picture and account information provided
                  during sign-up.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Usage data:</strong> information about how you
                  interact with the platform, including features used,
                  frequency of access, session duration and user preferences.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Generated content:</strong> texts, prompts,
                  documents, images, audio files and any other content that
                  the user enters into the platform for processing by AI
                  models.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Technical data:</strong> IP address, browser type,
                  operating system, device identifier, cookie data, access
                  logs and platform usage data.
                </li>
              </ul>

              {/* -- 3. PURPOSE OF DATA PROCESSING -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. PURPOSE OF DATA PROCESSING
              </h3>
              <p style={{ marginBottom: 16 }}>
                Personal data is processed for the following purposes:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Service provision:</strong> creation, management
                  and maintenance of user accounts, and provision of platform
                  services including content processing through artificial
                  intelligence models.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Platform improvement:</strong> optimization of the
                  platform, usage analysis, performance monitoring and
                  development of new features.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Security:</strong> fraud prevention, abuse
                  detection and protection against unauthorized activities.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Communications:</strong> service-related
                  notifications, including updates, changes to terms and
                  security alerts.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legal compliance:</strong> fulfillment of legal and
                  regulatory obligations, including billing, accounting and
                  responses to lawful requests.
                </li>
              </ul>

              {/* -- 4. LEGAL BASIS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. LEGAL BASIS
              </h3>
              <p style={{ marginBottom: 16 }}>
                The processing of personal data is based on the following
                legal grounds, as applicable:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Consent:</strong> when the user provides explicit
                  consent for specific processing activities, such as
                  receiving marketing communications.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Contractual performance:</strong> when processing
                  is necessary for the performance of the contract between
                  the user and ContinuumAI, including the provision of
                  platform services.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legitimate interest:</strong> when processing is
                  necessary for the legitimate interests pursued by
                  ContinuumAI, such as platform security, fraud prevention
                  and service improvement, provided these interests do not
                  override the user&apos;s fundamental rights.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legal obligation:</strong> when processing is
                  necessary for compliance with a legal obligation to which
                  ContinuumAI is subject, such as tax and accounting
                  requirements.
                </li>
              </ul>

              {/* -- 5. STORAGE AND SECURITY -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. STORAGE AND SECURITY
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI implements the following measures to ensure the
                security of personal data:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Encryption of data in transit using TLS 1.2 or higher.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Encryption of data at rest using AES-256.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Access controls based on the principle of least privilege.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Multi-factor authentication for access to internal systems.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Continuous system monitoring and intrusion detection.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Periodic security assessments and penetration testing.
                </li>
              </ul>

              {/* -- 6. DATA SHARING WITH THIRD PARTIES -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. DATA SHARING WITH THIRD PARTIES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI may share personal data with third parties only
                in the following circumstances:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Infrastructure providers:</strong> cloud
                  infrastructure services, AI model providers and analytics
                  services necessary for platform operation.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Payment processors:</strong> secure third-party
                  payment gateways for billing and subscription management.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legal obligations:</strong> when required by law,
                  court order or regulatory authority.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI does not sell personal data to third parties.
                All third-party providers are bound by contracts that impose
                data protection obligations equivalent to those contained in
                this Policy.
              </p>

              {/* -- 7. INTERNATIONAL TRANSFERS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. INTERNATIONAL TRANSFERS
              </h3>
              <p style={{ marginBottom: 16 }}>
                Since ContinuumAI Technologies LLC is incorporated in the
                United States, personal data may be transferred and
                processed in US territory. To ensure an adequate level of
                protection, ContinuumAI implements:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Standard Contractual Clauses (SCCs) approved by the
                  European Commission for transfers from the EEA.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Adequacy decisions where available for the relevant
                  jurisdiction.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Any other legally recognized transfer mechanisms applicable
                  in each relevant jurisdiction.
                </li>
              </ul>

              {/* -- 8. USER RIGHTS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                8. USER RIGHTS
              </h3>
              <p style={{ marginBottom: 16 }}>
                In accordance with the GDPR, CCPA and other applicable data
                protection regulations, users have the following rights:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right of access:</strong> obtain confirmation as to
                  whether your personal data is being processed and access a
                  copy thereof.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right to rectification:</strong> request the
                  correction of inaccurate or incomplete personal data.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right to erasure:</strong> request the deletion of
                  your personal data when it is no longer necessary for the
                  purpose for which it was collected.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right to data portability:</strong> receive your
                  personal data in a structured, commonly used and
                  machine-readable format, and transmit it to another
                  controller.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right to object:</strong> object to the processing
                  of your personal data in certain circumstances, including
                  direct marketing.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Right to restriction:</strong> request the
                  restriction of processing of your data in certain
                  circumstances.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                To exercise any of these rights, users may contact
                ContinuumAI through the platform&apos;s support channels.
                Requests will be addressed within a maximum period of 30
                calendar days from receipt.
              </p>

              {/* -- 9. COOKIES AND SIMILAR TECHNOLOGIES -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                9. COOKIES AND SIMILAR TECHNOLOGIES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI uses cookies and similar technologies to improve
                the user experience and the operation of the platform. The
                types of cookies used include:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Essential cookies:</strong> necessary for the basic
                  functioning of the platform, including authentication and
                  security.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Analytics cookies:</strong> used to collect
                  aggregated information about how users interact with the
                  platform, in order to improve its performance and usability.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Functional cookies:</strong> allow the platform to
                  remember user preferences and provide personalized
                  features.
                </li>
              </ul>

              {/* -- 10. DATA RETENTION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                10. DATA RETENTION
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI retains personal data only for the duration of
                the contractual relationship plus any legally required
                retention period. Upon account cancellation or contract
                termination, personal data is securely destroyed within the
                established timeframes, unless its retention is required by
                legal or regulatory obligations.
              </p>
              <p style={{ marginBottom: 16 }}>
                The user may delete their generated content at any time.
                Billing data is retained in accordance with applicable tax
                and accounting obligations (generally between 5 and 10
                years). Security logs are retained for a maximum period of
                12 months for security and incident detection purposes.
              </p>

              {/* -- 11. MINORS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                11. MINORS
              </h3>
              <p style={{ marginBottom: 16 }}>
                The ContinuumAI platform is not intended for use by
                individuals under 18 years of age. ContinuumAI does not
                intentionally collect personal data from minors. If we
                become aware that we have collected personal data from a
                minor without proper parental consent, we will take steps to
                delete such information as promptly as possible.
              </p>
              <p style={{ marginBottom: 16 }}>
                If a parent or guardian becomes aware that their child has
                provided personal data to ContinuumAI, they should contact
                us through the platform&apos;s support channels so that we
                can take the necessary actions.
              </p>

              {/* -- 12. MODIFICATIONS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                12. MODIFICATIONS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI reserves the right to modify this Privacy Policy
                at any time. Modifications shall become effective upon their
                publication on the platform. Users will be notified of
                substantial changes through the registered email address or
                through notices on the platform.
              </p>
              <p style={{ marginBottom: 16 }}>
                Users are advised to periodically review this Privacy Policy
                to stay informed about how ContinuumAI protects their
                personal data.
              </p>
              <p style={{ marginBottom: 16 }}>
                Continued use of the platform after the publication of
                modifications shall constitute acceptance of the updated
                Privacy Policy. If the user does not agree with the
                modifications, they must cease using the platform and
                request the cancellation of their account and the deletion
                of their personal data.
              </p>
              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  If you have questions about this Privacy Policy or wish to
                  exercise your data protection rights, you may contact us
                  through the support channels available on the platform.
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
