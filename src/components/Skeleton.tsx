import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-slate-800/50 animate-pulse",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/30 bg-slate-900/30 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-4 flex-1" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function PlanGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="min-h-[120px] rounded-lg border border-slate-700/30 bg-slate-900/20 p-2 space-y-2">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function TaskGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="min-h-[200px] rounded-lg border border-slate-700/30 bg-slate-900/20 p-2 space-y-2">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function NotesGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-900/30 p-5 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="px-6 pb-6 space-y-4">
        <div className="flex items-end -mt-12 mb-5">
          <Skeleton className="w-20 h-20 rounded-2xl ring-4 ring-slate-900" />
          <div className="ml-4 pb-1 space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
