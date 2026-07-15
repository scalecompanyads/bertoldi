import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-36" />
      <div className="flex gap-3">
        <Skeleton className="h-9 max-w-sm flex-1 rounded-md" />
        <Skeleton className="h-7 w-64 rounded-full" />
      </div>
      <div className="rounded-lg border divide-y">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-44" />
          </div>
        ))}
      </div>
    </div>
  )
}
