import Link from "next/link";
import { AdminSidebar, AdminHeader } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        {/* Main Content */}
        <main className="ml-64 flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
