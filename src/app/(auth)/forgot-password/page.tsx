"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate a brief delay (in a real app, call better-auth's reset endpoint)
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-white to-indigo-50/40 px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-indigo-100/40">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <Building2 className="size-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">VendorBridge</span>
        </div>

        {!submitted ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900">Reset password</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your registered email address and we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="po@vendorbridge.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending instructions...
                  </>
                ) : (
                  "Send reset instructions"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Check your inbox</h1>
            <p className="mt-2 text-sm text-slate-500">
              If <span className="font-semibold text-slate-700">{email}</span> is registered, you'll receive reset instructions shortly.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={() => { setSubmitted(false); setEmail(""); }}
            >
              Try different email
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
