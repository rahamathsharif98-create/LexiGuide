// Drop-in replacements for react-router-dom's <Link> / <NavLink> that use a
// plain <button> instead of a real <a> element.
//
// Two independent problems made <a href="..."> unsafe for this app's
// delivery format (a single static HTML file with client-side-only routing,
// no server-side rewrites, sometimes viewed inside a sandboxed preview):
//   1. A real href pointing at an app-internal path (e.g. "/select-profile")
//      works for a normal left-click (React Router intercepts it), but a
//      middle-click / Ctrl-click / "open in new tab" bypasses that
//      interception and asks the browser to fetch that path as a real file
//      — which doesn't exist on the host, so it 404s.
//   2. Some preview sandboxes intercept ALL <a> element clicks (regardless
//      of href) to show a "you're leaving this page" confirmation, since an
//      anchor is the canonical signal for "this may navigate away."
// A <button> has neither problem: no href to be fetched, and nothing to
// intercept as a navigation signal. Tailwind's Preflight already strips
// default button chrome (padding/margin/border/background), so every
// existing className continues to render identically to how it did as <a>.
import { useNavigate, useLocation } from 'react-router-dom'

export function AppLink({ to, children, className, onClick, ...rest }) {
  const navigate = useNavigate()
  const resolvedClassName = typeof className === 'function' ? className({ isActive: false }) : className
  const handleClick = (e) => {
    onClick?.(e)
    navigate(to)
  }
  return (
    <button type="button" onClick={handleClick} className={resolvedClassName} {...rest}>
      {typeof children === 'function' ? children({ isActive: false }) : children}
    </button>
  )
}

export function AppNavLink({ to, end, className, children, onClick, ...rest }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/')
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className
  const handleClick = (e) => {
    onClick?.(e)
    navigate(to)
  }
  return (
    <button type="button" onClick={handleClick} className={resolvedClassName} {...rest}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </button>
  )
}
