import { NextRequest, NextResponse } from "next/server";
import {
  fetchDocumentClauseTree,
  fetchDocuments,
  fetchJurisdictionDataset,
} from "@/lib/data";
import {
  formatHumanDate,
  formatPlainDocumentTitle,
  resolveCodeSubject,
} from "@/lib/plain-language";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "";
  const jurId = searchParams.get("id") || "";
  const docId = searchParams.get("doc") || "";
  const eid = searchParams.get("eid") || "";
  const topic = searchParams.get("topic") || "";

  if (!jurId) {
    return new NextResponse("Missing jurisdiction id", { status: 400 });
  }

  if (kind === "provision" && docId && eid) {
    const [docs, tree] = await Promise.all([
      fetchDocuments(jurId),
      fetchDocumentClauseTree(jurId, docId),
    ]);
    const doc = docs.find((d) => d.doc_id === docId);
    const clause = tree?.clauses.find(
      (c) => c.eid === eid || c.number === eid || c.clause_id === `${docId}:${eid}`
    );
    if (!doc || !clause) {
      return new NextResponse("Provision not found", { status: 404 });
    }
    const plainTitle = formatPlainDocumentTitle(doc, docId);
    const pdfUrl = doc.official_url || doc.source_url || "";
    const vers = clause.versions || [];
    const latestVer = vers.length > 0 ? vers[vers.length - 1] : null;
    const page =
      latestVer?.citations?.[0]?.page ?? clause.citations?.[0]?.page ?? 1;
    const text = (latestVer?.content || clause.text || "").trim();
    const md = [
      `# ${clause.number || clause.eid}${clause.heading ? ` — ${clause.heading}` : ""}`,
      ``,
      `- **Instrument**: ${plainTitle} (\`${doc.doc_id}\`)`,
      `- **Provision EID**: \`${clause.eid}\``,
      `- **Legal status**: \`${clause.legal_status || doc.legal_status}\``,
      `- **Verification**: \`${clause.verification || "machine_checked"}\``,
      `- **Cited page**: [p. ${page}](${pdfUrl}#page=${page})`,
      ``,
      `## Verbatim Text`,
      ``,
      text,
      ``,
    ].join("\n");
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  if (kind === "document" && docId) {
    const [docs, tree] = await Promise.all([
      fetchDocuments(jurId),
      fetchDocumentClauseTree(jurId, docId),
    ]);
    const doc = docs.find((d) => d.doc_id === docId);
    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }
    const plainTitle = formatPlainDocumentTitle(doc, docId);
    const effDate = formatHumanDate(doc.effective_from || doc.notified_date);
    const pdfUrl = doc.official_url || doc.source_url || "";
    const lines = [
      `# ${plainTitle}`,
      ``,
      `- **Official title**: ${doc.title}`,
      `- **Document ID**: \`${doc.doc_id}\``,
      `- **Issuing authority**: ${doc.issuing_authority}`,
      `- **Status**: \`${doc.legal_status}\` (${effDate})`,
      `- **Official PDF**: ${pdfUrl}`,
      ``,
      `## Provisions`,
      ``,
    ];
    for (const c of (tree?.clauses ?? []).slice(0, 200)) {
      if (c.type === "table_row") continue;
      const page = c.citations?.[0]?.page ?? 1;
      lines.push(
        `### ${c.number || c.eid}${c.heading ? ` · ${c.heading}` : ""} ([p. ${page}](${pdfUrl}#page=${page}))`,
        ``,
        (c.text || "").trim(),
        ``
      );
    }
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  if (kind === "topic" && topic) {
    const dataset = await fetchJurisdictionDataset(jurId);
    const subj = resolveCodeSubject(topic, dataset?.relations?.topics);
    if (!dataset || !subj) {
      return new NextResponse("Subject not found", { status: 404 });
    }
    const md = [
      `# ${subj.title} — ${dataset.jurisdiction.name}`,
      ``,
      `> ${subj.summary}`,
      ``,
      `## Why This Rule Applies`,
      ``,
      subj.whyAppliesLine,
      ``,
    ].join("\n");
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}
