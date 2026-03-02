export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full bg-[#111827] flex items-center justify-center">
      {children}
    </main>
  );
}
