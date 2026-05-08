/**
 * Five-step progress strip for the Character Studio wizard.
 * Steps before `currentStep` render solid (done); the current step
 * pulses; future steps render dim. Pure presentational.
 */
export function ProgressBar({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: readonly string[];
}) {
  return (
    <div className="flex gap-2 w-full">
      {steps.map((s, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                isDone || isCurrent
                  ? "bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
                  : "bg-white/10"
              } ${isCurrent ? "animate-pulse" : ""}`}
            />
            <p
              className={`mt-1.5 text-[10px] uppercase tracking-wider font-semibold ${
                isCurrent ? "text-[#c4b5fd]" : isDone ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {s}
            </p>
          </div>
        );
      })}
    </div>
  );
}
