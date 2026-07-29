'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Card className="m-4">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4 opacity-70" />
            <h2 className="text-lg font-semibold mb-2">خطایی رخ داد</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {this.state.error?.message || 'یک خطای غیرمنتظره رخ داده است.'}
            </p>
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}