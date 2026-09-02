import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">

        <AdminSidebar />

        <div className="ml-64">

          <AdminTopbar />

          <main className="p-6">
            {children}
          </main>

        </div>

      </div>
    </AdminAuthGuard>
  );
}