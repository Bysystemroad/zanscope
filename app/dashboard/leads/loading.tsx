import { WorkspaceLoading } from "@/components/workspace-loading";

export default function SavedLeadsLoading() {
  return <WorkspaceLoading title="Loading saved leads" steps={["Loading saved leads", "Preparing filters", "Rendering lead table"]} />;
}
