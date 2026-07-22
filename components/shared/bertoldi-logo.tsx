import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
} as const

interface Props {
  size?: keyof typeof SIZES
  href?: string
  className?: string
  priority?: boolean
}

export function BertoldiLogo({ size = 'md', href, className, priority }: Props) {
  const image = (
    <Image
      src="/logo-bertoldi.png"
      alt="Bertoldi Advogados Associados"
      width={480}
      height={120}
      priority={priority}
      className={cn('w-auto object-contain', SIZES[size], className)}
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    )
  }

  return image
}
