"use client";
import { apiFetch } from "@/lib/api";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
  async function checkAdmin() {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const response = await apiFetch("/admin/me", {
        method: "GET",
      }); 
      console.log(
  "ADMIN API URL:",
  process.env.NEXT_PUBLIC_API_URL
);
      if (!response.ok) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");

        router.replace("/admin/login");
        return;
      }

      setAuthenticated(true);

    } catch (error) {
      console.error("Admin authentication error:", error);

      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");

      router.replace("/admin/login");

    } finally {
      setLoading(false);
    }
  }

  checkAdmin();
}, [router]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }


  if (!authenticated) {
    return null;
  }


  return children;
}