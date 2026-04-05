import { Link } from 'react-router-dom';
import LegalPageLayout from '../components/LegalPageLayout';

export default function TermsOfService() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p className="text-sm text-slate-500 mb-8">
        Last updated: March 31, 2026. Replace this document with text that matches your organization and
        jurisdiction before relying on it in production.
      </p>

      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern access to and use of COD-DATA (the &quot;Service&quot;), a
        cybersecurity oversight and asset-management application operated by you or your organization
        (&quot;we,&quot; &quot;us&quot;). By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>2. The Service</h2>
      <p>
        COD-DATA provides tools to manage security-related assets, projects, and workflows for authorized users. Features,
        availability, and supported environments may change. We may suspend or discontinue parts of the Service with
        reasonable notice where practicable.
      </p>

      <h2>3. Accounts and access</h2>
      <p>
        You may sign in using credentials or third-party identity providers (such as Google) as configured by your
        administrator. You are responsible for activity under your account and for keeping authentication factors
        secure. Administrators may invite users, assign roles (for example auditor or end user), and revoke access.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service in violation of law or third-party rights.</li>
        <li>Attempt to gain unauthorized access to systems, data, or accounts.</li>
        <li>Interfere with or disrupt the Service or other users.</li>
        <li>Upload unlawful, malicious, or infringing content.</li>
      </ul>

      <h2>5. Your data</h2>
      <p>
        You retain rights to data you submit. Handling of personal data is described in our{' '}
        <Link to="/privacy">Privacy Policy</Link>. You are responsible for the accuracy and legality of data you import
        and for obtaining any required consents.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind, to the fullest extent permitted by
        law. The Service does not guarantee detection or prevention of security incidents and is not a substitute for
        professional security advice or compliance obligations.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, we are not liable for indirect, incidental, special,
        consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the
        Service.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms. We will post the revised version on this page and update the &quot;Last updated&quot;
        date. Continued use after changes constitutes acceptance where permitted by law.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about these Terms, contact your COD-DATA administrator or the organization operating this
        deployment.
      </p>
    </LegalPageLayout>
  );
}
