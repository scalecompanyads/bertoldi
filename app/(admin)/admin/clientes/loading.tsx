import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 max-w-sm rounded-md" />
      <div className="rounded-lg border divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
