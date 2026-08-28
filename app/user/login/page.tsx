import { redirect } from "next/navigation";

export default function LegacyCandidateLoginPage() {
  redirect("/auth/candidate");
}
