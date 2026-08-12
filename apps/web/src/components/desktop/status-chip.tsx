"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getDesktop, isDesktopApp, type DesktopStatus } from "@/lib/desktop";
import { MonitorSmartphone } from "lucide-react";

export function DesktopStatusChip() {
  const [status, setStatus] = useState<DesktopStatus | null>(null);

  useEffect(() => {
    if (!isDesktopApp()) return;
    void getDesktop()
      ?.getStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  return (
    <Badge variant="info" className="hidden items-center gap-1 sm:inline-flex">
      <MonitorSmartphone className="h-3 w-3" />
      Desktop
      {status.companionVisible ? " · Companion" : ""}
      {status.captureExcluded ? " · Private" : ""}
      {status.screenSharing ? " · Sharing" : ""}
    </Badge>
  );
}
