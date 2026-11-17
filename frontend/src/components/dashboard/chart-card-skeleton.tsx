import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Placeholder matching the chart card geometry to avoid layout shift:
 * header = h-5 (20px) + gap-2 (8px) + h-3 + mt-1 (16px) = 44px, same as the real
 * title (16px, leading-none) + gap-2 + description (text-sm, 20px line height);
 * content = 280px, same as the chart / empty-state height.
 */
export function ChartCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
