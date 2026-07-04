import { WorkspaceLoading } from "@/components/workspace-loading";

export default function LeadListsLoading() {
  return <WorkspaceLoading title="Loading lead lists" steps={["Loading lead lists", "Counting saved leads", "Preparing list actions"]} />;
}
