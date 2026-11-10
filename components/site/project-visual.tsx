import type { Project, ProjectContent } from '@/lib/types';

/**
 * Artwork for a project card or case-study hero.
 * `agri`, `legal` and `blue` are the hand-made originals; `system` is generated
 * from the project's own flow and stack, so any new project gets a fitting visual.
 */
export function ProjectVisual({
  project,
  content,
  index,
  compact = false,
}: {
  project: Project;
  content: ProjectContent;
  index: number;
  compact?: boolean;
}) {
  const cls = `visual${compact ? ' visual-compact' : ''}`;

  if (project.visual === 'image' && project.coverKey) {
    return (
      <div className={`${cls} visual-image`}>
        <img src={`/media/${project.coverKey}`} alt="" loading="lazy" />
      </div>
    );
  }

  if (project.visual === 'agri') {
    return (
      <div className={`${cls} agri`} aria-hidden>
        <div className="device">
          <i />
          <i />
          <i />
          <span>ESP32</span>
        </div>
        <div className="scanline" />
        <b>SOIL / AIR / LIGHT</b>
      </div>
    );
  }

  if (project.visual === 'legal') {
    return (
      <div className={`${cls} legal`} aria-hidden>
        <div className="question" dir="rtl">
          ما أثر الاجتهاد القضائي؟
        </div>
        <div className="source-row">
          <span>LAWS</span>
          <span>PRECEDENTS</span>
          <span>FIQH</span>
        </div>
        <div className="answer">
          Grounded synthesis <b>→</b> source IDs
        </div>
      </div>
    );
  }

  if (project.visual === 'blue') {
    return (
      <div className={`${cls} blue`} aria-hidden>
        <div className="incident">BT—2026—0615</div>
        {['SOC', 'DETECTION', 'HUNT / CTI', 'DFIR / IR', 'SOAR'].map((x, i) => (
          <div className="day" key={x}>
            <b>0{i + 1}</b>
            <span>{x}</span>
          </div>
        ))}
      </div>
    );
  }

  // Generated "system" visual.
  const steps = (content.flow.length ? content.flow : project.disciplines).slice(0, 6);
  return (
    <div className={`${cls} system`} aria-hidden style={{ '--steps': steps.length } as React.CSSProperties}>
      <div className="system-grid" />
      <div className="system-head">
        <span>PRX—{String(index).padStart(2, '0')}</span>
        <span>{project.slug.toUpperCase()}</span>
      </div>
      <div className="system-title">{content.title}</div>
      <ol className="system-flow">
        {steps.map((s, i) => (
          <li key={`${s}-${i}`}>
            <i />
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {project.stack.length > 0 && (
        <div className="system-stack">
          {project.stack.slice(0, 5).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
