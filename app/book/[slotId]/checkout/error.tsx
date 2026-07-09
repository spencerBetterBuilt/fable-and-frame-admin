"use client";

import Link from "next/link";

export default function CheckoutError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink mb-4">
        We couldn&apos;t start checkout
      </h1>
      <p className="font-body text-ink/80 mb-6">
        Something went wrong reaching our payment provider. Please try again
        in a moment.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="font-body text-sm underline text-dusty-blue-deep"
        >
          Try again
        </button>
        <Link href="/" className="font-body text-sm underline text-dusty-blue-deep">
          Back to available sessions
        </Link>
      </div>
    </main>
  );
}
