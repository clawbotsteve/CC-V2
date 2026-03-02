// app/(dashboard)/layout.tsx
import TopNavbar from "@/components/layout/top-navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-y-auto">
      <TopNavbar />
      <main className="pt-16">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
