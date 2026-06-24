"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadListRecord } from "@/lib/supabase/server";

export function LeadListsManager({ initialLists }: { initialLists: LeadListRecord[] }) {
  const [lists, setLists] = useState(initialLists);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function createList() {
    const response = await fetch("/api/lead-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    const data = (await response.json()) as { list?: LeadListRecord; error?: string };

    if (!response.ok || !data.list) {
      setMessage(data.error || "Could not create list.");
      return;
    }

    setLists((current) => [data.list as LeadListRecord, ...current]);
    setName("");
    setDescription("");
    setMessage("List created.");
  }

  async function renameList(list: LeadListRecord) {
    const nextName = window.prompt("List name", list.name)?.trim();
    if (!nextName) return;

    const response = await fetch(`/api/lead-lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName, description: list.description })
    });
    const data = (await response.json()) as { list?: LeadListRecord; error?: string };

    if (!response.ok || !data.list) {
      setMessage(data.error || "Could not rename list.");
      return;
    }

    setLists((current) => current.map((item) => (item.id === list.id ? { ...item, ...data.list } : item)));
    setMessage("List renamed.");
  }

  async function deleteList(list: LeadListRecord) {
    if (!window.confirm(`Delete "${list.name}"?`)) return;

    const response = await fetch(`/api/lead-lists/${list.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error || "Could not delete list.");
      return;
    }

    setLists((current) => current.filter((item) => item.id !== list.id));
    setMessage("List deleted.");
  }

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="h-10 rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-white/30"
            placeholder="List name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="h-10 rounded-md border border-white/10 bg-[#07111f] px-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-white/30"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button type="button" disabled={!name.trim()} onClick={createList}>
            <Plus className="h-4 w-4" />
            Create List
          </Button>
        </div>
        {message && <div className="mt-3 text-sm text-muted-foreground">{message}</div>}
      </div>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-white/8 p-5">
          <h2 className="font-semibold text-white">Lead lists</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-white/6 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{list.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{list.description || "-"}</td>
                  <td className="px-4 py-3">{list.lead_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(list.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/lists/${list.id}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-white/12 bg-white/4 px-3 text-sm font-medium text-white hover:bg-white/10">
                        Open <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <Button type="button" variant="ghost" className="h-9 px-3" onClick={() => renameList(list)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 px-3" onClick={() => deleteList(list)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
