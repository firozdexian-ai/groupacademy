import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional path the "Back to safety" button navigates to. Defaults to /app/feed. */
  fallbackPath?: string;
  /** Optional label shown on the destination button. */
  fallbackLabel?: string;
}

interface State {
  error: Error | null;
}

/**
 * RouteErrorBoundary — production safety net.
 *
 * Wrap each top-level route element with this boundary so a single broken
 * component cannot blank the entire shell. Renders a polished fallback card
 * with reload + navigate-home actions. Errors are also logged to the console
 * so they surface in our error pipeline.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Keep this single console.error so the platform error pipeline catches it.
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const fallbackPath = this.props.fallbackPath ?? "/app/feed";
    const fallbackLabel = this.props.fallbackLabel ?? "Back to home";

    return (
      <div className="w-full px-3 py-8">
        <Card className="mx-auto max-w-md border-border/60 bg-card shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                This screen hit an unexpected error. The rest of the app is still
                fine — try reloading, or head back to a known-good page.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  this.reset();
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reload
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to={fallbackPath} onClick={this.reset}>
                  <Home className="h-4 w-4" />
                  {fallbackLabel}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default RouteErrorBoundary;
