"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/app/today", [params]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setMessage("");
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessage("認証に失敗しました。入力内容を確認してください。");
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("確認メールを送信しました。メールのリンクから登録を完了してください。");
        return;
      }

      router.replace(next);
      router.refresh();
    });
  }

  function resetPassword(formData: FormData) {
    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      if (!email) {
        setMessage("メールアドレスを入力してください。");
        return;
      }
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email);
      setMessage("パスワードリセット用のメールを送信しました。");
    });
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-soft">
      <div className="mb-6">
        <div className="mb-4 grid size-12 place-items-center rounded-lg bg-mist text-lake">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-2xl font-semibold">{mode === "login" ? "ログイン" : "新規登録"}</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          日記はアカウントごとに分離して保存されます。
        </p>
      </div>
      <form action={submit} className="space-y-4">
        <Field label="メールアドレス">
          <Input required type="email" name="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="パスワード">
          <Input required type="password" name="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </Field>
        {message ? <p className="rounded-lg bg-mist px-3 py-2 text-sm text-neutral-700">{message}</p> : null}
        <Button className="w-full" type="submit" disabled={isPending}>
          <Mail size={16} />
          {isPending ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </Button>
      </form>
      {mode === "login" ? (
        <form action={resetPassword} className="mt-3">
          <Button variant="ghost" size="sm" type="submit" className="w-full" disabled={isPending}>
            パスワードをリセット
          </Button>
        </form>
      ) : null}
      <div className="mt-5 text-center text-sm text-neutral-600 dark:text-neutral-300">
        {mode === "login" ? (
          <>
            アカウントがない場合は <Link className="font-medium text-lake" href="/signup">新規登録</Link>
          </>
        ) : (
          <>
            すでに登録済みなら <Link className="font-medium text-lake" href="/login">ログイン</Link>
          </>
        )}
      </div>
    </div>
  );
}
