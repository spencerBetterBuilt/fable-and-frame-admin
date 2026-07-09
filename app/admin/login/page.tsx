import { login } from "./actions";
import { CtaButton } from "@/components/CtaButton";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <form
        action={login}
        className="w-full max-w-sm flex flex-col gap-5 border border-sage-deep/30 px-8 py-10"
      >
        <h1 className="font-display text-2xl text-ink mb-2">Admin Login</h1>

        {error && (
          <p className="font-body text-sm text-ink border border-ink/40 px-4 py-3">
            Incorrect password.
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep"
          />
        </label>

        <CtaButton type="submit">Log In</CtaButton>
      </form>
    </main>
  );
}
