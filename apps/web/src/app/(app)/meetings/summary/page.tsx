"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Legacy route — demo summary content removed. */
export default function SummaryPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meeting summary</h1>
        <p className="mt-1 text-sm text-muted">
          Open a meeting from your Meetings list to view its real summary.
        </p>
      </div>
      <Card className="p-6">
        <p className="text-sm text-muted">No meetings yet.</p>
        <div className="mt-4">
          <Link href="/meetings">
            <Button size="sm" variant="outline">
              Go to Meetings
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
