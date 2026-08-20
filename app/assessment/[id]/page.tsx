import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default async function AssessmentEntryPage({ params }: PageProps<"/assessment/[id]">) {
  const { id } = await params;
  return <main className="assessment-entry"><section className="entry-card"><div className="entry-icon"><ShieldCheck size={28} /></div><p className="eyebrow">Assessment ready</p><h1>You’re about to begin</h1><p className="entry-copy">Your assessment will open in the Assessment Taker window. Review the requirements there before starting.</p><div className="entry-meta">Assessment ID: {id}</div><button className="primary-button" type="button">Open assessment</button><Link href="/user" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link></section></main>;
}
