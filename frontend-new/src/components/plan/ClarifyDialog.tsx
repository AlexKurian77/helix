interface Props {
  command: string;
  questions: { label: string; suggestions: string[] }[];
  onAnswer: () => void;
  onClose: () => void;
}

export const ClarifyDialog = ({ command, questions, onAnswer, onClose }: Props) => (
  <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="panel max-w-xl w-full shadow-[var(--shadow-raised)]">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="pill pill-warning">clarification needed</span>
          <span className="label-num">no silent assumptions</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
      </div>
      <div className="p-5">
        <div className="text-xs text-muted-foreground mb-1">your request</div>
        <div className="text-sm text-foreground italic mb-4">"{command}"</div>
        <p className="text-sm text-foreground mb-4 leading-relaxed">
          Before updating the plan, we need a few details — making assumptions here would compromise reproducibility.
        </p>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i}>
              <div className="text-sm font-medium text-foreground mb-2">{q.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {q.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={onAnswer}
                    className="text-xs px-2.5 py-1 rounded border border-border bg-surface-raised hover:border-accent hover:bg-accent-soft transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-border bg-surface-sunken flex justify-between items-center">
        <span className="label-num">{questions.length} questions · ~30s</span>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">cancel update</button>
      </div>
    </div>
  </div>
);
