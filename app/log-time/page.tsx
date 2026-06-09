"use client";

import { PageHeader } from "@/components/page-header";
import { TimeLogger } from "@/components/time-logger";

export default function LogTimePage() {
  return (
    <>
      <PageHeader
        eyebrow="Time tracking"
        title="Log time"
        description="Use the live timer while you work or record a completed session manually."
      />
      <div className="max-w-2xl">
        <TimeLogger />
      </div>
    </>
  );
}
