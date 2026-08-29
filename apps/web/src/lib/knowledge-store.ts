export type KnowledgeDoc = {
  id: string;
  name: string;
  folder: string;
  tags: string[];
  updated: string;
  size: string;
  preview: string;
};

const STORAGE_KEY = "cueai-knowledge-docs";

const SEED: KnowledgeDoc[] = [
  {
    id: "d1",
    name: "CueAI Security Whitepaper.pdf",
    folder: "Security",
    tags: ["SOC2", "Enterprise"],
    updated: "2d ago",
    size: "2.4 MB",
    preview:
      "CueAI encrypts meeting data in transit and at rest. Enterprise workspaces can enforce region locks, retention policies, and private model endpoints.",
  },
  {
    id: "d2",
    name: "Pricing & Packaging Q3.md",
    folder: "GTM",
    tags: ["Pricing"],
    updated: "5d ago",
    size: "48 KB",
    preview:
      "Pro plan is $79 / seat / month. Free tier includes 3 live sessions and basic companion overlay.",
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function guessFolder(name: string): string {
  const lower = name.toLowerCase();
  if (/security|soc|privacy|compliance/.test(lower)) return "Security";
  if (/price|gtm|sales|packaging/.test(lower)) return "GTM";
  if (/arch|api|eng|companion|desktop/.test(lower)) return "Engineering";
  if (/sales|crm|outreach/.test(lower)) return "Sales";
  return "Engineering";
}

export function loadKnowledgeDocs(): KnowledgeDoc[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    const parsed = JSON.parse(raw) as KnowledgeDoc[];
    return Array.isArray(parsed) && parsed.length ? parsed : [...SEED];
  } catch {
    return [...SEED];
  }
}

function saveKnowledgeDocs(docs: KnowledgeDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export async function addKnowledgeFiles(files: FileList | File[]): Promise<KnowledgeDoc[]> {
  const list = Array.from(files);
  const docs = loadKnowledgeDocs();
  for (const file of list) {
    let preview = "";
    try {
      const text = await file.text();
      preview = text.slice(0, 1200).trim() || `Uploaded file: ${file.name}`;
    } catch {
      preview = `Binary upload stored locally: ${file.name}`;
    }
    docs.unshift({
      id: crypto.randomUUID(),
      name: file.name,
      folder: guessFolder(file.name),
      tags: ["Uploaded"],
      updated: "just now",
      size: formatSize(file.size),
      preview,
    });
  }
  saveKnowledgeDocs(docs);
  return docs;
}

export function deleteKnowledgeDoc(id: string): KnowledgeDoc[] {
  const docs = loadKnowledgeDocs().filter((d) => d.id !== id);
  saveKnowledgeDocs(docs);
  return docs;
}

export function reindexKnowledgeDocs(): KnowledgeDoc[] {
  const docs = loadKnowledgeDocs().map((d) => ({
    ...d,
    updated: "just now",
    tags: d.tags.includes("Indexed") ? d.tags : [...d.tags, "Indexed"],
  }));
  saveKnowledgeDocs(docs);
  return docs;
}
