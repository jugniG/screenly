import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  const lastUpdated = 'July 30, 2026'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20 text-brand-white">
      <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-brand-white mb-2">
        Privacy Policy
      </h1>
      <p className="text-brand-gray text-sm mb-10">Last updated: {lastUpdated}</p>

      <div className="space-y-8 text-brand-gray text-base leading-relaxed font-sans">
        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">1. Introduction</h2>
          <p>
            Welcome to <strong>Screenly</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the &quot;App&quot;) and website (the &quot;Site&quot;).
          </p>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">2. Information We Collect</h2>
          <p className="mb-3">We collect information to provide and improve our services to you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-brand-white">Account Data:</strong> Your email address and basic profile information created during authentication via email OTP.
            </li>
            <li>
              <strong className="text-brand-white">App Usage &amp; Rules:</strong> Information regarding the rules you configure (such as restricted app package names, daily usage limits, and blocking schedules).
            </li>
            <li>
              <strong className="text-brand-white">On-Device Android Usage Data:</strong> Local usage statistics from your device (via Android UsageStatsManager) used exclusively on your device to enforce screen time rules.
            </li>
            <li>
              <strong className="text-brand-white">Payment Information:</strong> Financial transactions, commitments, and forfeitures are processed securely through third-party payment providers (e.g., DodoPayments). We do not store full credit card details on our servers.
            </li>
            <li>
              <strong className="text-brand-white">Blockchain Address:</strong> Public Solana wallet addresses associated with your account for contract interactions.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">3. Android Permissions &amp; Special Services</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-montserrat font-medium text-base text-brand-white mb-1">Accessibility Service (Android)</h3>
              <p>
                Screenly uses the Android <code className="bg-brand-card px-2 py-0.5 rounded text-brand-orange text-xs">AccessibilityService API</code> solely to detect when a restricted foreground application is opened and display a blocking overlay when your limits are exceeded. We do <strong>NOT</strong> log keypresses, capture personal content, read screen text, or transmit your screen interactions to external servers.
              </p>
            </div>
            <div>
              <h3 className="font-montserrat font-medium text-base text-brand-white mb-1">Usage Access Permission (PACKAGE_USAGE_STATS)</h3>
              <p>
                This permission allows the App to monitor total daily screen time for selected applications on your device. All calculations are performed locally on your device to determine rule enforcement.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">4. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To enforce your screen time limits and app blocking rules.</li>
            <li>To manage your account, authenticate sign-ins, and send necessary transaction confirmation emails.</li>
            <li>To process financial commitment deposits and forfeitures.</li>
            <li>To troubleshoot issues, improve app performance, and respond to feedback.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">5. Data Sharing &amp; Third-Party Services</h2>
          <p className="mb-3">We do not sell, rent, or trade your personal data. We only share necessary data with trusted service providers who help us operate our service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-brand-white">DodoPayments:</strong> For processing payments and subscriptions securely.</li>
            <li><strong className="text-brand-white">Database &amp; Hosting Infrastructure:</strong> Secure cloud providers hosting our database and backend APIs under strict confidentiality.</li>
            <li><strong className="text-brand-white">Solana Network:</strong> Transactions made on the Solana blockchain are public by nature.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">6. Data Retention &amp; Security</h2>
          <p>
            We retain your personal data for as long as your account remains active. We implement administrative, technical, and physical security measures to safeguard your information against unauthorized access, loss, or alteration.
          </p>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">7. Your Rights &amp; Choices</h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access or update your account information directly within the App.</li>
            <li>Revoke Android permissions (Accessibility and Usage Access) at any time through your device settings.</li>
            <li>Request the deletion of your account and associated personal data by contacting us.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">9. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2 text-brand-orange font-medium">support@screenly.app</p>
        </section>
      </div>
    </div>
  )
}
