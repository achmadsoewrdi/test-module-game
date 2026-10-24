import { notFound } from "next/navigation";
import { getModuleById } from "@/lib/services/module-service";
import ModuleEditor from "@/components/module-editor";

export default async function ModuleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moduleItem = await getModuleById(id);

  if (!moduleItem) {
    notFound();
  }

  // Cast type to match client component interface
  const formattedModule = {
    id: moduleItem.id,
    slug: moduleItem.slug,
    title: moduleItem.title,
    description: moduleItem.description,
    status: moduleItem.status as "draft" | "published" | "archived",
    currentVersionId: moduleItem.currentVersionId,
    versions: moduleItem.versions.map((v) => ({
      id: v.id,
      versionNo: v.versionNo,
      manifest: v.manifest as any,
      sourceHtml: v.sourceHtml,
      sourceCss: v.sourceCss,
      sourceJs: v.sourceJs,
      checksumSha256: v.checksumSha256,
      createdAt: v.createdAt.toISOString(),
    })),
  };

  return <ModuleEditor initialModule={formattedModule} />;
}
