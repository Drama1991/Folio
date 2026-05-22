import { notFound } from "next/navigation";
import { getReview, NeoDBError } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { ReviewEditor } from "@/components/review-editor/ReviewEditor";

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function ReviewEditPage({ params }: PageProps) {
  const { uuid } = await params;
  let review;
  try {
    review = await getReview(uuid);
  } catch (err) {
    if (err instanceof NeoDBError && err.status === 404) notFound();
    throw err;
  }
  const ui = itemToUi(review.item);
  return (
    <ReviewEditor
      uuid={ui.uuid}
      medium={ui.medium}
      title={ui.title}
      cover={ui.cover ?? undefined}
      year={ui.year}
      creator={ui.creator}
      initialTitle={review.title}
      initialBody={review.body}
      initialVisibility={review.visibility as 0 | 1 | 2}
      mode="edit"
    />
  );
}
