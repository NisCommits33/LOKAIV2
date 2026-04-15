import { Container } from "@/components/layout/Container";
import { FileCheck, BookOpen, AlertCircle, Scale, CreditCard, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service | LokAI",
  description: "Read the terms and conditions for using the LokAI platform.",
};

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-slate-950 py-20 min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-16 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="h-3 w-3" />
              Platform Agreement
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Terms of Service
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              Please read these terms carefully before using LokAI. By accessing the platform, you agree to be bound by these conditions.
            </p>
          </div>

          {/* Key Terms Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
            {[
              {
                icon: FileCheck,
                title: "Acceptable Use",
                desc: "No unauthorized automation or scraping of exam materials.",
              },
              {
                icon: CreditCard,
                title: "Subscription Basis",
                desc: "Services are provided based on the selected tier and billing cycle.",
              },
              {
                icon: ShieldAlert,
                title: "Account Security",
                desc: "Users are responsible for maintaining the confidentiality of their credentials.",
              },
              {
                icon: Scale,
                title: "Legal Jurisdiction",
                desc: "Governed by the digital and civil laws of the Government of Nepal.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                  <item.icon className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                By creating an account or accessing the LokAI platform (the &quot;Service&quot;), you agree to these Terms of Service. If you are using the Service on behalf of an organization, you are agreeing to these Terms for that organization and promising that you have the authority to bind that organization to these terms.
              </p>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                2. User Obligations & Conduct
              </h2>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
                <li className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                  <span>You must be a civil service aspirant or a government employee to use the specialized prep features.</span>
                </li>
                <li className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                  <span>You agree not to bypass any security measures or use automated scripts to download documents at scale.</span>
                </li>
                <li className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                  <span>Institutional accounts must only grant access to verified employees within their administrative hierarchy.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                3. Subscriptions & Payments
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Paid services are provided on a subscription basis. Subscriptions are billed in advance at the start of each cycle (monthly or yearly). 
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 space-y-3">
                 <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                   <CreditCard className="h-4 w-4" />
                   Payment Integration
                 </div>
                 <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium leading-relaxed">
                   Currently, we exclusively support <strong>Khalti</strong> for payment processing. Users must comply with Khalti&apos;s terms of service for transaction security. Subscription fees are non-refundable except where required by Nepalese law.
                 </p>
              </div>
            </section>

            <section className="space-y-6 mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                4. Intellectual Property
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                The software, design, and AI algorithms powering LokAI are the exclusive property of the LokAI Development Team. User-uploaded materials remain the property of the respective users or institutions, granted that a license is provided to LokAI solely for processing and retrieval for that specific user/organization.
              </p>
            </section>

            <section className="space-y-6 pt-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                5. Limitation of Liability
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                LokAI is a study preparation tool. While we strive for absolute accuracy in our AI summaries and GK materials, we do not guarantee success in official Lok Sewa examinations. The platform is provided &quot;as is&quot; without warranties of any kind.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
