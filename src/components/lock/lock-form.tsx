"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { verifyLockPinAction } from "@/server/actions/lock";

export function LockForm({ pinConfigured }: { pinConfigured: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/home";
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function unlock(formData: FormData) {
    startTransition(async () => {
      const pin = String(formData.get("pin") ?? "");
      const result = await verifyLockPinAction(pin);
      if (!result.ok) {
        setMessage(result.message ?? "解除できませんでした。");
        return;
      }
      sessionStorage.setItem("zezehibi:unlocked", "true");
      router.replace(next);
      router.refresh();
    });
  }

  function continueWithoutPin() {
    sessionStorage.setItem("zezehibi:unlocked", "true");
    router.replace(next);
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-soft">
      <div className="mb-6">
        <div className="mb-4 grid size-12 place-items-center rounded-lg bg-mist text-lake">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl font-semibold">ロック解除</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          ログイン状態のままでも、日記画面はPINで保護します。
        </p>
      </div>

      {pinConfigured ? (
        <form action={unlock} className="space-y-4">
          <Field label="PIN">
            <Input required inputMode="numeric" pattern="[0-9]*" name="pin" type="password" minLength={4} maxLength={6} autoFocus />
          </Field>
          {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "確認中..." : "解除する"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
            PINはまだ設定されていません。設定画面から追加できます。
          </p>
          <Button className="w-full" onClick={continueWithoutPin}>
            続ける
          </Button>
        </div>
      )}
    </div>
  );
}
