import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/delete-account')({
  component: DeleteAccountPage,
})

function DeleteAccountPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20 text-brand-white">
      <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-brand-white mb-2">
        Account &amp; Data Deletion Request
      </h1>
      <p className="text-brand-gray text-base mb-10">
        Screenly (&quot;we,&quot; &quot;our&quot;) provides users with full control over their personal data. Below are the steps to request the deletion of your account and associated data.
      </p>

      <div className="space-y-8 text-brand-gray text-base leading-relaxed font-sans">
        <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-4">
            How to Request Account Deletion
          </h2>
          <p className="mb-4">
            You can request full deletion of your Screenly account and associated data using either of the following methods:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-montserrat font-medium text-base text-brand-orange mb-1">
                Option 1: Email Request (Recommended)
              </h3>
              <p>
                Send an email from the email address registered with your Screenly account to:
              </p>
              <a
                href="mailto:guptas3067@gmail.com?subject=Screenly%20Account%20Deletion%20Request"
                className="inline-block mt-2 font-mono text-brand-white bg-brand-bg px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand-orange transition"
              >
                guptas3067@gmail.com
              </a>
              <p className="text-sm text-brand-gray mt-2">
                Subject line: <strong>Screenly Account Deletion Request</strong>
              </p>
            </div>

            <div>
              <h3 className="font-montserrat font-medium text-base text-brand-orange mb-1">
                Option 2: In-App Sign Out
              </h3>
              <p>
                Open Screenly &gt; go to <strong>Account</strong> tab &gt; tap <strong>Sign Out</strong>. To wipe all local rule cache from your device, uninstall the app after signing out.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">
            What Data is Permanently Deleted?
          </h2>
          <p className="mb-3">
            Upon processing your deletion request, the following data is permanently wiped from our primary databases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-brand-white">Account Info:</strong> Your registered email address, profile name, and authentication sessions.</li>
            <li><strong className="text-brand-white">App Rules &amp; Schedules:</strong> All custom blocking configurations, daily limits, and rule parameters.</li>
            <li><strong className="text-brand-white">Usage Analytics:</strong> Local and server usage logs associated with your user ID.</li>
            <li><strong className="text-brand-white">Device Mappings:</strong> On-device wallet associations tied to your user account.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">
            What Data is Retained &amp; Why?
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-brand-white">On-Chain Solana Transactions:</strong> Transactions submitted to the Solana blockchain (escrow creation, forfeitures) are immutable public ledger records and cannot be altered or deleted. However, your email and profile link to these transactions will be erased from our database.
            </li>
            <li>
              <strong className="text-brand-white">Financial &amp; Invoicing Records:</strong> Payment transaction metadata handled by third-party processors (e.g. DodoPayments) may be retained for up to 7 years as required by tax and financial compliance regulations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-montserrat font-semibold text-xl text-brand-white mb-3">
            Processing Timeframe
          </h2>
          <p>
            Account deletion requests sent via email are processed within <strong>7 business days</strong>. You will receive a confirmation email once your account data has been completely erased.
          </p>
        </section>
      </div>
    </div>
  )
}
