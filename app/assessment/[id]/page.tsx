import { AssessmentTaker } from "../components/AssessmentTaker";

export default async function AssessmentPage({ params }: PageProps<"/assessment/[id]">) {
  const { id } = await params;
  return <AssessmentTaker assessmentId={id} />;
}
