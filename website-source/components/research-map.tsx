'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import map from '@/data/research-map.json';
import categoryData from '@/data/research-categories.json';
import profile from '@/data/profile.json';
import PublicationFigure from '@/components/publication-figure';
import {
  edgePath,
  layoutUnifiedResearch,
  researchLineage,
} from '@/lib/research-hierarchy';
import {
  initialResearchNavigation,
  researchNavigation,
} from '@/lib/research-navigation';
import { Button } from '@/components/ui/button';

const papers = Object.fromEntries(profile.publications.map((p) => [p.id, p]));
const nodes = Object.fromEntries(map.nodes.map((node) => [node.key, node]));
const year = (key: string) =>
  papers[nodes[key].publicationId].kind.match(/20\d{2}/)?.[0] || '';
const categories = categoryData.map((category) => ({
  ...category,
  keys: [...category.keys].sort(
    (a, b) => Number(year(a)) - Number(year(b)) || nodes[a].y - nodes[b].y,
  ),
}));
const categoryOf = (key: string) =>
  categories.find((category) => category.keys.includes(key))!;
const allKeys = categories.flatMap((category) => category.keys);

export default function ResearchMap() {
  const [navigation, dispatch] = useReducer(
    researchNavigation,
    initialResearchNavigation,
  );
  const { area, paper: selected } = navigation.current;
  const [compact, setCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const layout = useMemo(
    () => layoutUnifiedResearch(categories, area, compact),
    [area, compact],
  );
  const paths = Object.fromEntries(
    map.edges.map((edge) => [
      `${edge.from}:${edge.to}`,
      edgePath(layout, edge),
    ]),
  );
  const lineage = useMemo(
    () => researchLineage(selected, map.edges),
    [selected],
  );
  const selectedPaper = selected ? papers[nodes[selected].publicationId] : null;
  const selectedCategory = selected ? categoryOf(selected) : null;
  const activeCategory = categories.find((category) => category.id === area);

  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setCompact(entry.contentRect.width < 620),
    );
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  function choosePaper(key: string) {
    dispatch({ type: 'paper', paper: key, area: categoryOf(key).id });
  }
  function related(direction: 'before' | 'after') {
    if (!selected) return null;
    const relatedEdges = map.edges.filter((edge) =>
      direction === 'before' ? edge.to === selected : edge.from === selected,
    );
    return (
      <div className="unified-relations">
        <h4>
          {direction === 'before' ? 'Directly builds on' : 'Directly leads to'}
        </h4>
        {relatedEdges.length ? (
          relatedEdges.map((edge) => {
            const key = direction === 'before' ? edge.from : edge.to;
            return (
              <Button
                variant="ghost"
                key={key}
                onClick={() => choosePaper(key)}
              >
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
              ? 'Starting point in this map.'
              : 'No later work mapped yet.'}
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      className="unified-research"
      id="research-map"
      aria-labelledby="research-map-heading"
    >
      <div className="unified-heading">
        <div>
          <h2 id="research-map-heading">Research map</h2>
          <p>
            All works remain visible. Select an area or paper to reshape the
            map.
          </p>
        </div>
        <div className="unified-actions">
          <Button
            variant="ghost"
            disabled={!navigation.past.length}
            onClick={() => dispatch({ type: 'back' })}
          >
            ← Previous
          </Button>
          <Button
            variant="ghost"
            aria-pressed={!area}
            onClick={() => dispatch({ type: 'area', area: null })}
          >
            Show all
          </Button>
        </div>
      </div>
      <div className="unified-status" aria-live="polite" aria-atomic="true">
        <span>
          {activeCategory ? activeCategory.title : 'All research areas'}
          {selected ? ` / ${nodes[selected].label}` : ''}
        </span>
        <div className="unified-legend" aria-label="Map legend">
          <span>
            <i className="legend-swatch selected" /> selected
          </span>
          <span>
            <i className="legend-swatch before" /> earlier
          </span>
          <span>
            <i className="legend-swatch after" /> later
          </span>
        </div>
      </div>
      <div
        ref={canvas}
        className="unified-canvas"
        style={{ height: layout.height }}
        aria-label="All research papers grouped by area"
      >
        <svg
          className="unified-edges"
          viewBox={`0 0 1000 ${layout.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="unified-arrow"
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
          {map.edges.map((edge) => {
            const id = `${edge.from}:${edge.to}`;
            const highlighted = lineage.edges.has(id);
            const withinArea =
              !!area &&
              categoryOf(edge.from).id === area &&
              categoryOf(edge.to).id === area;
            return (
              <path
                key={id}
                className="unified-edge"
                data-highlighted={highlighted}
                data-muted={!!selected && !highlighted}
                d={paths[id]}
                stroke={highlighted ? '#ad3c48' : '#bdb8b8'}
                strokeWidth={highlighted ? 2.4 : withinArea ? 1.4 : 0.9}
                opacity={
                  highlighted ? 1 : selected ? 0.08 : withinArea ? 0.48 : 0.2
                }
                fill="none"
                vectorEffect="non-scaling-stroke"
                markerEnd="url(#unified-arrow)"
                style={{
                  transitionDuration: reducedMotion ? '1ms' : undefined,
                }}
              />
            );
          })}
        </svg>
        {categories.map((category) => {
          const position = layout.categories[category.id];
          return (
            <button
              key={category.id}
              className="unified-category"
              data-focused={area === category.id}
              style={{
                left: `${position.x / 10}%`,
                top: position.y,
                width: `${position.width / 10}%`,
              }}
              onClick={() =>
                dispatch({
                  type: 'area',
                  area: area === category.id ? null : category.id,
                })
              }
              aria-pressed={area === category.id}
            >
              <strong>{category.title}</strong>
              <span>{category.keys.length} works</span>
            </button>
          );
        })}
        {allKeys.map((key) => {
          const position = layout.positions[key];
          const category = categoryOf(key);
          const lineageState =
            key === selected
              ? 'selected'
              : lineage.ancestors.has(key)
                ? 'before'
                : lineage.descendants.has(key)
                  ? 'after'
                  : 'none';
          const muted = !!selected && lineageState === 'none';
          return (
            <button
              key={key}
              className="unified-node"
              data-scale={position.scale}
              data-area-active={!area || area === category.id}
              data-lineage={lineageState}
              data-muted={muted}
              style={{
                left: `${position.x / 10}%`,
                top: position.y,
                width: `${position.width / 10}%`,
                height: position.height,
              }}
              onClick={() => choosePaper(key)}
              aria-pressed={key === selected}
              aria-label={`${papers[nodes[key].publicationId].title}, ${year(key)}, ${category.title}`}
              title={papers[nodes[key].publicationId].title}
            >
              <strong>{nodes[key].label}</strong>
              <span>{year(key)}</span>
              {lineageState !== 'none' && (
                <small>
                  {lineageState === 'selected'
                    ? 'Selected'
                    : lineageState === 'before'
                      ? 'Earlier'
                      : 'Later'}
                </small>
              )}
            </button>
          );
        })}
      </div>
      <p className="unified-note">
        Arrows show how one project informed another; they are not citation
        links.
      </p>
      <div className="unified-reader" id="research-reader" aria-live="polite">
        {selectedPaper && selected ? (
          <>
            <div className="unified-reader-heading">
              <div>
                <span>
                  {selectedCategory?.title} · {year(selected)}
                </span>
                <h3>{selectedPaper.title.replace('✦', '')}</h3>
              </div>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'clear-paper' })}
                aria-label="Close paper details"
              >
                ×
              </Button>
            </div>
            <p className="unified-authors">{selectedPaper.authors}</p>
            <p className="unified-venue">{selectedPaper.venue}</p>
            <div className="unified-reader-grid">
              <div>
                <p>{selectedPaper.note}</p>
                <div className="unified-links">
                  {selectedPaper.url && (
                    <a href={selectedPaper.url}>Read paper ↗</a>
                  )}
                  {selected === 'c.4' && (
                    <a href="https://github.com/KindOPSTAR/VRMN-bD">
                      Dataset & demo ↗
                    </a>
                  )}
                  {selected === 'arXiv.2' && (
                    <a href="https://github.com/KindOPSTAR/QualiGPT">Code ↗</a>
                  )}
                </div>
                <div className="unified-connections">
                  {related('before')}
                  {related('after')}
                </div>
              </div>
              <PublicationFigure
                key={selectedPaper.id}
                publicationId={selectedPaper.id}
                title={selectedPaper.title}
              />
            </div>
          </>
        ) : (
          <p className="unified-reader-empty">
            Select any paper to highlight its full research lineage and view
            details.
          </p>
        )}
      </div>
    </section>
  );
}
