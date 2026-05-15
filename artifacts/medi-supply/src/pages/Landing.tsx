import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShieldCheck,
  Truck,
  Users,
  ArrowRight,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ── Reusable animation wrappers ─────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HoverCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(20,184,166,0.18)" }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Package className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">MedSupply</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="shadow-sm">
              <a href="#get-started">Get started</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* subtle radial gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, hsl(173 80% 40% / 0.12), transparent 70%)",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 py-28 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary mb-8 tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              NAFDAC-verified pharmaceutical distribution
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-3xl mx-auto">
              B2B Pharmaceutical{" "}
              <br className="hidden sm:block" />
              Procurement,{" "}
              <span className="text-primary">Simplified</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.16}>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MedSupply connects verified pharmaceutical importers with hospitals,
              wholesalers, and bulk buyers. Every product is NAFDAC-certified.
              Every transaction is tracked.
            </p>
          </FadeIn>

          <FadeIn delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="gap-2 shadow-md h-11 px-7 text-sm font-semibold">
                <Link href="/signup/buyer">
                  Register as Buyer <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-7 text-sm font-semibold">
                <Link href="/signup/vendor">Register as Vendor</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Why MedSupply
              </p>
              <h2 className="text-3xl font-bold tracking-tight">
                Built for Nigerian Healthcare Procurement
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Verified Vendors",
                desc: "Every vendor is screened with NAFDAC license verification and CAC document review before going live.",
                delay: 0,
              },
              {
                icon: Package,
                title: "Certified Products",
                desc: "Each product undergoes admin verification including COA review and NAFDAC number validation.",
                delay: 0.1,
              },
              {
                icon: Truck,
                title: "Order Tracking",
                desc: "Real-time status updates from order placement through payment confirmation to fulfillment.",
                delay: 0.2,
              },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <FadeIn key={title} delay={delay}>
                <HoverCard className="h-full rounded-2xl border border-border bg-background p-7 flex flex-col gap-4 cursor-default transition-colors hover:border-primary/40">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </HoverCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works strip ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              Get started in three steps
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* connector line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-9 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-border"
          />
          {[
            { step: "01", icon: Lock, title: "Create & Verify", desc: "Register your account and submit KYB documents for review." },
            { step: "02", icon: Package, title: "List or Browse", desc: "Vendors list NAFDAC-certified products; buyers browse and request quotes." },
            { step: "03", icon: BarChart3, title: "Order & Track", desc: "Place secure orders via Paystack and track every fulfilment step." },
          ].map(({ step, icon: Icon, title, desc }, i) => (
            <FadeIn key={step} delay={i * 0.12}>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative w-[72px] h-[72px] rounded-2xl bg-primary/10 flex items-center justify-center z-10">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Who it&apos;s for
              </p>
              <h2 className="text-3xl font-bold tracking-tight">Who Uses MedSupply</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: "Buyers",
                icon: Users,
                types: ["Wholesalers", "Hospitals", "Pharmacies"],
                desc: "Browse verified pharmaceutical products, submit bulk orders, and track fulfilment — all in one platform.",
                href: "/signup/buyer",
                cta: "Register as Buyer",
                delay: 0,
              },
              {
                role: "Vendors",
                icon: Package,
                types: ["Importers", "Distributors"],
                desc: "List your NAFDAC-certified products, reach qualified buyers, and manage your product catalogue.",
                href: "/signup/vendor",
                cta: "Register as Vendor",
                delay: 0.1,
              },
              {
                role: "Admin",
                icon: Zap,
                types: ["Platform Managers"],
                desc: "Verify accounts, approve products, manage order pipelines, and oversee the entire distribution network.",
                href: "/login",
                cta: "Admin Login",
                delay: 0.2,
              },
            ].map(({ role, icon: Icon, types, desc, href, cta, delay }) => (
              <FadeIn key={role} delay={delay}>
                <HoverCard className="h-full rounded-2xl border border-border bg-background p-7 flex flex-col gap-5 cursor-default transition-colors hover:border-primary/40">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-2">{role}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {types.map((t) => (
                          <span
                            key={t}
                            className="text-[11px] bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
                  <Button variant="outline" size="sm" asChild className="w-full mt-auto font-semibold">
                    <Link href={href}>{cta}</Link>
                  </Button>
                </HoverCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Verified Products" },
              { value: "KYB", label: "Know Your Business" },
              { value: "COA", label: "Certificate of Analysis" },
              { value: "Paystack", label: "Secure Payments" },
            ].map(({ value, label }, i) => (
              <FadeIn key={label} delay={i * 0.08}>
                <div className="flex flex-col gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</span>
                  <span className="text-sm text-primary-foreground/70 font-medium">{label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="get-started" className="max-w-6xl mx-auto px-6 py-28 text-center">
        <FadeIn>
          <div className="max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Ready to streamline pharmaceutical procurement?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join verified vendors and buyers on MedSupply today.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild className="gap-2 shadow-md h-11 px-8 text-sm font-semibold">
                <Link href="/signup/buyer">
                  Start as Buyer <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-8 text-sm font-semibold">
                <Link href="/signup/vendor">Start as Vendor</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">MedSupply</span>
          </div>
          <span>© {new Date().getFullYear()} MedSupply · B2B Pharmaceutical Distribution Platform</span>
        </div>
      </footer>
    </div>
  );
}
