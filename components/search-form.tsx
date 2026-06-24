"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    ["keyword", "country", "city", "industry"].forEach((key) => {
      const value = form.get(key)?.toString().trim();
      if (value) {
        params.set(key, value);
      }
    });
    setLoading(true);
    router.push(`/search/results?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium text-white">Keyword</span>
        <Input name="keyword" required placeholder="AI workflow automation" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-white">Industry</span>
        <Input name="industry" placeholder="Software" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-white">Country</span>
        <Input name="country" placeholder="United States" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-white">City</span>
        <Input name="city" placeholder="Austin" />
      </label>
      <div className="md:col-span-2 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row">
        <Button type="submit" disabled={loading} className="sm:w-auto">
          <Search className="h-4 w-4" />
          {loading ? "Creating search" : "Find leads"}
        </Button>
        <Button type="button" variant="outline">
          <Sparkles className="h-4 w-4" />
          Send to Zantevo
        </Button>
      </div>
    </form>
  );
}

