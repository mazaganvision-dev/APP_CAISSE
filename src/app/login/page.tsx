import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <Suspense fallback={<p className="text-sm text-zinc-500">Chargement…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
