export default function AmbientBackground({ reduced = false }: { reduced?: boolean }) {
  return (
    <div
      className={`ambient-glass-background ${reduced ? "ambient-glass-background--reduced" : ""}`}
      aria-hidden="true"
    >
      <span className="glass-light glass-light--turquoise-one" />
      <span className="glass-light glass-light--turquoise-two" />
      <span className="glass-light glass-light--orange" />
      <span className="glass-light glass-light--soft" />
      <span className="glass-light glass-light--overlap" />
      <span className="glass-pane glass-pane--one" />
      <span className="glass-pane glass-pane--two" />
      <span className="glass-pane glass-pane--three" />
      <span className="glass-pane glass-pane--four" />
      <span className="glass-pane glass-pane--five" />
      <span className="glass-pane glass-pane--six" />
      <span className="glass-streak glass-streak--turquoise" />
      <span className="glass-streak glass-streak--cherry" />
      <span className="glass-streak glass-streak--white" />
    </div>
  );
}
