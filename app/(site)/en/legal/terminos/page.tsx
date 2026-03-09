import { SiteHeader, SiteFooter, BgMesh } from "@/components/site";

export const metadata = {
  title: "Terms and Conditions - ContinuumAI",
  description:
    "Terms and conditions of use for the ContinuumAI Technologies LLC platform.",
};

export default function TermsPage() {
  return (
    <>
      <BgMesh orbs={2} />
      <SiteHeader lang="en" />

      <section className="section-padding">
        <div className="container reveal">
          <h1 className="section-title">
            Terms and <span className="text-accent">Conditions</span>
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
                These Terms and Conditions (hereinafter, the
                &quot;Terms&quot;) govern the access and use of the
                ContinuumAI platform and all associated services offered
                through it. By accessing, registering or using any
                functionality of ContinuumAI, the user fully and
                unreservedly accepts these Terms.
              </p>

              {/* -- 1. LEGAL IDENTIFICATION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                1. LEGAL IDENTIFICATION
              </h3>
              <p style={{ marginBottom: 16 }}>
                The ContinuumAI platform is owned and operated by:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Legal name:</strong> ContinuumAI Technologies LLC
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Jurisdiction of incorporation:</strong> State of
                  Wyoming, United States of America
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

              {/* -- 2. ACCEPTANCE OF TERMS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                2. ACCEPTANCE OF TERMS
              </h3>
              <p style={{ marginBottom: 16 }}>
                By creating an account, accessing the platform or using any
                of ContinuumAI&apos;s services, the user declares to have
                read, understood and accepted these Terms in their entirety.
                If the user does not agree with any of the provisions
                contained herein, they must refrain from using the platform.
              </p>
              <p style={{ marginBottom: 16 }}>
                Continued use of the platform after the publication of
                modifications to these Terms shall constitute tacit
                acceptance of such modifications.
              </p>

              {/* -- 3. NATURE OF SERVICE -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                3. NATURE OF SERVICE
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI is an artificial intelligence platform that
                offers multiple tools integrated into a single digital
                environment. The services include, but are not limited to:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  <strong>Intelligent conversation:</strong> chat with
                  continuous reasoning and persistent context.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Image generation:</strong> creation of visual
                  content using generative AI models.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Video generation:</strong> AI-assisted production of
                  clips and audiovisual content.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Audio generation:</strong> voiceovers, narrations
                  and synthetic voice production.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Document analysis:</strong> reading, key information
                  extraction, summarization and file comparison.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>AI characters:</strong> creation and customization
                  of virtual assistants with defined personality and context.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Gallery:</strong> repository of generated content
                  accessible to the user.
                </li>
                <li style={{ marginBottom: 8 }}>
                  <strong>Additional tools:</strong> web analyzer,
                  integrations and complementary functionalities incorporated
                  into the platform.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI reserves the right to modify, expand or
                discontinue any of these services at any time, with or
                without prior notice.
              </p>

              {/* -- 4. CONTRACTUAL RELATIONSHIP -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                4. CONTRACTUAL RELATIONSHIP
              </h3>
              <p style={{ marginBottom: 16 }}>
                Use of ContinuumAI does not create between the user and
                ContinuumAI Technologies LLC any employment, agency,
                partnership, joint venture or representation relationship.
                The user acts independently and under their own
                responsibility.
              </p>
              <p style={{ marginBottom: 16 }}>
                The relationship between the parties is limited exclusively
                to the provision and use of the services described in these
                Terms, under the conditions stipulated herein.
              </p>

              {/* -- 5. LEGAL STRUCTURE AND LIMITATION OF LIABILITY -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                5. LEGAL STRUCTURE AND LIMITATION OF LIABILITY
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI Technologies LLC is a limited liability company
                incorporated under the laws of the State of Wyoming. The
                liability of its members is limited to their participation
                in the company, as established in the Wyoming Limited
                Liability Company Act.
              </p>
              <p style={{ marginBottom: 16 }}>
                To the maximum extent permitted by applicable law,
                ContinuumAI Technologies LLC, its members, directors,
                employees, agents and suppliers shall not be liable for
                indirect, incidental, special, consequential or punitive
                damages, including but not limited to loss of profits, data,
                use, goodwill or other intangible losses, arising from the
                use or inability to use the platform.
              </p>

              {/* -- 6. PERMITTED USE AND RESTRICTIONS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                6. PERMITTED USE AND RESTRICTIONS
              </h3>
              <p style={{ marginBottom: 16 }}>
                The user agrees to use the platform in a lawful, ethical
                manner and in accordance with these Terms. The following is
                strictly prohibited:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  Using the platform for illegal activities or activities
                  contrary to applicable law.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Using the services for fraudulent, deceptive purposes or
                  purposes that seek to harm third parties.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Generating, distributing or storing explicit, pornographic
                  or sexually suggestive content involving minors or that
                  violates the dignity of individuals.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Creating content that promotes, incites or glorifies
                  violence, hatred, discrimination or terrorism.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Attempting to reverse engineer, decompile, disassemble or
                  decrypt the source code, algorithms or underlying models of
                  the platform.
                </li>
                <li style={{ marginBottom: 8 }}>
                  Interfering with the security, integrity or performance of
                  the platform or its associated systems.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI reserves the right to immediately suspend or
                cancel without prior notice the account of any user who
                violates these restrictions.
              </p>

              {/* -- 7. AI-GENERATED CONTENT -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                7. AI-GENERATED CONTENT
              </h3>
              <p style={{ marginBottom: 16 }}>
                The user acknowledges and accepts that content generated by
                ContinuumAI&apos;s artificial intelligence models is
                produced automatically. ContinuumAI does not guarantee:
              </p>
              <ul style={{ paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>
                  The accuracy, truthfulness, precision or completeness of
                  the generated information.
                </li>
                <li style={{ marginBottom: 8 }}>
                  The absolute originality of the produced content or the
                  absence of similarities with pre-existing works.
                </li>
                <li style={{ marginBottom: 8 }}>
                  The absence of errors, biases, inaccuracies or
                  inappropriate content in the generated responses.
                </li>
              </ul>
              <p style={{ marginBottom: 16 }}>
                The user is solely responsible for verifying, reviewing and
                validating any generated content before its use, publication
                or distribution. ContinuumAI assumes no responsibility for
                decisions made based on content generated by the platform.
              </p>

              {/* -- 8. INTELLECTUAL PROPERTY -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                8. INTELLECTUAL PROPERTY
              </h3>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  8.1 Platform Ownership.
                </strong>{" "}
                All intellectual and industrial property rights over the
                ContinuumAI platform, including but not limited to software,
                source code, algorithms, AI models, design, user interface,
                trademarks, logos, trade names and documentation, belong
                exclusively to ContinuumAI Technologies LLC or its
                licensors. No ownership rights over these elements are
                transferred to the user by virtue of these Terms.
              </p>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: "#fff" }}>
                  8.2 User Content.
                </strong>{" "}
                The user retains all intellectual property rights over the
                content they enter into the platform (texts, images,
                documents, etc.). By using the platform, the user grants
                ContinuumAI a limited, non-exclusive and revocable license
                to process said content solely for the purpose of providing
                the requested services.
              </p>

              {/* -- 9. DATA PROTECTION AND CONFIDENTIALITY -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                9. DATA PROTECTION AND CONFIDENTIALITY
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI is committed to protecting the privacy and
                personal data of its users in accordance with applicable data
                protection laws, including the General Data Protection
                Regulation (GDPR) of the European Union and the California
                Consumer Privacy Act (CCPA), to the extent applicable.
              </p>
              <p style={{ marginBottom: 16 }}>
                The processing of personal data is governed by our Privacy
                Policy, which forms an integral part of these Terms. By
                accepting these Terms, the user declares to have read and
                accepted the Privacy Policy.
              </p>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI implements appropriate technical and
                organizational measures to protect personal data against
                unauthorized access, alteration, disclosure or destruction.
              </p>

              {/* -- 10. THIRD-PARTY SERVICES -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                10. THIRD-PARTY SERVICES
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI may integrate or use services, APIs or
                artificial intelligence models provided by third parties to
                deliver its functionalities. ContinuumAI is not responsible
                for the privacy policies, terms of service or practices of
                such third parties.
              </p>
              <p style={{ marginBottom: 16 }}>
                The user acknowledges that certain data may be processed by
                external providers in accordance with their own terms and
                conditions. ContinuumAI is committed to selecting providers
                that offer adequate security and data protection guarantees.
              </p>

              {/* -- 11. PLANS, BILLING AND PAYMENTS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                11. PLANS, BILLING AND PAYMENTS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI offers different subscription plans, each with
                specific features, usage limits and pricing. The details of
                each plan are available on the platform and may be modified
                by ContinuumAI with prior notice.
              </p>
              <p style={{ marginBottom: 16 }}>
                Payments are processed through secure third-party payment
                gateways. ContinuumAI does not directly store credit card
                information or financial data of the user. Subscriptions are
                automatically renewed at the end of each billing period,
                unless the user cancels before the renewal date.
              </p>
              <p style={{ marginBottom: 16 }}>
                Refunds will be handled in accordance with the applicable
                refund policy and consumer protection laws.
              </p>

              {/* -- 12. TERMINATION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                12. TERMINATION
              </h3>
              <p style={{ marginBottom: 16 }}>
                The user may cancel their account and stop using the
                platform at any time. ContinuumAI reserves the right to
                suspend or cancel the user&apos;s account in case of breach
                of these Terms, without prejudice to any legal actions that
                may apply.
              </p>
              <p style={{ marginBottom: 16 }}>
                Upon termination, ContinuumAI may delete the user&apos;s
                data in accordance with its data retention policy and
                applicable legal obligations. Provisions that by their nature
                should survive termination (including intellectual property,
                limitation of liability and indemnification) shall remain in
                effect.
              </p>

              {/* -- 13. INDEMNIFICATION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                13. INDEMNIFICATION
              </h3>
              <p style={{ marginBottom: 16 }}>
                The user agrees to indemnify, defend and hold harmless
                ContinuumAI Technologies LLC, its members, directors,
                employees, agents and suppliers against any claim, demand,
                damage, loss, liability, cost or expense (including
                reasonable attorney fees) arising from or related to: (a) the
                user&apos;s use of the platform; (b) breach of these Terms;
                (c) violation of third-party rights; or (d) content
                generated, published or distributed by the user through the
                platform.
              </p>

              {/* -- 14. GOVERNING LAW AND JURISDICTION -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                14. GOVERNING LAW AND JURISDICTION
              </h3>
              <p style={{ marginBottom: 16 }}>
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Wyoming, United States of
                America, without regard to its conflict of laws provisions.
              </p>
              <p style={{ marginBottom: 16 }}>
                Any controversy, dispute or claim arising from or related to
                these Terms shall be submitted to the exclusive jurisdiction
                of the competent courts of the State of Wyoming. The parties
                waive any other venue that may correspond to them by reason
                of their present or future domicile.
              </p>

              {/* -- 15. MODIFICATIONS -- */}
              <h3
                style={{
                  color: "#fff",
                  marginBottom: 16,
                  marginTop: 32,
                  fontSize: 20,
                }}
              >
                15. MODIFICATIONS
              </h3>
              <p style={{ marginBottom: 16 }}>
                ContinuumAI reserves the right to modify these Terms at any
                time. Modifications shall become effective upon their
                publication on the platform. Users will be notified of
                substantial changes through the communication channels
                available on the platform.
              </p>
              <p style={{ marginBottom: 16 }}>
                Continued use of the platform after the publication of
                modifications shall constitute acceptance of the updated
                Terms. If the user does not agree with the modifications,
                they must cease using the platform and request the
                cancellation of their account.
              </p>
              <p style={{ marginBottom: 16, marginTop: 32 }}>
                <em>
                  If you have questions about these Terms and Conditions, you
                  may contact us through the support channels available on
                  the platform.
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
