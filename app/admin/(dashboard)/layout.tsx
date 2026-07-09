import Link from "next/link";
import { logout } from "./actions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-sage-deep/30">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg text-ink">Fable &amp; Frame Admin</span>
          <Link href="/admin" className="font-body text-sm text-ink/80 hover:text-ink">
            Dashboard
          </Link>
          <Link href="/admin/slots" className="font-body text-sm text-ink/80 hover:text-ink">
            Slots
          </Link>
          <Link href="/admin/session-types" className="font-body text-sm text-ink/80 hover:text-ink">
            Session Types
          </Link>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="font-body text-sm text-ink/80 hover:text-ink underline"
          >
            Log out
          </button>
        </form>
      </nav>
      <div className="flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
