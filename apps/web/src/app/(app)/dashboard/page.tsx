"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  FileText,
  Library,
  Monitor,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Progress } from "@/components/ui/misc";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { greetingFor } from "@/lib/auth";
import "./dashboard.css";

const fade: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.04 * i,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

type MeetingRow = {
  id: string;
  title: string;
  status?: string;
  startedAt?: string;
  durationSec?: number;
  attendees?: number;
};

const quickActions = [
  { href: "/resume", icon: FileText, label: "Tailor a resume" },
  { href: "/knowledge", icon: Library, label: "Upload to Knowledge" },
  { href: "/screen-context", icon: Monitor, label: "Enable Screen AI" },
  { href: "/translation", icon: Sparkles, label: "Start translation" },
];

const emptyUsage = [
  { day: "Mon", tokens: 0 },
  { day: "Tue", tokens: 0 },
  { day: "Wed", tokens: 0 },
  { day: "Thu", tokens: 0 },
  { day: "Fri", tokens: 0 },
  { day: "Sat", tokens: 0 },
  { day: "Sun", tokens: 0 },
];

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return "—";
  const m = Math.round(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function DashboardPage() {
  const { session, ready } = useAuth();
  const { theme } = useTheme();
  const name = session?.name || "there";
  const workspace = session?.workspace || "Your Workspace";
  const isLight = theme === "light";
  const chartTick = isLight ? "#999999" : "#666666";
  const chartStroke = isLight ? "#090909" : "#ffffff";
  const tooltipStyle = {
    background: isLight ? "#ffffff" : "#1c1c1c",
    border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid #262626",
    borderRadius: 12,
    fontSize: 12,
    color: isLight ? "#090909" : "#ffffff",
  };

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/meetings", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          meetings?: MeetingRow[];
        };
        if (!cancelled) setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
      } catch {
        if (!cancelled) setMeetings([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const meetingCount = meetings.length;
  const pinnedAnswers = 0;
  const hoursTranscribed = meetings.reduce(
    (sum, m) => sum + (typeof m.durationSec === "number" ? m.durationSec : 0),
    0,
  );
  const hoursLabel = (hoursTranscribed / 3600).toFixed(1);

  const stats = [
    {
      label: "Meetings this week",
      value: loaded ? String(meetingCount) : "—",
      delta: loaded ? (meetingCount ? "From your workspace" : "No meetings yet") : "Loading…",
    },
    {
      label: "Completed sessions",
      value: loaded ? String(meetingCount) : "—",
      delta: loaded ? (meetingCount ? "Saved history" : "None yet") : "Loading…",
    },
    {
      label: "Hours transcribed",
      value: loaded ? hoursLabel : "—",
      delta: loaded ? (hoursTranscribed ? "From saved sessions" : "No activity data yet") : "Loading…",
    },
    {
      label: "AI answers pinned",
      value: loaded ? String(pinnedAnswers) : "—",
      delta: loaded ? (pinnedAnswers ? "Saved" : "None pinned yet") : "Loading…",
    },
  ];

  const recent = meetings.filter((m) => m.status !== "live").slice(0, 5);

  return (
    <div data-dashboard>
      <motion.header
        className="db-hero"
        custom={0}
        variants={fade}
        initial="hidden"
        animate="show"
      >
        <div className="db-hero-copy">
          <h1 className="db-hero-title">
            {ready ? greetingFor(name) : "Welcome"}
          </h1>
          <p className="db-hero-sub">
            {session
              ? `${workspace} · signed in as ${session.email}`
              : "Your AI copilot is ready. Sign up to personalize this workspace."}
          </p>
        </div>
      </motion.header>

      <div className="db-metrics">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="db-metric"
            custom={i + 1}
            variants={fade}
            initial="hidden"
            animate="show"
          >
            <p className="db-metric-label">{s.label}</p>
            <p className="db-metric-value">{s.value}</p>
            <p className="db-metric-delta">
              {meetingCount > 0 && i === 0 ? (
                <ArrowUpRight className="mr-0.5 inline h-3 w-3" />
              ) : null}
              {s.delta}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="db-main">
        <motion.section
          className="db-panel"
          custom={5}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <div className="db-panel-head">
            <div>
              <h2 className="db-section-title">Weekly AI usage</h2>
              <p className="db-section-sub">
                {meetingCount
                  ? "Based on your saved sessions"
                  : "No activity data available yet"}
              </p>
            </div>
            <span className="db-chip">This week</span>
          </div>
          <div className="db-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emptyUsage}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0099ff" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#0099ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartTick, fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke={chartStroke}
                  fill="url(#usageFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          className="db-panel db-meters"
          custom={6}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <div>
            <h2 className="db-section-title">Resource usage</h2>
            <p className="db-section-sub">Usage meters (zeros until billing/usage APIs connect)</p>
          </div>
          <div className="space-y-5">
            <div>
              <div className="db-meter-row">
                <span className="db-meter-label">AI tokens</span>
                <span className="db-meter-hint">No usage data yet</span>
              </div>
              <Progress value={0} />
            </div>
            <div>
              <div className="db-meter-row">
                <span className="db-meter-label">Storage</span>
                <span className="db-meter-hint">No usage data yet</span>
              </div>
              <Progress value={0} />
            </div>
            <div>
              <div className="db-meter-row">
                <span className="db-meter-label">Desktop Companion</span>
                <span className="db-meter-hint">Check Desktop status</span>
              </div>
              <Progress value={0} />
            </div>
          </div>
          <p className="db-plan-note">
            Manage your plan in{" "}
            <Link href="/settings" className="db-link">
              Settings
            </Link>
          </p>
        </motion.section>
      </div>

      <div className="db-lower">
        <motion.section
          className="db-panel"
          custom={7}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <div className="db-panel-head">
            <div>
              <h2 className="db-section-title">Recent meetings</h2>
              <p className="db-section-sub">Jump back into context</p>
            </div>
            <Link href="/meetings" className="db-link">
              View all
            </Link>
          </div>
          <div>
            {recent.length === 0 ? (
              <p className="db-section-sub" style={{ padding: "12px 0" }}>
                No meetings yet.
              </p>
            ) : (
              recent.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}/summary`}
                  className="db-meeting"
                >
                  <div>
                    <p className="db-meeting-title">{m.title}</p>
                    <p className="db-meeting-meta">
                      {m.startedAt || "Saved session"}
                      {typeof m.attendees === "number"
                        ? ` · ${m.attendees} people`
                        : ""}
                    </p>
                  </div>
                  <div className="db-meeting-side">
                    {formatDuration(m.durationSec)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          className="db-panel"
          custom={8}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <div className="db-panel-head">
            <h2 className="db-section-title">Quick actions</h2>
          </div>
          <div className="db-actions">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className="db-action">
                <span>{a.label}</span>
                <a.icon className="db-action-icon h-4 w-4" />
              </Link>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="db-panel"
          custom={9}
          variants={fade}
          initial="hidden"
          animate="show"
        >
          <div className="db-panel-head">
            <h2 className="db-section-title">Activity</h2>
          </div>
          <div className="db-activity">
            <p className="db-section-sub" style={{ padding: "8px 0" }}>
              No activity data available yet.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
