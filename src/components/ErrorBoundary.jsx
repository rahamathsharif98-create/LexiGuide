import React from 'react'
import { Button, Card } from './ui'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  handleSignIn = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/parent/login'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback
      }

      const isChildView = this.props.portal === 'child' || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/child'))

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6" data-testid="error-boundary-fallback">
          <Card className="max-w-md w-full text-center p-6 sm:p-8 shadow-card border border-slate-100">
            <div className="text-6xl mb-4 animate-bounce">
              {isChildView ? '🌱' : '⚠️'}
            </div>
            <h2 className="font-display font-bold text-xl text-slate-800 mb-2">
              {isChildView ? 'Oops! Adventure Paused' : 'Something went wrong'}
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {isChildView
                ? "We ran into a small hiccup loading this page. Let's try again or return home!"
                : (this.state.error?.message || 'An unexpected error occurred while rendering this view. You can retry or return to the main dashboard.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="primary" size="sm">
                Try Again 🔄
              </Button>
              <Button onClick={this.handleGoHome} variant="secondary" size="sm">
                Return Home 🏠
              </Button>
              {!isChildView && (
                <Button onClick={this.handleSignIn} variant="ghost" size="sm">
                  Sign In Again 🔑
                </Button>
              )}
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
