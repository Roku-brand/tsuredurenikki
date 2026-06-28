import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignupPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
