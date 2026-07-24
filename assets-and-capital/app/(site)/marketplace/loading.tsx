export default function Loading() {
  return (
    <div className="pt-32 md:pt-40">
      <div className="container-x">
        <div className="skeleton h-6 w-32 rounded-full" />
        <div className="skeleton mt-5 h-14 w-[28rem] max-w-full rounded-2xl" />
        <div className="skeleton mt-4 h-5 w-96 max-w-full rounded-lg" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
              <div className="skeleton aspect-[16/9] rounded-none" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-40 rounded-lg" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="flex items-center justify-between pt-3">
                  <div className="skeleton h-8 w-28 rounded-lg" />
                  <div className="skeleton h-5 w-20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
