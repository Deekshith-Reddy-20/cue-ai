"use client";

import Link from "next/link";
import { Search, Video, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { recentMeetings } from "@/lib/mock-data";

export default function MeetingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Meetings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Live sessions, recordings, and AI summaries in one place.
          </p>
        </div>
        <Link href="/meetings/live">
          <Button variant="gradient">
            <Video className="h-4 w-4" />
            New live session
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Search meetings…"
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recentMeetings.map((m) => (
          <Link
            key={m.id}
            href={
              m.status === "live" ? "/meetings/live" : `/meetings/${m.id}/summary`
            }
          >
            <Card hover className="h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-muted)] text-primary">
                  <Video className="h-5 w-5" />
                </div>
                {m.status === "live" ? (
                  <Badge variant="success">Live</Badge>
                ) : (
                  <Badge>Summary ready</Badge>
                )}
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{m.title}</h3>
              <p className="mt-1 text-sm text-muted">
                {m.time} · {m.duration} · {m.attendees} attendees
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <Badge key={t} variant="info">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
