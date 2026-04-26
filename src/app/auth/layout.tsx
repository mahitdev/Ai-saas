import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#1f2937_0%,#09090b_40%,#000000_100%)] p-6 text-zinc-50 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute left-6 top-6 flex items-center gap-2 md:left-10 md:top-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Home className="size-3.5" />
          Front page
        </Link>
      </div>
      <div className="w-full max-w-md pt-12 md:pt-8">{children}</div>
    </div>
  );
};

export default Layout;
