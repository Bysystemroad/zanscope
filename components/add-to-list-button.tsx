"use client";

import { useEffect, useState } from "react";
import { ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeadListOption = {
  id: string;
  name: string;
  description?: string;
  lead_count?: number;
};

export function AddToListButton({ leadIds, disabled }: { leadIds: string[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<LeadListOption[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadLists() {
      const response = await fetch("/api/lead-lists");
      const data = (await response.json()) as { lists?: LeadListOption[]; error?: string };
      setLists(data.lists || []);
      setSelectedListId((current) => current || data.lists?.[0]?.id || "");
      if (data.error) setMessage(data.error);
    }

    loadLists().catch((error) => setMessage(error instanceof Error ? error.message : String(error)));
  }, [open]);

  async function createList() {
    const name = newListName.trim();
    if (!name) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/lead-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = (await response.json()) as { list?: LeadListOption; error?: string };

      if (!response.ok || !data.list) {
        throw new Error(data.error || "Could not create list.");
      }

      setLists((current) => [data.list as LeadListOption, ...current]);
      setSelectedListId(data.list.id);
      setNewListName("");
      setMessage("List created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function addToList() {
    if (!selectedListId || leadIds.length === 0) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/lead-lists/${selectedListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds })
      });
      const data = (await response.json()) as { added?: number; skipped?: number; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not add leads to list.");
      }

      setMessage(`${data.added || 0} leads added. ${data.skipped || 0} skipped.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" disabled={disabled || leadIds.length === 0} onClick={() => setOpen(true)}>
        <ListPlus className="h-4 w-4" />
        Add to List
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Add leads to list</h2>
              <p className="text-sm text-muted-foreground">{leadIds.length} selected leads</p>
            </div>
            <div className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/30"
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
              >
                <option value="">Choose a list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-white/30"
                  placeholder="Create new list"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                />
                <Button type="button" variant="secondary" disabled={loading || !newListName.trim()} onClick={createList}>
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
              {message && <div className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="button" disabled={loading || !selectedListId || leadIds.length === 0} onClick={addToList}>
                Add selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
