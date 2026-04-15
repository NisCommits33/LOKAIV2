import { Container } from "@/components/layout/Container";
import { Shield, Lock, Eye, FileText, Globe, Clock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | LokAI",
  description: "Learn how LokAI handles and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-slate-950 py-20 min-h-screen">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-16 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              Compliance & Data Protection
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Privacy Policy
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              Last Updated: April 15, 2026. This policy describes how we collect, use, and handle your information when you use our platform.
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: Lock,
                title: "Data Security",
                desc: "We use enterprise-grade encryption to protect your official documents.",
              },
              {
                icon: Eye,
                title: "Transparency",
                desc: "We are clear about what data we collect and why we need it.",
              },
              {
                icon: Globe,
                title: "Nepal Focus",
                desc: "Compliant with Nepal&apos;s digital data regulations and guidelines.",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-3 transition-colors hover:border-indigo-500/20">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
            <section className="space-y-4">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <FileText className="h-5 w-5 text-indigo-500" />
                1. Information We Collect
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                When you register for LokAI, we collect information that identifies you, such as your name, email address, and organizational affiliation. For organizations, we also collect representative contact details and institutional data required for billing and service provisioning.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Account Data:</strong> Name, professional email, and password hashes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Document Data:</strong> Content of uploaded study materials for AI processing.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Usage Data:</strong> System logs, feature engagement, and quiz performance.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                <Clock className="h-5 w-5 text-indigo-500" />
                2. How We Use Your Information
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Your data is used primarily to provide and improve the LokAI experience. Specifically, we use your data to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {[
                  "Generate AI summaries and insights",
                  "Personalize your GK learning path",
                  "Securely manage organization access",
                  "Process subscriptions via Khalti",
                  "Provide technical support",
                  "Audit system performance",
                ].map((use, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-sm text-slate-600 dark:text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    {use}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                3. Data Security & Retention
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                We implement industry-standard security measures to protect your data. All document processing happens in encrypted environments. We retain your information for as long as your account is active or as needed to provide you with the services. 
              </p>
              <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2 uppercase tracking-wider">Note to Govt Employees</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium leading-relaxed">
                  LokAI is a private preparation platform. We do not share official documents with government agencies unless explicitly requested by the organization admin under their specific data control settings.
                </p>
              </div>
            </section>

            <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                4. Contact Information
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                If you have questions about this Privacy Policy or our data practices, please reach out to us:
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Email Address</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold">privacy@lokai.gov.np</p>
                </div>
                <div className="flex-1 p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Office Location</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold">Kathmandu, Nepal</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
