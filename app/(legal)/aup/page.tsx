export const metadata = {
  title: "Acceptable Use Policy · TraviaLabs",
  description: "TraviaLabs Acceptable Use Policy",
};

export default function AUPPage() {
  return (
    <>
      <h1>Acceptable Use Policy</h1>
      <p className="text-sm text-zinc-400">Last updated: April 29, 2026</p>

      <div className="my-6 rounded-md border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-200">
        <strong>Notice:</strong> this policy is provided as a starting point and
        has not yet been reviewed by counsel. It will be updated; please check
        back periodically.
      </div>

      <p>
        This Acceptable Use Policy (&quot;AUP&quot;) describes content and conduct
        prohibited on TraviaLabs. It applies to anyone using the Service,
        including via API or shared workspaces. Violations of this AUP may
        result in immediate suspension or termination of your account, removal
        of content, forfeiture of credits and subscription balances, and where
        appropriate, reports to law enforcement.
      </p>

      <h2>Hard prohibitions</h2>
      <p>
        The following uses are absolutely prohibited. There are no exceptions.
      </p>
      <ul>
        <li>
          <strong>Sexual content involving minors.</strong> Generating,
          requesting, or attempting to generate sexual or sexualized imagery
          involving anyone who is or appears to be under 18, including loli,
          shota, and similar styles.
        </li>
        <li>
          <strong>Sexual or pornographic content.</strong> The Service is
          SFW-only. Generating, requesting, or attempting to generate nudity,
          sexual acts, sexually suggestive imagery, fetish content, or
          pornographic material is prohibited.
        </li>
        <li>
          <strong>Real people without consent.</strong> Generating images or
          videos depicting an identifiable real person other than yourself is
          prohibited. You may use face-swap and avatar training only on
          yourself, with attestation.
        </li>
        <li>
          <strong>Non-consensual intimate imagery.</strong> Even when permitted
          subjects (yourself) are involved, you may not produce intimate or
          sexual content of any real person.
        </li>
        <li>
          <strong>Identity fraud and impersonation.</strong> Generating
          credentials, identity documents, signatures, or content meant to
          impersonate someone else.
        </li>
        <li>
          <strong>Election manipulation.</strong> Generating content designed
          to deceive voters about a candidate, party, or election process.
        </li>
        <li>
          <strong>Violent extremism and terrorism.</strong> Promoting or
          glorifying terrorism, extremist groups, hate organizations, or mass
          violence.
        </li>
      </ul>

      <h2>Other prohibited uses</h2>
      <ul>
        <li>
          <strong>Harassment and hate.</strong> Content targeting an individual
          or group with abuse, threats, slurs, or dehumanizing imagery on the
          basis of race, ethnicity, national origin, religion, gender, gender
          identity, sexual orientation, age, disability, or veteran status.
        </li>
        <li>
          <strong>Self-harm and suicide.</strong> Content that depicts,
          glorifies, or encourages self-harm, suicide, or eating disorders.
        </li>
        <li>
          <strong>Graphic violence.</strong> Gore, dismemberment, or torture.
          Mild violence in narrative or fictional contexts may be permitted at
          our discretion.
        </li>
        <li>
          <strong>Intellectual property infringement.</strong> Copying or
          imitating an artist&apos;s style or signature, recreating copyrighted
          characters, brands, logos, or trade dress, or using outputs in a way
          that would infringe third-party rights.
        </li>
        <li>
          <strong>Illegal activity.</strong> Content depicting or promoting
          drug manufacturing, weapons manufacture, fraud, or other criminal
          activity.
        </li>
        <li>
          <strong>Malware and security harm.</strong> Using outputs in phishing,
          malware delivery, or to bypass security measures.
        </li>
        <li>
          <strong>Spam and abuse of the Service.</strong> Mass automated
          generation, credit-stuffing, sharing accounts, abusing free credits,
          attempting to circumvent moderation or rate limits.
        </li>
      </ul>

      <h2>Real-person rules</h2>
      <p>
        We enforce a self-only policy for any feature that produces or modifies
        a person&apos;s likeness (face swap, avatar training, image-to-video
        animation). When using these features you must:
      </p>
      <ul>
        <li>
          Confirm the source images are of yourself, or of someone who has
          given you explicit, current, written consent to use their likeness
          for the specific output.
        </li>
        <li>
          Not generate content depicting public figures, celebrities,
          politicians, athletes, or any identifiable third party (even with
          permission, this is currently disallowed pending further review).
        </li>
      </ul>
      <p>
        We may detect and flag prompts that name real people; such requests
        will be blocked.
      </p>

      <h2>Reporting violations</h2>
      <p>
        If you encounter content or behavior that violates this AUP, report it
        to <a href="mailto:abuse@taviralabsai.com">abuse@taviralabsai.com</a>{" "}
        with as much detail as possible (URLs, screenshots, timestamps). We
        review all reports and act where warranted.
      </p>

      <h2>Consequences</h2>
      <p>
        Violations may result in: removal of content; warnings; rate-limiting
        or feature restriction; suspension or termination of your account;
        forfeiture of any unused credits, subscription balances, or refunds;
        and, where appropriate, referral to law enforcement.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this AUP from time to time. Material changes will be
        communicated via email or in-product notice. The &quot;Last updated&quot; date
        above reflects the most recent revision.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy:{" "}
        <a href="mailto:abuse@taviralabsai.com">abuse@taviralabsai.com</a>
      </p>
    </>
  );
}
