import { Lead } from "@/lib/dummy-data";

function scoreTone(quality: Lead["lead_quality"]) {
  if (quality === "High Quality") return "border-white/25 bg-white/15 text-white";
  if (quality === "Medium Quality") return "border-white/15 bg-white/10 text-[#d8e0e8]";
  return "border-white/10 bg-white/6 text-muted-foreground";
}

export function LeadScoreBadge({ score, quality }: { score: number; quality: Lead["lead_quality"] }) {
  return (
    <div className="min-w-[132px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${scoreTone(quality)}`}>
          {quality}
        </span>
        <span className="text-xs font-semibold text-white">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
