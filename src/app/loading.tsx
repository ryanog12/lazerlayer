export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-16 animate-pulse rounded-full bg-primary/70" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}
