import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorType = "network" | "server" | "timeout" | "generic" | "notFound";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: ErrorType;
  className?: string;
  compact?: boolean;
}

const errorConfig: Record<ErrorType, { icon: typeof AlertCircle; defaultTitle: string; defaultDescription: string }> = {
  network: {
    icon: WifiOff,
    defaultTitle: "Connection Error",
    defaultDescription: "Please check your internet connection and try again."
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Server Error", 
    defaultDescription: "Something went wrong on our end. Please try again later."
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Request Timed Out",
    defaultDescription: "The server took too long to respond. Please try again."
  },
  notFound: {
    icon: AlertCircle,
    defaultTitle: "Not Found",
    defaultDescription: "The requested content could not be found."
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something Went Wrong",
    defaultDescription: "An unexpected error occurred. Please try again."
  }
};

export function ErrorState({ 
  title,
  description,
  onRetry,
  retryLabel = "Try Again",
  type = "generic",
  className = "",
  compact = false
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;
  
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  if (compact) {
    return (
      <div className={`flex items-center justify-center gap-4 p-6 text-center ${className}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{displayTitle}</span>
          </div>
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent className="text-center pb-6">
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryLabel}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Full page error state with optional navbar
export function PageErrorState({
  title,
  description,
  onRetry,
  type = "generic",
  showNavbar = false
}: ErrorStateProps & { showNavbar?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNavbar && (
        <div className="border-b">
          {/* Basic header when Navbar might cause issues */}
          <div className="container mx-auto px-6 py-4">
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      )}
      <main className="flex-1 flex items-center justify-center p-6">
        <ErrorState
          title={title}
          description={description}
          onRetry={onRetry}
          type={type}
          className="max-w-md w-full"
        />
      </main>
    </div>
  );
}
