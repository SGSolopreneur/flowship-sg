import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-500 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy & User Data Policy</h1>
            <p className="text-sm text-slate-500">Effective date: 1 January 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              WarehouseSG ("we", "our", or "us") operates a warehouse and distribution management platform for use
              within Singapore. This Privacy Policy explains how we collect, use, store, and protect personal data
              in accordance with the <strong>Personal Data Protection Act 2012 (PDPA)</strong> of Singapore.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">2. Data We Collect</h2>
            <p className="mb-3">We collect the following categories of personal data:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Account Information:</strong> Full name, email address, and role.</li>
              <li><strong>Operational Data:</strong> Stock movements, transfer records, and delivery confirmations you initiate.</li>
              <li><strong>Device & Usage Data:</strong> Browser type, IP address, and in-app activity logs for security and audit purposes.</li>
              <li><strong>Location Data:</strong> GPS coordinates submitted by drivers during active deliveries.</li>
              <li><strong>Signatures & Photos:</strong> Delivery confirmation signatures and photos uploaded during proof-of-delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>To provide and operate the WarehouseSG platform.</li>
              <li>To authenticate users and manage role-based access.</li>
              <li>To generate operational reports and automated notifications.</li>
              <li>To track inventory movements and delivery fulfilment.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">4. Data Sharing</h2>
            <p>
              We do not sell or rent personal data to third parties. Data may be shared with:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
              <li>Authorised personnel within your organisation (based on role).</li>
              <li>Cloud infrastructure providers for data storage and processing.</li>
              <li>Email delivery services used to send automated reports.</li>
            </ul>
            <p className="mt-3">All third-party providers are contractually bound to protect your data.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">5. Data Retention</h2>
            <p>
              Personal data is retained for as long as necessary to fulfil the purposes outlined above, or as required by
              applicable laws. Operational records such as transfer logs and stock movements are retained for a minimum of
              <strong> 5 years</strong> for audit purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted data transmission (TLS), role-based
              access controls, and regular access audits. Access to sensitive data is restricted to authorised administrators
              and managers only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">7. Your Rights</h2>
            <p className="mb-2">Under the PDPA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete personal data.</li>
              <li>Withdraw consent for data use (where applicable).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact your system administrator or email us at{" "}
              <a href="mailto:admin@warehousesg.com" className="text-emerald-600 underline">
                admin@warehousesg.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">8. Cookies</h2>
            <p>
              This platform uses session cookies strictly necessary for authentication and security. No third-party
              advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Users will be notified of significant changes via email or
              in-app notification. Continued use of the platform constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">10. Contact</h2>
            <p>
              For any questions or concerns about this policy, please contact:
            </p>
            <div className="mt-3 bg-slate-50 rounded-lg p-4 space-y-1">
              <p><strong>WarehouseSG Data Protection Officer</strong></p>
              <p>Email: <a href="mailto:admin@warehousesg.com" className="text-emerald-600 underline">admin@warehousesg.com</a></p>
              <p>Jurisdiction: Singapore</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}