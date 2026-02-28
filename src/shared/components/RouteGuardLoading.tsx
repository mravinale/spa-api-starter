export function RouteGuardLoading() {
  return (
    <div
      data-testid="route-guard-loading"
      role="status"
      aria-live="polite"
      className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground"
    >
      Loading...
    </div>
  );
}
