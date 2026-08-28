import { AssessmentTaker } from "@/components/assessment/AssessmentTaker";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssessmentTaker assessmentId={id} />;
}
