import { redirect } from "next/navigation";

export default function LegacyAdminSignupPage() {
  redirect("/auth/admin?mode=signup");
}
