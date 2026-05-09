import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/authService";
import { DashboardLayoutClient } from "@/components/user/DashboardLayoutClient";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient
      user={{
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        hasStudentAccount: user.hasStudentAccount,
        sellerTier: user.sellerTier,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}