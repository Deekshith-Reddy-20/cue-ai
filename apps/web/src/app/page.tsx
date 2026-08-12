"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Mic,
  Sparkles,
  Shield,
  Zap,
  Languages,
  Monitor,
  FileText,
  Library,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { faqs, pricing, testimonials } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mic,
    title: "Live AI Assistant",
    desc: "Real-time answers grounded in your conversation and knowledge base.",
  },
  {
    icon: Sparkles,
    title: "Instant Summaries",
    desc: "Decisions, action items, and follow-up drafts the moment the call ends.",
  },
  {
    icon: Monitor,
    title: "Desktop Companion",
    desc: "A floating glass panel that stays with you across every meeting app.",
  },
  {
    icon: Languages,
    title: "Live Translation",
    desc: "English, Hindi, and Telugu — bilingual transcripts and AI replies.",
  },
  {
    icon: FileText,
    title: "Resume Tailor",
    desc: "Match roles with ATS scores, keyword gaps, and side-by-side rewrites.",
  },
  {
    icon: Library,
    title: "Knowledge Base",
    desc: "Semantic search across docs with citations in every AI answer.",
  },
];

const logos = ["Northstar", "Lumen", "Helix", "Orbit", "Vertex", "Pulse"];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="relative z-40 border-b border-[var(--border)]/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size="md" />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition hover:text-foreground">
              Product
            </a>
            <a href="#pricing" className="transition hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
            </a>
            <Link href="/dashboard" className="transition hover:text-foreground">
              Open App
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button href="/login" variant="ghost" size="sm">
              Log in
            </Button>
            <Button href="/signup" variant="gradient" size="sm">
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="aurora">
          <div className="aurora-mid" />
        </div>
        <div className="grid-fade absolute inset-0" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="info" className="mb-6 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              AI Meeting Copilot for modern teams
            </Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.08]">
              Your AI Copilot for{" "}
              <span className="text-gradient">Every Meeting.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
              Live transcription, real-time answers, and enterprise-grade summaries —
              so you stay present while CueAI captures everything that matters.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/signup" variant="gradient" size="lg">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/login" variant="outline" size="lg">
                Book Demo
              </Button>
            </div>
            <p className="mt-4 text-xs text-subtle">
              No credit card · SOC2-ready · Works with Zoom, Meet & Teams
            </p>
          </motion.div>

          {/* Product mock */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto mt-16 max-w-5xl"
          >
            <div className="glow-border float-y rounded-[24px]">
              <div className="glass-strong overflow-hidden rounded-[24px] shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500/80" />
                  <span className="ml-3 text-xs text-subtle">CueAI · Live Session</span>
                  <Badge variant="success" className="ml-auto">
                    Recording
                  </Badge>
                </div>
                <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3 border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 items-end gap-0.5">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className="wave-bar w-1 rounded-full bg-gradient-to-t from-teal-600 to-teal-400"
                            style={{
                              height: `${10 + ((i * 7) % 18)}px`,
                              animationDelay: `${i * 0.08}s`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted">00:18:42 · 4 speakers</span>
                    </div>
                    {[
                      {
                        who: "Priya",
                        text: "What's our latency budget for real-time answers?",
                      },
                      {
                        who: "You",
                        text: "Sub-800ms for suggestions. Summaries can be async.",
                      },
                      {
                        who: "Marcus",
                        text: "We should keep screen context opt-in for enterprise.",
                      },
                    ].map((line) => (
                      <div
                        key={line.text}
                        className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2.5"
                      >
                        <p className="text-[11px] font-medium text-primary">{line.who}</p>
                        <p className="mt-0.5 text-sm text-foreground/90">{line.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                      AI Answers
                    </p>
                    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4">
                      <p className="text-xs font-medium text-violet-300">Suggested reply</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                        Target p95 under 800ms. Stream tokens from the local transcript
                        buffer; defer deep RAG when confidence drops below 0.7.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="primary">
                          Pin
                        </Button>
                        <Button size="sm" variant="ghost">
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] p-4">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Shield className="h-3.5 w-3.5 text-teal-400" />
                        Privacy on · Audio only
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -left-2 top-10 hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 shadow-lg sm:block lg:-left-8"
            >
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Answer in 640ms
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -right-2 bottom-16 hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 shadow-lg sm:block lg:-right-6"
            >
              <div className="flex items-center gap-2 text-xs">
                <Languages className="h-3.5 w-3.5 text-violet-400" />
                EN · HI · TE
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-[var(--border)] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.16em] text-subtle">
            Trusted by product teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((name) => (
              <span
                key={name}
                className="font-display text-lg font-semibold tracking-tight text-foreground/25"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-16 sm:grid-cols-4 sm:px-6">
        {[
          ["2.4M+", "Meeting minutes"],
          ["98%", "Transcript accuracy"],
          ["<800ms", "Answer latency"],
          ["40%", "Less follow-up time"],
        ].map(([value, label]) => (
          <div key={label} className="text-center">
            <p className="font-display text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
              {value}
            </p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need in the room — and after.
          </h2>
          <p className="mt-3 text-muted">
            One platform for live assistance, knowledge, and enterprise control.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)] text-primary transition group-hover:scale-105">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-[var(--border)] bg-[var(--background-elevated)]/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            Built for teams who can&apos;t miss a beat.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6"
              >
                <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-5">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-subtle">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing that scales with clarity.
          </h2>
          <p className="mt-3 text-muted">Start free. Upgrade when your team is ready.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                plan.highlighted
                  ? "glow-border border-transparent bg-[var(--surface-solid)]"
                  : "border-[var(--border)] bg-[var(--surface-solid)]"
              )}
            >
              {plan.highlighted && (
                <Badge variant="purple" className="absolute -top-2.5 left-6">
                  Most popular
                </Badge>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-subtle">{plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button
                href={plan.cta === "Book Demo" ? "/login" : "/signup"}
                variant={plan.highlighted ? "gradient" : "outline"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-2">
          {faqs.map((item, i) => {
            const open = openFaq === i;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)]"
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  {item.q}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-subtle transition",
                      open && "rotate-180"
                    )}
                  />
                </button>
                {open && (
                  <p className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-muted">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xs text-sm text-muted">
              The AI meeting copilot for teams who move fast and stay accountable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {[
              ["Product", ["Features", "Pricing", "Desktop App", "Security"]],
              ["Company", ["About", "Careers", "Blog", "Contact"]],
              ["Legal", ["Privacy", "Terms", "DPA", "Status"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  {title as string}
                </p>
                <ul className="mt-3 space-y-2">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <a href="#features" className="text-sm text-muted hover:text-foreground">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--border)] py-5 text-center text-xs text-subtle">
          © {new Date().getFullYear()} CueAI Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
