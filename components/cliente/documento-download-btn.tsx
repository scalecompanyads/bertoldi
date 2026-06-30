'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function DocumentoDownloadBtn({ urlStorage }: { urlStorage: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('documentos')
      .createSignedUrl(urlStorage, 120)

    if (error || !data?.signedUrl) {
      toast.error('Não foi possível baixar o arquivo.')
    } else {
      window.open(data.signedUrl, '_blank')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
      aria-label="Baixar documento"
    >
      <Download className="h-4 w-4" />
    </button>
  )
}
