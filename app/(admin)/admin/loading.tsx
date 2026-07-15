import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    </div>
  )
}
