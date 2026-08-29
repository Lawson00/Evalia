import { redirect } from "next/navigation";

export default function CandidateDetailRedirect() {
  redirect("/admin/assignments");
}
