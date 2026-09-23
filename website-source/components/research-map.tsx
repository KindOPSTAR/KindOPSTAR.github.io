'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import map from '@/data/research-map.json';
import categories from '@/data/research-categories.json';
import profile from '@/data/profile.json';
import PublicationFigure from '@/components/publication-figure';
import { layoutBranch, branchEdgePoints } from '@/lib/research-hierarchy';
import {
  initialResearchNavigation,
  researchNavigation,
} from '@/lib/research-navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const papers = Object.fromEntries(profile.publications.map((p) => [p.id, p]));
const nodes = Object.fromEntries(map.nodes.map((n) => [n.key, n]));
const categoryOf = (key: string) =>
  categories.find((c) => c.keys.includes(key))!;
const year = (key: string) =>
  papers[nodes[key].publicationId].kind.match(/20\d{2}/)?.[0] || '';

export default function ResearchMap() {
  const [navigation, dispatch] = useReducer(
    researchNavigation,
    initialResearchNavigation,
  );
  const { area, paper: selected, anchor } = navigation.current;
  const [columns, setColumns] = useState(2);
  const [sheetOpen, setSheetOpen] = useState(false);
  const graphFrame = useRef<HTMLDivElement>(null);
  const active = categories.find((c) => c.id === area);
  const selectedArea = selected ? categoryOf(selected) : null;
  const external = !!selected && selectedArea?.id !== area;
  const keys = active
    ? [...active.keys].sort((a, b) => Number(year(a)) - Number(year(b)))
    : [];
  const layout = layoutBranch(keys, map.edges, columns);
  const paper = selected ? papers[nodes[selected].publicationId] : null;
  const before = new Set(
    map.edges.filter((e) => e.to === anchor).map((e) => e.from),
  );
  const after = new Set(
    map.edges.filter((e) => e.from === anchor).map((e) => e.to),
  );
  useEffect(() => {
    if (!graphFrame.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setColumns(entry.contentRect.width < 680 ? 2 : 3),
    );
    observer.observe(graphFrame.current);
    return () => observer.disconnect();
  }, [area]);
  useEffect(() => {
    if (!area) setSheetOpen(false);
  }, [area]);
  function choose(key: string) {
    dispatch({ type: 'paper', paper: key, area: categoryOf(key).id });
  }
  function relations(direction: 'before' | 'after') {
    const edges = map.edges.filter((e) =>
      direction === 'before' ? e.to === selected : e.from === selected,
    );
    return (
      <div className="reader-relations">
        <h4>{direction === 'before' ? 'Builds on' : 'Leads to'}</h4>
        {edges.length ? (
          edges.map((e) => {
            const key = direction === 'before' ? e.from : e.to;
            const category = categoryOf(key);
            return (
              <Button variant="ghost" key={key} onClick={() => choose(key)}>
                <span>
                  {nodes[key].label}
                  <small>
                    {year(key)}
                    {category.id !== area ? ` · ${category.title}` : ''}
                  </small>
                </span>
                <span aria-hidden="true">
                  {category.id !== area ? '↗' : '→'}
                </span>
              </Button>
            );
          })
        ) : (
          <p>
            {direction === 'before'
              ? 'No earlier work linked.'
              : 'No later work linked.'}
          </p>
        )}
      </div>
    );
  }
  const detail =
    paper && selected ? (
      <>
        {external && (
          <div className="reader-external">
            <span>From {selectedArea?.title}</span>
            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: 'locate', area: selectedArea!.id });
                setSheetOpen(false);
              }}
            >
              Show in its area →
            </Button>
          </div>
        )}
        <h3 className="reader-title">{paper.title.replace('✦', '')}</h3>
        <p className="reader-venue">{paper.venue}</p>
        <p className="reader-authors">{paper.authors}</p>
        <p className="reader-note">{paper.note}</p>
        <div className="reader-links">
          {paper.url && <a href={paper.url}>Read paper ↗</a>}
          {selected === 'c.4' && (
            <a href="https://github.com/KindOPSTAR/VRMN-bD">Dataset & demo ↗</a>
          )}
          {selected === 'arXiv.2' && (
            <a href="https://github.com/KindOPSTAR/QualiGPT">Code ↗</a>
          )}
        </div>
        <div className="reader-connections">
          {relations('before')}
          {relations('after')}
        </div>
        <PublicationFigure
          key={paper.id}
          publicationId={paper.id}
          title={paper.title}
        />
      </>
    ) : (
      <div className="reader-empty">
        <span>Paper details</span>
        <h3>Select a paper in the map</h3>
        <p>
          Its contribution and connected works appear here. The map stays in
          place.
        </p>
      </div>
    );
  return (
    <section
      className="research-tree"
      id="research-map"
      aria-labelledby="research-map-heading"
    >
      <div className="tree-heading">
        <h2 id="research-map-heading">Research</h2>
        <div className="tree-navigation">
          <Button
            variant="ghost"
            disabled={!navigation.past.length}
            onClick={() => dispatch({ type: 'back' })}
          >
            ← Previous
          </Button>
          {active && (
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: 'overview' })}
            >
              All areas
            </Button>
          )}
        </div>
      </div>
      <p className="tree-context" aria-live="polite" aria-atomic="true">
        {active ? (
          <>
            <span>{active.title}</span>
            {selected
              ? ` / ${nodes[selected].label}${external ? ' (related area preview)' : ''}`
              : ' / Select a paper'}
          </>
        ) : (
          'Six research areas. Select one to explore its development.'
        )}
      </p>
      <div
        className={`area-navigation ${active ? 'is-compact' : ''}`}
        aria-label="Research areas"
      >
        {categories.map((c, i) => (
          <button
            className="area-option"
            key={c.id}
            onClick={() => dispatch({ type: 'area', area: c.id })}
            aria-pressed={area === c.id}
            aria-controls="research-workspace"
          >
            <span className="area-number">0{i + 1}</span>
            <strong>{c.title}</strong>
            <span className="area-description">{c.description}</span>
            <span className="area-count">
              {c.keys.length}
              <span> works</span>
            </span>
          </button>
        ))}
      </div>
      <div id="research-workspace">
        {active && (
          <div className="research-workspace">
            <div className="graph-column" ref={graphFrame}>
              <div className="graph-caption">
                <span>Earlier work ↓ later developments</span>
                <span>{keys.length} works</span>
              </div>
              <div
                className="branch-graph"
                style={{ height: layout.height }}
                aria-label={`Research development in ${active.title}`}
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
                    const highlighted = e.from === anchor || e.to === anchor;
                    return (
                      <polyline
                        key={`${e.from}-${e.to}`}
                        points={branchEdgePoints(layout, e)
                          .map((p) => `${p.x},${p.y}`)
                          .join(' ')}
                        fill="none"
                        strokeLinejoin="round"
                        stroke={highlighted ? '#ad3c48' : '#c7c4c4'}
                        strokeWidth={highlighted ? 2 : 1.2}
                        opacity={anchor && !highlighted ? 0.25 : 1}
                        vectorEffect="non-scaling-stroke"
                        markerEnd="url(#branch-arrow)"
                      />
                    );
                  })}
                </svg>
                {keys.map((key) => {
                  const pos = layout.positions[key];
                  const relation =
                    key === anchor
                      ? 'selected'
                      : before.has(key)
                        ? 'before'
                        : after.has(key)
                          ? 'after'
                          : 'other';
                  return (
                    <button
                      key={key}
                      className="branch-node"
                      data-relation={relation}
                      data-dimmed={!!anchor && relation === 'other'}
                      style={{
                        left: `${pos.x / 10}%`,
                        top: pos.y,
                        width: `${layout.width / 10}%`,
                      }}
                      onClick={() => choose(key)}
                      aria-pressed={key === selected}
                      aria-controls="research-reader"
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
                      {anchor && relation !== 'other' && (
                        <small>
                          {relation === 'selected'
                            ? external
                              ? 'Starting paper'
                              : 'Selected'
                            : relation === 'before'
                              ? 'Builds on'
                              : 'Leads to'}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="graph-footnote">
                Arrows indicate research development, not citations.
              </p>
              {paper && (
                <div className="mobile-reader-action">
                  <span>{nodes[selected!].label}</span>
                  <Button variant="outline" onClick={() => setSheetOpen(true)}>
                    Read details ↗
                  </Button>
                </div>
              )}
            </div>
            <aside
              className="research-reader"
              id="research-reader"
              aria-label="Paper details"
            >
              <div className="reader-caption">
                {paper ? 'Selected paper' : 'Explore a connection'}
              </div>
              {detail}
            </aside>
          </div>
        )}
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="research-reader-sheet">
          <SheetTitle>Paper & connections</SheetTitle>
          <SheetDescription>
            Explore related work; close this panel to return to the map.
          </SheetDescription>
          <div className="sheet-reader-nav">
            <Button
              variant="ghost"
              disabled={!navigation.past.length}
              onClick={() => dispatch({ type: 'back' })}
            >
              ← Previous selection
            </Button>
          </div>
          {detail}
        </SheetContent>
      </Sheet>
    </section>
  );
}
