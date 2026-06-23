"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { signIn, signUp } from "@/lib/auth-client";

const roles = [
  { label: "Procurement Officer", value: "procurement_officer" },
  { label: "Vendor", value: "vendor" },
  { label: "Manager / Approver", value: "manager" },
  { label: "Admin", value: "admin" },
];

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [role, setRole] = React.useState("procurement_officer");
  const [error, setError] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
        
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to create account.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleSocial(provider: "github" | "google") {
    startTransition(async () => {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    });
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create VendorBridge account</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Choose a procurement role and start with secure access.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" name="name" type="text" placeholder="Meera Shah" required className="bg-background" />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-background" />
        </Field>

        <Field>
          <FieldLabel>Role</FieldLabel>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" minLength={8} required className="bg-background" />
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <Input id="confirm-password" name="confirm-password" type="password" minLength={8} required className="bg-background" />
        </Field>

        {error ? (
          <Field>
            <FieldError>{error}</FieldError>
          </Field>
        ) : null}

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create account
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" type="button" disabled={isPending} onClick={() => handleSocial("github")}>
              <GitBranch className="size-4" />
              GitHub
            </Button>
            <Button variant="outline" type="button" disabled={isPending} onClick={() => handleSocial("google")}>
              Google
            </Button>
          </div>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
