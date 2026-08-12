export const stats = [
  { label: "Meetings this week", value: "24", delta: "+18%", tone: "up" as const },
  { label: "AI answers pinned", value: "86", delta: "+12%", tone: "up" as const },
  { label: "Hours transcribed", value: "41.2", delta: "+9%", tone: "up" as const },
  { label: "Action items closed", value: "63%", delta: "+4%", tone: "up" as const },
];

export const recentMeetings = [
  {
    id: "m1",
    title: "Q3 Product Sync",
    time: "Today · 10:00 AM",
    duration: "42m",
    attendees: 8,
    status: "summary" as const,
    tags: ["Product", "Roadmap"],
  },
  {
    id: "m2",
    title: "Enterprise Security Review",
    time: "Today · 2:30 PM",
    duration: "28m",
    attendees: 5,
    status: "live" as const,
    tags: ["Security"],
  },
  {
    id: "m3",
    title: "Customer Success Weekly",
    time: "Yesterday",
    duration: "55m",
    attendees: 12,
    status: "summary" as const,
    tags: ["CS"],
  },
  {
    id: "m4",
    title: "Design Critique — CueAI Companion",
    time: "Mon",
    duration: "36m",
    attendees: 6,
    status: "summary" as const,
    tags: ["Design"],
  },
];

export const activity = [
  { id: 1, text: "Pinned answer from Q3 Product Sync", time: "12m ago" },
  { id: 2, text: "Resume version v3 exported as PDF", time: "1h ago" },
  { id: 3, text: "Knowledge base: 4 docs re-indexed", time: "3h ago" },
  { id: 4, text: "Translation session · EN ↔ HI completed", time: "Yesterday" },
];

export const usageSeries = [
  { day: "Mon", meetings: 4, tokens: 120 },
  { day: "Tue", meetings: 6, tokens: 180 },
  { day: "Wed", meetings: 3, tokens: 95 },
  { day: "Thu", meetings: 7, tokens: 210 },
  { day: "Fri", meetings: 5, tokens: 160 },
  { day: "Sat", meetings: 1, tokens: 40 },
  { day: "Sun", meetings: 2, tokens: 55 },
];

export const transcript = [
  {
    id: 1,
    speaker: "Priya Nair",
    role: "PM",
    text: "Let's align on the enterprise rollout timeline for CueAI Companion.",
    time: "00:02:14",
    confidence: 0.98,
  },
  {
    id: 2,
    speaker: "Alex Chen",
    role: "You",
    text: "We can ship the always-on glass panel in two sprints if screen context stays opt-in.",
    time: "00:02:41",
    confidence: 0.96,
  },
  {
    id: 3,
    speaker: "Marcus Lee",
    role: "Eng",
    text: "What's our latency budget for real-time answers during Zoom calls?",
    time: "00:03:05",
    confidence: 0.94,
  },
  {
    id: 4,
    speaker: "Priya Nair",
    role: "PM",
    text: "Sub-800ms for suggestions. Summaries can be async after the call ends.",
    time: "00:03:22",
    confidence: 0.97,
  },
];

export const aiAnswers = [
  {
    id: "a1",
    question: "Latency budget for real-time answers?",
    answer:
      "Target p95 < 800ms for suggestion cards. Use streaming tokens and local transcript buffer; defer full RAG to background when confidence < 0.7.",
    pinned: true,
  },
  {
    id: "a2",
    question: "Enterprise rollout timeline?",
    answer:
      "Phase 1: Companion + live transcript (2 sprints). Phase 2: Screen context opt-in + admin controls. Phase 3: SSO / SCIM and retention policies.",
    pinned: false,
  },
];

export const actionItems = [
  {
    id: "ai1",
    title: "Finalize Companion latency SLOs",
    owner: "Marcus Lee",
    due: "Aug 12",
    status: "open" as const,
  },
  {
    id: "ai2",
    title: "Draft opt-in privacy copy for screen capture",
    owner: "Alex Chen",
    due: "Aug 10",
    status: "open" as const,
  },
  {
    id: "ai3",
    title: "Share enterprise SSO checklist with Security",
    owner: "Priya Nair",
    due: "Aug 14",
    status: "done" as const,
  },
];

export const knowledgeDocs = [
  {
    id: "d1",
    name: "CueAI Security Whitepaper.pdf",
    folder: "Security",
    tags: ["SOC2", "Enterprise"],
    updated: "2d ago",
    size: "2.4 MB",
  },
  {
    id: "d2",
    name: "Pricing & Packaging Q3.md",
    folder: "GTM",
    tags: ["Pricing"],
    updated: "5d ago",
    size: "48 KB",
  },
  {
    id: "d3",
    name: "Companion Architecture.docx",
    folder: "Engineering",
    tags: ["Architecture"],
    updated: "1w ago",
    size: "1.1 MB",
  },
  {
    id: "d4",
    name: "Customer Objection Library.xlsx",
    folder: "Sales",
    tags: ["Objections", "Playbook"],
    updated: "3d ago",
    size: "320 KB",
  },
];

export const testimonials = [
  {
    quote:
      "CueAI feels like having a chief of staff in every meeting. The live answers are uncannily relevant.",
    name: "Sarah Kim",
    role: "VP Product, Northstar",
  },
  {
    quote:
      "We cut follow-up time by half. Summaries and action items land before people leave the call.",
    name: "James Okonkwo",
    role: "Head of Ops, Lumen",
  },
  {
    quote:
      "Enterprise admins finally get the controls they need without slowing the team down.",
    name: "Elena Rossi",
    role: "CISO, Helix Cloud",
  },
];

export const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/seat/mo",
    desc: "For individuals who want an AI meeting edge.",
    features: ["Live transcription", "Meeting summaries", "5 hrs / month", "Basic knowledge base"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/seat/mo",
    desc: "For teams shipping with real-time AI copilots.",
    features: [
      "Everything in Starter",
      "Unlimited meetings",
      "Resume Tailor",
      "Desktop Companion",
      "Screen Context AI",
    ],
    cta: "Start Free",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Security, admin, and scale for global orgs.",
    features: [
      "SSO / SCIM",
      "Admin portal",
      "Audit logs",
      "Retention policies",
      "Dedicated models",
    ],
    cta: "Book Demo",
    highlighted: false,
  },
];

export const faqs = [
  {
    q: "Does CueAI work with Zoom, Meet, and Teams?",
    a: "Yes. CueAI captures system audio via the Desktop Companion and works alongside Zoom, Google Meet, Microsoft Teams, and browser-based calls.",
  },
  {
    q: "Is my meeting data private?",
    a: "Meetings are encrypted in transit and at rest. Enterprise plans support private model endpoints, retention policies, and region locks.",
  },
  {
    q: "Can I use CueAI without screen sharing?",
    a: "Absolutely. Screen Context is opt-in. Core transcription and AI answers work from audio alone.",
  },
  {
    q: "Do you support Hindi and Telugu?",
    a: "Yes. Live bilingual transcription and AI response translation are available for English, Hindi, and Telugu.",
  },
];

export const adminUsers = [
  { name: "Alex Chen", email: "alex@acme.com", role: "Admin", status: "Active" },
  { name: "Priya Nair", email: "priya@acme.com", role: "Member", status: "Active" },
  { name: "Marcus Lee", email: "marcus@acme.com", role: "Member", status: "Active" },
  { name: "Jordan Blake", email: "jordan@acme.com", role: "Viewer", status: "Invited" },
];
