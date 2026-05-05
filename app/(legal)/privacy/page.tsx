export const metadata = {
  title: "Privacy Policy · TraviaLabs",
  description: "TraviaLabs Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-zinc-400">Last updated: May 4, 2026</p>

      <div className="my-6 rounded-md border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-200">
        <strong>Notice:</strong> this policy describes our standard data
        practices and the rights afforded to US residents. It has not yet
        been reviewed by counsel licensed in your jurisdiction. It will be
        updated; please check back periodically.
      </div>

      <h2>1. Who we are</h2>
      <p>
        TraviaLabs (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates the website at
        taviralabsai.com and the AI image and video generation service
        accessible there (the &quot;Service&quot;). This Privacy Policy explains
        what information we collect, how we use and share it, and the
        choices you have. It applies to your use of the Service. It does
        not apply to third-party websites or services that may link to or
        from the Service.
      </p>

      <h2>2. Information we collect</h2>

      <h3>2.1 Information you provide</h3>
      <p>
        <strong>Account information.</strong> When you sign up, our
        identity provider (Clerk) creates an account and relays your email
        address, name, and profile photo (if provided) to us.
      </p>
      <p>
        <strong>Content you submit.</strong> We process the prompts,
        reference images, video files, and other inputs you submit
        (&quot;Inputs&quot;) and store the resulting outputs (images, videos,
        text — &quot;Outputs&quot;) associated with your account. We also retain
        a moderation record of each prompt and any flags from our content-
        safety pipeline, including the model classification result.
      </p>
      <p>
        <strong>Communications.</strong> If you email us (support, privacy,
        or abuse) or submit a support ticket, we receive your email
        address, message contents, and any attachments.
      </p>
      <p>
        <strong>Likeness consent attestations.</strong> When you use a
        feature that produces or modifies a person&apos;s likeness (avatar
        training, face swap), we retain a record of the consent attestation
        you provide (timestamp, version of the consent text, and which
        boxes were checked) for audit purposes.
      </p>

      <h3>2.2 Information collected automatically</h3>
      <p>
        <strong>Usage data.</strong> We log generation jobs, feature
        interactions, credit deductions, and errors to operate, debug, and
        bill the Service.
      </p>
      <p>
        <strong>Device and connection data.</strong> We log your IP
        address, user-agent string, browser, operating system, and an
        approximate location (country and region only — derived from IP)
        for security, fraud prevention, abuse investigation, and basic
        analytics. We do not log precise GPS or street-level location.
      </p>
      <p>
        <strong>Cookies.</strong> See Section 6 below for an itemized list.
      </p>

      <h3>2.3 Payment information</h3>
      <p>
        Payments are processed by Stripe. We do not receive or store your
        full card number, security code, or expiration date. Stripe
        provides us a customer ID, the last four digits of your card, the
        card brand, and the billing zip we need to manage your
        subscription. Refunds and disputes are handled through Stripe.
      </p>

      <h3>2.4 What we do NOT collect</h3>
      <p>
        We do not knowingly collect: precise geolocation, biometric
        identifiers (other than face data you voluntarily upload as part
        of a generation request, which we treat under Section 5), genetic
        data, financial account numbers other than as described in
        Section 2.3, or government identification numbers. We do not show
        third-party advertising and do not engage in cross-site
        behavioral tracking.
      </p>

      <h2>3. Categories of personal information (CCPA / CPRA)</h2>
      <p>
        For California residents, the categories of personal information
        we may collect, the sources, the purposes, and the categories of
        third parties to whom we disclose them are summarized below.
      </p>
      <ul>
        <li>
          <strong>Identifiers</strong> (name, email, account ID, IP). Source:
          you, Clerk. Purpose: provide the Service, billing, security.
          Disclosed to: Clerk, Stripe, Supabase, Railway.
        </li>
        <li>
          <strong>Customer records</strong> (billing zip, last 4 of card via
          Stripe). Source: Stripe. Purpose: billing. Disclosed to: Stripe.
        </li>
        <li>
          <strong>Commercial information</strong> (subscription tier, credit
          balance, transaction history). Source: you, Stripe. Purpose:
          billing, plan management. Disclosed to: Stripe.
        </li>
        <li>
          <strong>Internet/network activity</strong> (usage events, IP-derived
          country, user-agent). Source: your interaction with the Service.
          Purpose: provide the Service, security, fraud prevention, basic
          analytics. Disclosed to: Supabase, Railway.
        </li>
        <li>
          <strong>Audio/visual information</strong> (reference images, video
          files, generated Outputs). Source: you. Purpose: fulfill your
          generation requests. Disclosed to: Fal, OpenAI, Higgsfield, and
          other model providers identified in Section 4 (only as needed to
          produce your Output).
        </li>
        <li>
          <strong>Inferences</strong> (content moderation flags, abuse
          signals). Source: our automated systems. Purpose: enforce the
          AUP, protect the Service, comply with law. Disclosed to: limited
          internal staff and law enforcement upon valid request.
        </li>
      </ul>
      <p>
        <strong>We do not &quot;sell&quot; or &quot;share&quot; personal
        information</strong> as those terms are defined under the California
        Consumer Privacy Act (CCPA) and California Privacy Rights Act
        (CPRA). We do not exchange personal information for monetary or
        other valuable consideration, and we do not share personal
        information for cross-context behavioral advertising. There is no
        &quot;Do Not Sell or Share My Personal Information&quot; link
        because there is nothing to opt out of.
      </p>

      <h2>4. Service providers (sub-processors)</h2>
      <p>
        We share information with the following providers strictly to
        operate the Service. Each is contractually limited to using your
        information to provide services to us.
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication, identity, session
          management.
        </li>
        <li>
          <strong>Stripe</strong> — payments and subscription management.
        </li>
        <li>
          <strong>Supabase</strong> — application database and file
          storage. Data is stored in the United States.
        </li>
        <li>
          <strong>Railway</strong> — application hosting and server-side
          logs.
        </li>
        <li>
          <strong>Fal, OpenAI, Higgsfield, Replicate</strong> — AI model
          inference. Your prompts and reference media are sent to these
          providers solely to produce the Output you request. These
          providers may operate infrastructure outside the United States;
          your Inputs may transit international borders during inference.
        </li>
      </ul>
      <p>
        Each provider has its own privacy practices. We select providers we
        believe maintain appropriate safeguards.
      </p>

      <h2>5. Generative AI specifics</h2>
      <p>
        Your prompts and any reference images are transmitted to one or
        more model providers solely to produce the Outputs you request. We
        do not, and we do not authorize our providers to, use your prompts
        or Outputs to train their general-purpose models. If a provider&apos;s
        policy changes in a way that affects this commitment, we will
        update this policy and notify users.
      </p>
      <p>
        We use automated tools (including OpenAI&apos;s moderation API and our
        own classifiers) to detect prompts and uploads that violate our
        Acceptable Use Policy. Decisions made by these tools (such as
        blocking a request, flagging an account, or removing content) are
        automated. You may contest a moderation decision by writing to{" "}
        <a href="mailto:support@taviralabsai.com">support@taviralabsai.com</a>{" "}
        and we will review.
      </p>

      <h2>6. Cookies and similar technologies</h2>
      <p>We use the following cookies, all of which are essential:</p>
      <ul>
        <li>
          <strong>Session cookies</strong> set by Clerk to keep you signed
          in. Duration: session / Clerk default. Purpose: authentication.
        </li>
        <li>
          <strong>CSRF tokens</strong> set by our application framework.
          Purpose: security.
        </li>
        <li>
          <strong>Affiliate attribution cookie</strong> (<code>affiliate_code</code>).
          Set when a visitor arrives via an affiliate link. Duration: 90
          days. Purpose: attributing your eventual signup to the referring
          partner so they can be credited a commission.
        </li>
      </ul>
      <p>
        We do not use advertising cookies, retargeting pixels, or third-
        party analytics that track you across sites. You can disable
        cookies in your browser, but parts of the Service (especially
        sign-in) will not work without them.
      </p>

      <h2>7. How long we keep information</h2>
      <ul>
        <li>
          <strong>Account records</strong> — retained while your account is
          active, plus 30 days after account closure for audit and
          recovery.
        </li>
        <li>
          <strong>Generated content (Inputs and Outputs)</strong> — retained
          while your account is active. On account deletion, generated
          media is removed from active storage within 30 days.
        </li>
        <li>
          <strong>Moderation logs</strong> — retained for 12 months for
          abuse investigation, then deleted.
        </li>
        <li>
          <strong>Likeness consent records</strong> — retained for the
          life of the related avatar / generation, plus 7 years after, for
          audit and to defend against claims.
        </li>
        <li>
          <strong>Server logs (including IP)</strong> — retained for up to
          90 days for security and debugging, then deleted or aggregated.
        </li>
        <li>
          <strong>Billing records</strong> — retained for 7 years to comply
          with US tax and accounting law.
        </li>
      </ul>

      <h2>8. Your choices and rights</h2>
      <p>
        Residents of California (CCPA / CPRA), and residents of other US
        states with comparable privacy laws (Virginia, Colorado,
        Connecticut, Utah, Texas, Oregon, Montana, and others as enacted),
        have the right to:
      </p>
      <ul>
        <li>
          <strong>Know.</strong> Request the categories and specific pieces
          of personal information we have about you, the sources, the
          purposes, and the categories of third parties to whom we
          disclose it.
        </li>
        <li>
          <strong>Access / Portability.</strong> Receive a copy of the
          personal information you have given us in a portable, readable
          format.
        </li>
        <li>
          <strong>Correct.</strong> Request correction of inaccurate
          personal information.
        </li>
        <li>
          <strong>Delete.</strong> Request deletion of personal information
          (subject to limited exceptions for legal, security, or
          anti-fraud purposes).
        </li>
        <li>
          <strong>Opt out of sale or sharing.</strong> We do not sell or
          share personal information; nothing to opt out of.
        </li>
        <li>
          <strong>Limit use of sensitive personal information</strong> (CPRA).
          We do not use sensitive personal information for purposes
          beyond what is reasonably necessary to provide the Service.
        </li>
        <li>
          <strong>Non-discrimination.</strong> We will not deny service,
          charge a different price, or provide a different level of service
          because you exercised any of these rights.
        </li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>{" "}
        from the email associated with your account. We may need to verify
        your identity (typically by confirming you control the email on
        file). We respond to verifiable requests within 45 days, with up
        to a 45-day extension where reasonably necessary, in accordance
        with applicable law. You may also designate an authorized agent
        to make a request on your behalf, subject to our verification of
        the agent&apos;s authority.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is intended for adults (18 and older) and is not
        directed to children. We do not knowingly collect personal
        information from individuals under the age of 13 in compliance
        with the Children&apos;s Online Privacy Protection Act (COPPA), and
        we do not knowingly collect personal information from minors
        under 18 in line with our Terms. If we discover that we have
        collected information from a person we believe to be under 18, we
        will delete the account and the information. If you are a parent
        or guardian and believe a minor has provided us information,
        contact{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>{" "}
        and we will delete it promptly.
      </p>

      <h2>10. Security</h2>
      <p>
        We use industry-standard administrative, technical, and physical
        safeguards including: encryption in transit (TLS); encryption at
        rest where supported by our providers; role-based access controls;
        secret rotation; webhook signature verification; auth-protected
        APIs; and security review of changes. No system is perfectly
        secure, and we cannot guarantee absolute security. You use the
        Service at your own risk.
      </p>

      <h2>11. Breach notification</h2>
      <p>
        If we become aware of a security incident that has compromised the
        confidentiality, integrity, or availability of your personal
        information, we will notify you and any applicable regulators in
        accordance with applicable law, generally within 72 hours of
        confirming the incident. Notification will describe the nature of
        the incident, the categories of information involved, the steps
        we are taking, and what you can do to protect yourself.
      </p>

      <h2>12. International users</h2>
      <p>
        The Service is offered to users in the United States. Our primary
        infrastructure is in the United States. Some of our model
        providers (Section 4) may operate internationally; your Inputs
        may transit through those providers&apos; infrastructure during
        inference. If you access the Service from outside the US in
        violation of our Terms, you do so at your own risk; your
        information may be transferred to and processed in the US, and
        the legal protections in your jurisdiction may differ from those
        in the US.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this policy. Material changes will be communicated
        via email or in-product notice. The &quot;Last updated&quot; date
        above reflects the most recent revision. Continued use of the
        Service after a material change takes effect constitutes
        acceptance of the revised policy.
      </p>

      <h2>14. Contact</h2>
      <p>
        Privacy questions, requests to exercise your rights, or
        complaints:{" "}
        <a href="mailto:privacy@taviralabsai.com">privacy@taviralabsai.com</a>.
      </p>
      <p>
        If we cannot resolve your concern, you may contact your state
        attorney general (US residents) or the relevant data protection
        authority in your jurisdiction.
      </p>
    </>
  );
}
