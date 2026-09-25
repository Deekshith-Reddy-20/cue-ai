import { redirect } from "next/navigation";

/** Alias for the Resume Tailor product (canonical route: /resume). */
export default function ResumeTailorAliasPage() {
  redirect("/resume");
}
