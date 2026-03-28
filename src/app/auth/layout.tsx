import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="from-muted via-background to-muted/30 relative flex min-h-svh items-center justify-center bg-gradient-to-b p-6 md:p-10">
      <div className="absolute left-6 top-6 flex items-center gap-2 md:left-10 md:top-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition hover:text-foreground"
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
