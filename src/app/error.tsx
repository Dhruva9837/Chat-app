'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Next.js Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
        <div className="bg-zinc-950 rounded-xl p-4 mb-6 text-left border border-zinc-900">
          <p className="text-zinc-400 text-xs font-mono break-all">{error.message || 'Internal Server Error'}</p>
          {error.digest && <p className="text-zinc-600 text-[10px] mt-2 italic">Ref: {error.digest}</p>}
        </div>
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            This is often caused by missing Supabase credentials in <b>.env.local</b> or if the database tables haven't been created yet.
          </p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => reset()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl transition-all font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-zinc-600 text-xs hover:text-zinc-400 transition-all font-medium py-2"
            >
              Hard Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
