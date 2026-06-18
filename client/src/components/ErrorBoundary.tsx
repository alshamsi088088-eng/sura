import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    // Print complete details for faster debugging in production logs/console
    console.error(
      'ErrorBoundary caught:',
      error,
      info?.componentStack ?? info,
      (error as any)?.stack
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-black text-white p-8">
          <h1 className="text-2xl font-bold">حدث خطأ</h1>
          <p className="mt-4">{this.state.error.message}</p>
          <pre className="mt-4 whitespace-pre-wrap text-sm">
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
