import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const CTA_CLASSES =
  "inline-block bg-ink text-ivory font-body text-sm uppercase tracking-[0.08em] px-10 py-[18px] rounded-none hover:bg-cinematic-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center";

export function CtaButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={`${CTA_CLASSES} ${className ?? ""}`}
    />
  );
}

export function CtaLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${CTA_CLASSES} ${className ?? ""}`}>
      {children}
    </Link>
  );
}
