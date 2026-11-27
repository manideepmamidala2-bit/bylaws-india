import type { MetadataRoute } from "next";
import {
  fetchDocuments,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { CODE_SUBJECTS } from "@/lib/plain-language";
import { getSiteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteCfg = getSiteConfig();
  const baseUrl = siteCfg.siteUrl.replace(/\/+$/, "");
  const manifest = await fetchManifest().catch(() => null);
  const visible = manifest ? getVisibleJurisdictions(manifest) : [];
  const lastModified = new Date("2026-11-26T00:00:00Z");

  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pilot`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/checks`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/join`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/press`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/use-with-ai`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/data`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];

  for (const jur of visible) {
    entries.push(
      {
        url: `${baseUrl}/j/${jur.id}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/j/${jur.id}/wards`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/j/${jur.id}/topics`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/j/${jur.id}/timeline`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/j/${jur.id}/sources`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      }
    );

    for (const subj of CODE_SUBJECTS) {
      entries.push({
        url: `${baseUrl}/j/${jur.id}/topics/${subj.slug}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    const docs = await fetchDocuments(jur.id).catch(() => []);
    for (const doc of docs) {
      entries.push({
        url: `${baseUrl}/j/${jur.id}/documents/${doc.doc_id}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    }
  }

  return entries;
}
