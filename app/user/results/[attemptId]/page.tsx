import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function ResultStatus({ params }: PageProps<"/user/results/[attemptId]">) {
  const { attemptId } = await params;
  return <main className="result-status"><section><CheckCircle2 size={34}/><p className="exam-kicker">Assessment submitted</p><h1>Your assessment was recorded</h1><p>Your responses were automatically submitted after fullscreen mode was exited. Your result will be available when assessment processing is complete.</p><small>Attempt reference: {attemptId}</small><Link href="/user" className="exam-primary">Return to dashboard</Link></section></main>;
}
