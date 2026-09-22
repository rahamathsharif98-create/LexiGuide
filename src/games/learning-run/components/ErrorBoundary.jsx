import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('LexiGuide Learning Run crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#071a2e',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <h2 style={{ marginBottom: 8 }}>Oops — something went wrong</h2>
            <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>
              The game hit an unexpected error. You can try again, or share the details below with the developer.
            </p>
            <pre
              style={{
                textAlign: 'left',
                background: 'rgba(0,0,0,0.35)',
                padding: 12,
                borderRadius: 10,
                fontSize: 12,
                overflow: 'auto',
                maxHeight: 160,
                marginBottom: 16,
              }}
            >
              {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
            </pre>
            <button
              onClick={this.handleReload}
              style={{
                background: '#38e1ff',
                color: '#071a2e',
                border: 'none',
                borderRadius: 999,
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              ↻ Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
