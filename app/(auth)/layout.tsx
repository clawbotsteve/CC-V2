import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-[#111827] flex flex-col items-center justify-center">
      <div className="flex-1 w-full flex items-center justify-center">
        {children}
      </div>
      <div className="w-full px-4 py-4 text-center text-xs text-zinc-500">
        <p className="mb-1">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-zinc-300">Terms</Link>,{" "}
          <Link href="/aup" className="underline hover:text-zinc-300">Acceptable Use Policy</Link>, and{" "}
          <Link href="/privacy" className="underline hover:text-zinc-300">Privacy Policy</Link>, and confirm
          you are at least 18 and located in the United States.
        </p>
      </div>
    </main>
  );
}
