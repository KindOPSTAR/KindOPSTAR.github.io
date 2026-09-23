'use client';

import { useEffect, useRef, useState } from 'react';
import map from '@/data/research-map.json';
import categories from '@/data/research-categories.json';
import profile from '@/data/profile.json';
import PublicationFigure from '@/components/publication-figure';
import { layoutBranch } from '@/lib/research-hierarchy';
import { Button } from '@/components/ui/button';

const papers = Object.fromEntries(profile.publications.map((p) => [p.id, p]));
const nodes = Object.fromEntries(map.nodes.map((n) => [n.key, n]));
const categoryOf = (key: string) =>
  categories.find((c) => c.keys.includes(key))!;
const year = (key: string) =>
  papers[nodes[key].publicationId].kind.match(/20\d{2}/)?.[0] || '';

export default function ResearchMap() {
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [columns, setColumns] = useState(3);
  const container = useRef<HTMLElement>(null);
  const branchHeading = useRef<HTMLHeadingElement>(null);
  const paperHeading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<string | null>(null);
  const active = categories.find((c) => c.id === category);
  const keys = active
    ? [...active.keys].sort((a, b) => Number(year(a)) - Number(year(b)))
    : [];
  const layout = layoutBranch(keys, map.edges, columns);
  const paper = selected ? papers[nodes[selected].publicationId] : null;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setColumns(entry.contentRect.width < 520 ? 2 : 3),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (category && !selected)
      branchHeading.current?.focus({ preventScroll: true });
    if (selected) paperHeading.current?.focus();
  }, [category, selected]);
  function openCategory(id: string) {
    setCategory(id);
    setSelected(null);
    returnFocus.current = id;
  }
  function choose(key: string) {
    setCategory(categoryOf(key).id);
    setSelected(key);
  }
  function overview() {
    setCategory(null);
    setSelected(null);
    requestAnimationFrame(() =>
      document
        .getElementById(`category-${returnFocus.current}`)
        ?.focus({ preventScroll: true }),
    );
  }
  function relations(direction: 'before' | 'after') {
    const edges = map.edges.filter((e) =>
      direction === 'before' ? e.to === selected : e.from === selected,
    );
    return (
      <div className="branch-relations">
        <h4>{direction === 'before' ? 'Builds on' : 'Leads to'}</h4>
        {edges.length ? (
          edges.map((e) => {
            const key = direction === 'before' ? e.from : e.to;
            return (
              <Button variant="ghost" key={key} onClick={() => choose(key)}>
                <span>
                  {nodes[key].label}
                  <small>{categoryOf(key).title}</small>
                </span>
                <span>{year(key)} →</span>
              </Button>
            );
          })
        ) : (
          <p>
            {direction === 'before'
              ? 'A starting point in this map.'
              : 'No subsequent work mapped yet.'}
          </p>
        )}
      </div>
    );
  }
  return (
    <section
      ref={container}
      className="research-tree"
      id="research-map"
      aria-labelledby="research-map-heading"
    >
      <div className="tree-heading">
        <h2 id="research-map-heading">Research</h2>
        {active ? (
          <Button variant="ghost" onClick={overview}>
            ← All research areas
          </Button>
        ) : (
          <p>Select an area to explore its papers and connections.</p>
        )}
      </div>
      {!active ? (
        <div className="tree-overview">
          <div className="tree-root">
            Human-centered AI <span>& human–computer interaction</span>
          </div>
          <div className="category-branches">
            {categories.map((c, i) => (
              <button
                id={`category-${c.id}`}
                className="category-node"
                key={c.id}
                onClick={() => openCategory(c.id)}
                aria-label={`${c.title}, ${c.keys.length} works. Explore research area.`}
              >
                <span className="category-index">0{i + 1}</span>
                <strong>{c.title}</strong>
                <span className="category-description">{c.description}</span>
                <span className="category-count">
                  {c.keys.length} works <span aria-hidden="true">↗</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="branch-view">
          <div className="branch-title">
            <h3 ref={branchHeading} tabIndex={-1}>
              {active.title}
            </h3>
            <p>
              {active.description} · {keys.length} works
            </p>
          </div>
          <div
            className="branch-graph"
            style={{ height: layout.height }}
            aria-label={`All works in ${active.title}, ordered from foundations to later developments`}
          >
            <svg
              viewBox={`0 0 1000 ${layout.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="branch-arrow"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
                </marker>
              </defs>
              {layout.links.map((e) => {
                const a = layout.positions[e.from],
                  b = layout.positions[e.to];
                const x1 = a.x + layout.width / 2,
                  x2 = b.x + layout.width / 2;
                const y1 = a.y + 72,
                  y2 = b.y;
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={`M${x1},${y1} C${x1},${y1 + 20} ${x2},${y2 - 20} ${x2},${y2 - 3}`}
                    fill="none"
                    stroke={
                      selected === e.from || selected === e.to
                        ? '#b94a54'
                        : '#c7c4c4'
                    }
                    strokeWidth={1.4}
                    vectorEffect="non-scaling-stroke"
                    markerEnd="url(#branch-arrow)"
                  />
                );
              })}
            </svg>
            {keys.map((key) => {
              const pos = layout.positions[key];
              return (
                <button
                  className="branch-node"
                  key={key}
                  style={{
                    left: `${pos.x / 10}%`,
                    top: pos.y,
                    width: `${layout.width / 10}%`,
                  }}
                  onClick={() => choose(key)}
                  aria-pressed={selected === key}
                  aria-controls="branch-paper"
                  title={papers[nodes[key].publicationId].title}
                >
                  <strong>{nodes[key].label}</strong>
                  <span>
                    {year(key)} ·{' '}
                    {key.startsWith('pat')
                      ? 'Patent'
                      : key.startsWith('arXiv')
                        ? 'Preprint'
                        : 'Publication'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="branch-note">
            Arrows show research development, not citations. Select a work for
            its full title and connections across areas.
          </p>
          <div id="branch-paper" className="branch-paper" aria-live="polite">
            {paper && selected ? (
              <>
                <div className="branch-paper-heading">
                  <h3 ref={paperHeading} tabIndex={-1}>
                    {paper.title.replace('✦', '')}
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setSelected(null)}
                    aria-label="Close paper details"
                  >
                    ×
                  </Button>
                </div>
                <p className="branch-authors">{paper.authors}</p>
                <p className="branch-venue">{paper.venue}</p>
                <div className="branch-paper-body">
                  <div>
                    <p>{paper.note}</p>
                    {paper.url && <a href={paper.url}>Read paper ↗</a>}
                    {selected === 'c.4' && (
                      <a href="https://github.com/KindOPSTAR/VRMN-bD">
                        Dataset & demo ↗
                      </a>
                    )}
                    {selected === 'arXiv.2' && (
                      <a href="https://github.com/KindOPSTAR/QualiGPT">
                        Code ↗
                      </a>
                    )}
                  </div>
                  <PublicationFigure
                    publicationId={paper.id}
                    title={paper.title}
                  />
                </div>
                <div className="branch-connections">
                  {relations('before')}
                  {relations('after')}
                </div>
              </>
            ) : (
              <p className="branch-hint">Select a paper above to read more.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
