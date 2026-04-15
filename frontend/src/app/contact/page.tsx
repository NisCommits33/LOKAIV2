import { Container } from "@/components/layout/Container";
import { Mail, MessageCircle, MapPin, Send, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact Us | LokAI",
  description: "Get in touch with the LokAI team for support and inquiries.",
};

export default function ContactPage() {
  return (
    <div className="bg-white dark:bg-slate-950 py-20 min-h-screen">
      <Container>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left: Contact Info */}
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <MessageCircle className="h-3 w-3" />
                  Get in Touch
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  We&apos;re here to <br />help you prep.
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md leading-relaxed">
                  Have questions about our AI features or institutional plans? 
                  Our team is ready to assist you.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: Mail,
                    label: "Email Support",
                    value: "support@lokai.gov.np",
                    sub: "Our team usually replies within 24 hours.",
                  },
                  {
                    icon: MapPin,
                    label: "Our Office",
                    value: "Kathmandu, Nepal",
                    sub: "Near Lok Sewa Aayog, Kathmandu.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <item.icon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="text-slate-900 dark:text-slate-100 font-bold">{item.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div className="pt-4 flex items-center gap-4">
                 {[Globe, Globe, Globe].map((Icon, i) => (
                   <button key={i} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all cursor-pointer">
                     <Icon className="h-4 w-4" />
                   </button>
                 ))}
              </div>
            </div>

            {/* Right: Contact Form Cards */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-indigo-500/0 rounded-3xl blur opacity-10" />
              <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                <form className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                       <input 
                         type="text" 
                         placeholder="Ram Bahadur"
                         className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-sm text-slate-900 dark:text-slate-100"
                        />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                       <input 
                         type="email" 
                         placeholder="ram@example.com"
                         className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-sm text-slate-900 dark:text-slate-100"
                        />
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                      <select className="w-full h-12 px-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-sm text-slate-900 dark:text-slate-100 appearance-none">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Institutional Sales</option>
                        <option>Billing Issues</option>
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Message</label>
                      <textarea 
                        rows={4}
                        placeholder="How can we help you?"
                        className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-sm text-slate-900 dark:text-slate-100 resize-none"
                      />
                   </div>

                   <Button className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-base shadow-lg shadow-slate-900/10 dark:shadow-none transition-all">
                     <Send className="mr-2 h-4 w-4" />
                     Send Message
                   </Button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  );
}
