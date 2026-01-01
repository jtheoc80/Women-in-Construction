'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Copy, Send, Check, Users } from 'lucide-react'

interface InviteData {
  code: string
  url: string
  uses: number
  max_uses: number | null
  expires_at: string | null
}

interface InviteDialogProps {
  trigger?: React.ReactNode
}

export function InviteDialog({ trigger }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchOrCreateInvite = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create invite.')
        return
      }

      setInvite(data)
    } catch (err) {
      console.error('Error creating invite:', err)
      setError('Failed to create invite. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !invite) {
      fetchOrCreateInvite()
    }
    if (!isOpen) {
      setCopied(false)
    }
  }

  const handleCopy = async () => {
    if (!invite) return
    
    try {
      await navigator.clipboard.writeText(invite.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (!invite) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on SiteSisters',
          text: 'I invited you to join SiteSisters - a community for women in construction to find housing near job sites.',
          url: invite.url,
        })
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
            title="Invite friends"
          >
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-teal-600" />
            Invite friends
          </DialogTitle>
          <DialogDescription>
            Share your invite link with friends to help them join SiteSisters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchOrCreateInvite}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && invite && (
            <>
              {/* Invite link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Your invite link
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={invite.url}
                    className="font-mono text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title={copied ? 'Copied!' : 'Copy link'}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  className="flex-1 bg-teal-600 hover:bg-teal-500"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy link'}
                </Button>
                
                {canShare && (
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="flex-1"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {invite.uses} {invite.uses === 1 ? 'person' : 'people'} joined
                    </p>
                    <p className="text-xs text-slate-500">
                      {invite.max_uses 
                        ? `${invite.max_uses - invite.uses} uses remaining`
                        : 'Unlimited uses'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
