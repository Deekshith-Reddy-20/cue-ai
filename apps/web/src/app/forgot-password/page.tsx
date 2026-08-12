"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="aurora absolute inset-0 opacity-50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-8 shadow-[var(--shadow-lg)]">
        <Logo className="mb-8" />
        {sent ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted">
              We sent a reset link and magic link options to your inbox.
            </p>
            <Link href="/login" className="mt-6 block">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="mt-2 text-sm text-muted">
              Enter your email and we&apos;ll send a reset link—or a magic link to sign in.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="alex@acme.com"
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
              <Button type="submit" variant="gradient" className="w-full">
                Send reset link
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setSent(true)}>
                Send magic link instead
              </Button>
            </form>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
