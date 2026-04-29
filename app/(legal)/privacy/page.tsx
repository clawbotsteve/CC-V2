export const metadata = {
  title: "Privacy Policy · TraviaLabs",
  description: "TraviaLabs Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-zinc-400">Last updated: April 29, 2026</p>

      <div className="my-6 rounded-md border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-200">
        <strong>Notice:</strong> this policy is provided as a starting point and
        has not yet been reviewed by counsel. It will be updated; please check
        back periodically.
      </div>

      <h2>1. Who we are</h2>
      <p>
        TraviaLabs (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates the website at
        taviralabsai.com and the AI image and video generation service
        accessible there (the &quot;Service&quot;). This Privacy Policy explains what
        information we collect, how we use it, and the choices you have.
      </p>

      <h2>2. What we collect</h2>
      <h3>Account information</h3>
      <p>
        When you sign up, our identity provider (Clerk) creates an account and
        relays your email, name, and profile photo (if provided) to us. We
        store a corresponding user record in our database.
      </p>
      <h3>Content you submit</h3>
      <p>
        We process the prompts, reference images, video files, and other inputs
        you submit, and we store the resulting outputs (images, videos, text)
        associated with your account. We retain a moderation record of every
        prompt you submit, including any flags from our content-safety
        pipeline.
      </p>
      <h3>Usage information</h3>
      <p>
        We log basic usage events (page views, generation jobs, credit
        deductions, errors) to operate the Service, debug issues, and bill
        accurately.
      </p>
      <h3>Payment information</h3>
      <p>
        Payments are processed by Stripe. We do not receive or store your full
        card number. We do receive a customer ID, the last four digits, card
        brand, and billing-zip information needed to manage your subscription.
      </p>
      <h3>Device and connection data</h3>
      <p>
        We log IP address, user-agent, and approximate location derived from IP
        for security, fraud prevention, and abuse investigation.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>To provide the Service and fulfill your generation requests</li>
        <li>To bill you and manage subscriptions</li>
        <li>To communicate with you about your account and the Service</li>
        <li>
          To enforce our <a href="/terms">Terms</a> and{" "}
          <a href="/aup">Acceptable Use Policy</a>, including by reviewing
          flagged content and responding to abuse reports
        </li>
        <li>To improve the Service, including its safety and reliability</li>
        <li>To comply with law and respond to legal process</li>
      </ul>

      <h2>4. Service providers (sub-processors)</h2>
      <p>
        We share information with the following providers strictly to operate
        the Service:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication and identity
        </li>
        <li>
          <strong>Stripe</strong> — payments and subscription management
        </li>
        <li>
          <strong>Supabase</strong> — application database and storage
        </li>
        <li>
          <strong>Railway</strong> — application hosting
        </li>
        <li>
          <strong>Fal, OpenAI, Higgsfield, Replicate</strong> — AI model
          inference. Your prompts and reference media are sent to these
          providers to generate outputs.
        </li>
      </ul>
      <p>
        Each provider has its own privacy practices. We select providers that
        we believe maintain appropriate safeguards.
      </p>

      <h2>5. Generative AI specifics</h2>
      <p>
        Your prompts and any reference images are transmitted to one or more
        third-party model providers solely to produce the Outputs you request.
        We do not, and we do not authorize our providers to, use your prompts
        or Outputs to train their models. If a provider&apos;s policy changes in a
        way that affects this, we will update this policy and notify you.
      </p>

      <h2>6. Cookies and similar technologies</h2>
      <p>
        We use a small number of essential cookies (session, CSRF, affiliate
        attribution). We do not use advertising or cross-site tracking cookies.
      </p>

      <h2>7. Data retention</h2>
      <ul>
        <li>Account records: retained while your account is active.</li>
        <li>
          Generated content (images, videos): retained while your account is
          active and for 30 days after deletion to allow recovery.
        </li>
        <li>
          Moderation logs: retained for 12 months for abuse investigation, then
          deleted.
        </li>
        <li>Billing records: retained as required by law (typically 7 years).</li>
      </ul>

      <h2>8. Your choices and rights</h2>
      <p>
        Residents of California (CCPA/CPRA) and other US states with comparable
        privacy laws have the right to:
      </p>
      <ul>
        <li>Request a copy of the personal information we hold about them</li>
        <li>Request correction or deletion of personal information</li>
        <li>Opt out of certain uses (we do not sell personal information)</li>
        <li>
          Be free from retaliation for exercising any of the above rights
        </li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>{" "}
        from the email associated with your account. We will respond within
        the period required by applicable law.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard safeguards including encryption in transit
        (TLS), encryption at rest where supported by our providers, role-based
        access controls, and security review. No system is perfectly secure;
        you use the Service at your own risk.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is for users 18 and older. We do not knowingly collect
        information from children under 18. If you believe a child has provided
        us with information, contact{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>{" "}
        and we will delete it.
      </p>

      <h2>11. International users</h2>
      <p>
        The Service is currently offered only to users in the United States.
        Information is processed in the United States. If you access the
        Service from outside the US in violation of our Terms, you do so at
        your own risk and your information may be transferred to and processed
        in the US.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy. Material changes will be communicated via
        email or in-product notice. The &quot;Last updated&quot; date above reflects
        the most recent revision.
      </p>

      <h2>13. Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>
      </p>
    </>
  );
}
