import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="flex w-full items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <ThemeToggle compact />
        {user ? <SignOutButton compact /> : null}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
