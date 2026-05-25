"use client";

import { useRecordModal } from "@/lib/store/record-modal";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * Timeline 空态 CTA：当前筛选下没有记录时，引导用户记录第一条。
 * Timeline 是 server component，需要 client 包装才能调 useRecordModal。
 */
export function TimelineEmptyCTA() {
  const show = useRecordModal((s) => s.show);
  return (
    <EmptyState
      icon="ti-clock"
      title="这个区间还没有记录"
      description="切换上方筛选看看其他类别，或者现在就记一条。"
      actions={[{ label: "记录一条", primary: true, onClick: () => show() }]}
    />
  );
}
