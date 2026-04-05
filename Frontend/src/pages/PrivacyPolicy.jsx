import { Link } from 'react-router-dom';
import LegalPageLayout from '../components/LegalPageLayout';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="text-sm text-slate-500 mb-8">
        Last updated: March 31, 2026. Customize this policy for your deployment, data locations, and legal requirements
        before using it for Google OAuth or other compliance purposes.
      </p>

      <h2>1. Who we are</h2>
      <p>
        This Privacy Policy describes how the operator of this COD-DATA instance (&quot;we,&quot; &quot;us&quot;)
        processes information when you use the Service. The data controller is the organization that hosts and
        administers this application.
      </p>

      <h2>2. Information we collect</h2>
      <p>Depending on how your administrator configured the Service, we may process:</p>
      <ul>
        <li>
          <strong className="text-slate-400">Account data:</strong> email address, display name, role, and project
          assignments.
        </li>
        <li>
          <strong className="text-slate-400">Authentication:</strong> if you sign in with Google, we receive identifiers
          and profile information allowed by the OAuth consent you approve (typically OpenID, email address, and name as
          exposed by Google). We use this to verify your identity and match your account.
        </li>
        <li>
          <strong className="text-slate-400">Content you submit:</strong> security and asset records, uploads, and other
          information you or your organization enter into the Service.
        </li>
        <li>
          <strong className="text-slate-400">Technical data:</strong> standard server logs (such as IP address, user
          agent, and timestamps) needed for security and operations.
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <p>We use the information above to:</p>
      <ul>
        <li>Provide, secure, and improve the Service.</li>
        <li>Authenticate users and enforce role-based access.</li>
        <li>Communicate about access, incidents, or policy changes as appropriate.</li>
        <li>Meet legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>4. Legal bases (where applicable)</h2>
      <p>
        If the GDPR or similar laws apply, we rely on bases such as contract (providing the Service), legitimate
        interests (security and product improvement), and consent where required (for example, certain cookies or
        marketing, if offered).
      </p>

      <h2>5. Sharing</h2>
      <p>
        We do not sell your personal information. We share data with subprocessors only as needed to run the Service
        (for example, hosting or, when enabled, Google for sign-in), with your organization&apos;s administrators, or
        when required by law.
      </p>

      <h2>6. Retention</h2>
      <p>
        We retain information for as long as your account is active or as needed to provide the Service, comply with law,
        resolve disputes, and enforce agreements. Your administrator may define additional retention practices.
      </p>

      <h2>7. Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect information. No method of transmission
        or storage is completely secure.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or export personal data, or to
        object to or restrict certain processing. Contact your administrator or the organization operating this instance
        to exercise these rights.
      </p>

      <h2>9. International transfers</h2>
      <p>
        If data is processed across borders, we use appropriate safeguards as required by applicable law. Describe your
        hosting region and transfer mechanisms here when you customize this policy.
      </p>

      <h2>10. Children</h2>
      <p>The Service is not directed at children under 13 (or the age required in your jurisdiction).</p>

      <h2>11. Changes</h2>
      <p>
        We may update this Privacy Policy. We will post changes on this page and update the &quot;Last updated&quot;
        date.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions, contact your COD-DATA administrator or the organization operating this deployment.
      </p>

      <h2>Related</h2>
      <p>
        See also our <Link to="/terms">Terms of Service</Link>.
      </p>
    </LegalPageLayout>
  );
}
