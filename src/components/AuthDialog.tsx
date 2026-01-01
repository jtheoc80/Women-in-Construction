'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Mail, Phone } from 'lucide-react'

type AuthStep = 'send' | 'verify'

export function AuthDialog() {
  const { authDialogOpen, setAuthDialogOpen } = useAuth()
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [step, setStep] = useState<AuthStep>('send')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  const resetState = () => {
    setStep('send')
    setEmail('')
    setPhone('')
    setOtp('')
    setError(null)
    setMessage(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState()
    }
    setAuthDialogOpen(open)
  }

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a verification code!')
        setStep('verify')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Format phone number (ensure it starts with +)
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      // Assume US number if no country code
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your phone for a verification code!')
        setStep('verify')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      })

      if (error) {
        setError(error.message)
      } else {
        // Success - dialog will close via auth state change listener
        resetState()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Format phone number (ensure it starts with +)
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms',
      })

      if (error) {
        setError(error.message)
      } else {
        // Success - dialog will close via auth state change listener
        resetState()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = () => {
    setStep('send')
    setOtp('')
    setError(null)
    setMessage(null)
  }

  return (
    <Dialog open={authDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Sign in to SiteSisters
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Sign in with your email or phone number. No password needed!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as 'email' | 'phone')
          resetState()
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="email" className="data-[state=active]:bg-white">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-600" aria-hidden="true" />
                Email
              </span>
            </TabsTrigger>
            <TabsTrigger value="phone" className="data-[state=active]:bg-white">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-600" aria-hidden="true" />
                Phone
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            {step === 'send' ? (
              <form onSubmit={handleSendEmailOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Sending...' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-otp" className="text-slate-700">
                    Verification code
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="border-slate-300 focus:border-orange-500 focus:ring-orange-500 text-center text-2xl tracking-widest"
                  />
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Verifying...' : 'Verify & sign in'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="w-full text-sm text-slate-600 hover:text-orange-600"
                >
                  Didn&apos;t receive a code? Send again
                </button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="phone" className="mt-4">
            {step === 'send' ? (
              <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700">
                    Phone number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">
                    We&apos;ll send you a text with a verification code
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Sending...' : 'Send verification code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-otp" className="text-slate-700">
                    Verification code
                  </Label>
                  <Input
                    id="phone-otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="border-slate-300 focus:border-orange-500 focus:ring-orange-500 text-center text-2xl tracking-widest"
                  />
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Verifying...' : 'Verify & sign in'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="w-full text-sm text-slate-600 hover:text-orange-600"
                >
                  Didn&apos;t receive a code? Send again
                </button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Your contact info is never shared publicly. Only revealed when you both accept an intro.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
