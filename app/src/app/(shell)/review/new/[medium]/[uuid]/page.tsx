import { notFound } from "next/navigation";
import { getItem } from "@/lib/neodb/client";
import { itemToUi } from "@/lib/neodb/mappers";
import { ALL_UI_MEDIUMS } from "@/lib/neodb/mediumMap";
import { ReviewEditor } from "@/components/review-editor/ReviewEditor";
import type { UiMedium } from "@/lib/format/verbs";

interface PageProps {
  params: Promise<{ medium: string; uuid: string }>;
}

export default async function ReviewEditorPage({ params }: PageProps) {
  const { medium: rawMedium, uuid } = await params;
  if (!ALL_UI_MEDIUMS.includes(rawMedium as UiMedium)) notFound();
  const medium = rawMedium as UiMedium;

  let ui;
  try {
    ui = itemToUi(await getItem({ medium, uuid }));
  } catch {
    notFound();
  }
  return <ReviewEditor uuid={uuid} medium={medium} title={ui.title} cover={ui.cover ?? undefined} year={ui.year} creator={ui.creator} />;
}
