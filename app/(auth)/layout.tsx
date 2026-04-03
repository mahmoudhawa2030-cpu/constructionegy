import { LocaleSwitcher } from "@/components/locale-switcher";
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
        className="flex w-full items-center justify-between gap-2 border-b border-bina-border bg-bina-topbar/95 px-3 py-2 backdrop-blur-md"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <LocaleSwitcher />
        </div>
        {user ? <SignOutButton compact /> : null}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
