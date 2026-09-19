'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Focus,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import map from '@/data/research-map.json';
import profile from '@/data/profile.json';
import PublicationFigure from '@/components/publication-figure';
import {
  traceLineage,
  layoutResearch,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '@/lib/research-graph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const themes = [
  { key: 'all', label: 'All research', tags: [], color: '#d4ef8a' },
  { key: 'qual', label: 'AI4Qual', tags: ['qual'], color: '#b1a0ff' },
  {
    key: 'affect',
    label: 'Affect & VR',
    tags: ['affect', 'vr', 'embodiment'],
    color: '#ff91b4',
  },
  {
    key: 'home',
    label: 'Agents & safety',
    tags: ['home', 'agents', 'safety'],
    color: '#63d5bb',
  },
  {
    key: 'access',
    label: 'Accessibility',
    tags: ['access', 'privacy'],
    color: '#ffd18c',
  },
  {
    key: 'social',
    label: 'Social computing',
    tags: ['social'],
    color: '#85bbff',
  },
  {
    key: 'trust',
    label: 'Trust & learning',
    tags: ['trust', 'edu'],
    color: '#a5c8f4',
  },
];
const works = [...profile.publications, ...profile.projects];
const byId = Object.fromEntries(works.map((p) => [p.id, p]));
const byKey = Object.fromEntries(map.nodes.map((n) => [n.key, n]));
const colors: Record<string, string> = {
  '#5B3FBF': '#b1a0ff',
  '#C2426B': '#ff91b4',
  '#1F7A6B': '#63d5bb',
  '#B4711A': '#ffd18c',
  '#2E6FB7': '#85bbff',
  '#8A79E8': '#b1a0ff',
};
const lanes: Record<string, { label: string; sub: string }> = {
  sys: { label: 'Build', sub: 'Systems & datasets' },
  evd: { label: 'Understand', sub: 'People & practices' },
  con: { label: 'Question', sub: 'Trust & consequences' },
};
const clean = (s: string) => s.replace('✦', '');
const year = (key: string) =>
  Number(byId[byKey[key].publicationId].kind.match(/20\d{2}/)?.[0]);
const status = (key: string) =>
  key.startsWith('arXiv')
    ? 'Preprint'
    : key.startsWith('pat')
      ? 'Patent'
      : byId[byKey[key].publicationId].kind.split(' · ')[1];

export default function ResearchMap() {
  const [theme, setTheme] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('arXiv.2');
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<'paths' | 'timeline' | 'list'>('paths');
  const [focus, setFocus] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const active = themes.find((t) => t.key === theme)!;
  const filtered = useMemo(
    () =>
      map.nodes.filter((n) => {
        const p = byId[n.publicationId];
        return (
          (theme === 'all' || active.tags.some((t) => n.tags.includes(t))) &&
          `${p.title} ${p.authors} ${p.venue} ${p.tags.join(' ')}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        );
      }),
    [theme, query],
  );
  // Filters always select a visible result; never show an unrelated hidden work in the inspector.
  const effectiveSelected = filtered.some((n) => n.key === selected)
    ? selected
    : filtered[0]?.key;
  const selectedNode = effectiveSelected ? byKey[effectiveSelected] : null;
  const paper = selectedNode ? byId[selectedNode.publicationId] : null;
  const lineage = useMemo(
    () =>
      effectiveSelected
        ? traceLineage(effectiveSelected, map.edges)
        : { ancestors: new Set<string>(), descendants: new Set<string>() },
    [effectiveSelected],
  );
  const chain = new Set([
    effectiveSelected,
    ...lineage.ancestors,
    ...lineage.descendants,
  ]);
  const displayed = focus ? filtered.filter((n) => chain.has(n.key)) : filtered;
  const layout = useMemo(
    () =>
      layoutResearch(
        displayed.map((n) => ({
          key: n.key,
          year: year(n.key),
          lane: n.arc,
          order: n.y,
        })),
        map.edges,
        view === 'timeline' ? 'timeline' : 'paths',
      ),
    [displayed.map((n) => n.key).join('|'), view],
  );
  const directBefore = map.edges
    .filter((e) => e.to === effectiveSelected)
    .map((e) => e.from);
  const directAfter = map.edges
    .filter((e) => e.from === effectiveSelected)
    .map((e) => e.to);
  const reduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (window.matchMedia('(max-width: 700px)').matches) setView('list');
  }, []);
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0, left: 0 });
  }, [theme, query, view, focus]);
  function choose(key: string, locate = false) {
    setSelected(key);
    if (!filtered.some((n) => n.key === key)) {
      setTheme('all');
      setQuery('');
    }
    if (locate) {
      requestAnimationFrame(() => {
        const target = document.getElementById(
          `atlas-node-${key.replaceAll('.', '-')}`,
        );
        const box = viewport.current;
        if (target && box) {
          box.scrollTo({
            left:
              target.offsetLeft * zoom -
              box.clientWidth / 2 +
              (CARD_WIDTH * zoom) / 2,
            top:
              target.offsetTop * zoom -
              box.clientHeight / 2 +
              (CARD_HEIGHT * zoom) / 2,
            behavior: reduced() ? 'instant' : 'smooth',
          });
        }
      });
    }
  }
  function reset() {
    setTheme('all');
    setQuery('');
    setZoom(1);
    setSelected('arXiv.2');
    setFocus(false);
    viewport.current?.scrollTo({ top: 0, left: 0 });
  }
  function locate() {
    if (effectiveSelected) choose(effectiveSelected, true);
  }
  function showDetails() {
    setDetailOpen(true);
  }
  const relations = (ids: string[]) =>
    ids.map((key) => (
      <Button
        key={key}
        className="lineage-link"
        onClick={() => choose(key, true)}
      >
        <span>{byKey[key].label}</span>
        <span>{year(key)} ↗</span>
      </Button>
    ));
  const detail =
    paper && selectedNode ? (
      <>
        <span className="detail-kicker">
          {year(selectedNode.key)} · {status(selectedNode.key)}
        </span>
        <h3>{clean(paper.title)}</h3>
        <p className="detail-authors">{paper.authors}</p>
        <p className="detail-venue">{paper.venue}</p>
        <PublicationFigure
          key={paper.id}
          publicationId={paper.id}
          title={paper.title}
        />
        <p className="detail-abstract">{paper.note}</p>
        <div className="detail-links">
          {paper.url && (
            <a href={paper.url}>
              Read paper <ArrowUpRight size={16} />
            </a>
          )}
          {selectedNode.key === 'arXiv.2' && (
            <a href="https://github.com/KindOPSTAR/QualiGPT">
              Code <ArrowUpRight size={16} />
            </a>
          )}
          {selectedNode.key === 'c.4' && (
            <a href="https://github.com/KindOPSTAR/VRMN-bD">
              Dataset <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <div className="detail-topics">
          {paper.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="direct-relations">
          <div>
            <h4>
              <ArrowDownLeft size={15} /> Builds on{' '}
              <span>{directBefore.length}</span>
            </h4>
            {directBefore.length ? (
              relations(directBefore)
            ) : (
              <p>A starting point in this research map.</p>
            )}
          </div>
          <div>
            <h4>
              <ArrowUpRight size={15} /> Leads to{' '}
              <span>{directAfter.length}</span>
            </h4>
            {directAfter.length ? (
              relations(directAfter)
            ) : (
              <p>No subsequent work mapped yet.</p>
            )}
          </div>
        </div>
        {(lineage.ancestors.size > directBefore.length ||
          lineage.descendants.size > directAfter.length) && (
          <p className="lineage-summary">
            Across this branch: {lineage.ancestors.size} earlier and{' '}
            {lineage.descendants.size} later works.
          </p>
        )}
      </>
    ) : null;
  return (
    <section
      ref={section}
      className="research-map-section atlas-v2"
      id="research-map"
      aria-labelledby="map-heading"
    >
      <div className="map-intro">
        <div>
          <span className="section-kicker">01 / Research atlas</span>
          <h2 id="map-heading">
            Ideas grow into
            <br />
            <em>connected work.</em>
          </h2>
          <p>
            Explore the systems I build, the evidence I gather, and the
            consequences I trace.
          </p>
        </div>
        <div className="atlas-summary">
          <div>
            <strong>{map.nodes.length}</strong>
            <span>works & projects</span>
          </div>
          <div>
            <strong>{map.edges.length}</strong>
            <span>research connections</span>
          </div>
          <p>2022 — 2026</p>
        </div>
      </div>
      <div className="map-controls">
        <ToggleGroup
          className="map-themes"
          value={[theme]}
          onValueChange={(v) => v[0] && setTheme(v[0] as string)}
          aria-label="Filter by research theme"
        >
          {themes.map((t) => (
            <ToggleGroupItem
              key={t.key}
              value={t.key}
              className="theme-control"
              style={{ '--theme-color': t.color } as CSSProperties}
            >
              <span className="theme-dot" />
              {t.label}
              <span className="theme-total">
                {t.key === 'all'
                  ? map.nodes.length
                  : map.nodes.filter((n) =>
                      t.tags.some((tag) => n.tags.includes(tag)),
                    ).length}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="map-toolbar">
          <label className="map-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">
              Search research titles, authors, venues, or topics
            </span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a work, author, or topic…"
            />
            {query && (
              <Button
                className="clear-search"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                ×
              </Button>
            )}
          </label>
          <ToggleGroup
            className="view-switch"
            value={[view]}
            onValueChange={(v) => v[0] && setView(v[0] as typeof view)}
            aria-label="Atlas view"
          >
            <ToggleGroupItem value="paths">Research paths</ToggleGroupItem>
            <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
          </ToggleGroup>
          <Button
            className="map-button"
            onClick={reset}
            aria-label="Reset research filters and zoom"
          >
            <RotateCcw size={15} /> Reset
          </Button>
        </div>
      </div>
      <div className="atlas-workspace">
        <div className="atlas-stage">
          <div className="map-help">
            <div className="focus-control">
              <Switch
                id="focus-lineage"
                checked={focus}
                onCheckedChange={setFocus}
                disabled={!effectiveSelected}
              />
              <label htmlFor="focus-lineage">Focus this branch</label>
            </div>
            <span className="matching" role="status">
              {displayed.length} / {map.nodes.length} works
            </span>
            {view !== 'list' && (
              <div className="zoom-controls">
                <Button
                  className="map-button"
                  aria-label="Zoom out"
                  disabled={zoom <= 0.9}
                  onClick={() =>
                    setZoom((z) => Math.max(0.9, Number((z - 0.1).toFixed(1))))
                  }
                >
                  <Minus size={14} />
                </Button>
                <span>{Math.round(zoom * 100)}%</span>
                <Button
                  className="map-button"
                  aria-label="Zoom in"
                  disabled={zoom >= 1.5}
                  onClick={() =>
                    setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))
                  }
                >
                  <Plus size={14} />
                </Button>
                <Button
                  className="map-button locate"
                  onClick={locate}
                  disabled={!effectiveSelected}
                  aria-label="Center selected work"
                >
                  <Focus size={15} />
                </Button>
              </div>
            )}
          </div>
          {!displayed.length ? (
            <div className="atlas-empty">
              <Search size={26} />
              <h3>No matching research</h3>
              <p>Try a different title, author, or theme.</p>
              <Button className="map-button" onClick={reset}>
                Show all works
              </Button>
            </div>
          ) : view === 'list' ? (
            <div className="map-list">
              {displayed.map((n) => {
                const p = byId[n.publicationId];
                return (
                  <Button
                    key={n.key}
                    className={`map-list-item ${effectiveSelected === n.key ? 'is-selected' : ''}`}
                    onClick={() => choose(n.key)}
                    aria-pressed={effectiveSelected === n.key}
                    aria-controls="research-detail"
                  >
                    <span>
                      {year(n.key)} · {status(n.key)}
                    </span>
                    <strong>{clean(p.title)}</strong>
                    <span>{p.venue}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div
              className="map-viewport"
              ref={viewport}
              tabIndex={0}
              role="region"
              aria-label={
                view === 'paths'
                  ? 'Research development graph; scroll horizontally and vertically to explore'
                  : 'Research timeline; scroll to explore'
              }
            >
              <div
                style={{
                  width: layout.width * zoom,
                  height: layout.height * zoom,
                }}
              >
                <div
                  className="map-canvas"
                  style={{
                    width: layout.width,
                    height: layout.height,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {layout.columns.map((label, i) => (
                    <div
                      className="map-year"
                      key={label}
                      style={{ left: 150 + i * 228 }}
                    >
                      {label}
                      <div style={{ height: layout.height - 50 }} />
                    </div>
                  ))}
                  {layout.bands.map((b) => (
                    <div
                      className="map-band"
                      key={b.key}
                      style={{ top: b.y, height: b.height }}
                    >
                      <div>
                        <strong>{lanes[b.key].label}</strong>
                        <span>{lanes[b.key].sub}</span>
                      </div>
                    </div>
                  ))}
                  <svg
                    className="connections"
                    width={layout.width}
                    height={layout.height}
                    aria-hidden="true"
                  >
                    <defs>
                      <marker
                        id="map-arrow"
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
                    {map.edges.map((e, i) => {
                      const a = layout.positions[e.from],
                        b = layout.positions[e.to];
                      if (!a || !b) return null;
                      const direct =
                        e.from === effectiveSelected ||
                        e.to === effectiveSelected;
                      const traced = chain.has(e.from) && chain.has(e.to);
                      const sameColumn = a.x === b.x;
                      const d = sameColumn
                        ? `M${a.x + CARD_WIDTH},${a.y + 32} C${a.x + CARD_WIDTH + 30},${a.y + 32} ${b.x + CARD_WIDTH + 30},${b.y + 32} ${b.x + CARD_WIDTH + 3},${b.y + 32}`
                        : `M${a.x + CARD_WIDTH},${a.y + 32} C${a.x + CARD_WIDTH + 50},${a.y + 32} ${b.x - 50},${b.y + 32} ${b.x - 4},${b.y + 32}`;
                      return (
                        <path
                          key={i}
                          d={d}
                          fill="none"
                          stroke={
                            direct ? '#d4ef8a' : traced ? '#a9c4a7' : '#536982'
                          }
                          strokeWidth={direct ? 2.6 : traced ? 1.7 : 1}
                          opacity={traced ? 0.95 : 0.23}
                          markerEnd="url(#map-arrow)"
                        />
                      );
                    })}
                  </svg>
                  {displayed.map((n) => {
                    const pos = layout.positions[n.key],
                      p = byId[n.publicationId];
                    return (
                      <button
                        id={`atlas-node-${n.key.replaceAll('.', '-')}`}
                        key={n.key}
                        className={`map-node ${effectiveSelected === n.key ? 'is-selected' : ''} ${chain.has(n.key) ? 'is-related' : 'is-muted'} ${['Preprint', 'Patent'].includes(status(n.key)) ? 'is-provisional' : ''}`}
                        style={
                          {
                            left: pos.x,
                            top: pos.y,
                            '--node-color': colors[n.color] || n.color,
                          } as CSSProperties
                        }
                        onClick={() => choose(n.key)}
                        aria-pressed={effectiveSelected === n.key}
                        aria-controls="research-detail"
                        title={clean(p.title)}
                      >
                        <span className="node-label">{n.label}</span>
                        <span className="node-meta">
                          {year(n.key)} · {status(n.key)}
                        </span>
                        {p.selected && (
                          <span
                            className="node-star"
                            aria-label="Selected work"
                          >
                            ✦
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="map-legend">
            <span>
              <i className="legend-line traced" /> Selected connections
            </span>
            <span>✦ Selected work</span>
            <span>Dashed: preprint or patent</span>
          </div>
          {paper && (
            <div className="mobile-selection">
              <div>
                <span>Selected work</span>
                <strong>{selectedNode?.label}</strong>
              </div>
              <Button className="map-button" onClick={showDetails}>
                Read details <ArrowUpRight size={16} />
              </Button>
            </div>
          )}
        </div>
        <aside
          className="atlas-inspector"
          id="research-detail"
          aria-label="Selected research details"
        >
          <div className="inspector-top">
            <span>WORK IN FOCUS</span>
            {paper && (
              <Button
                className="map-button"
                onClick={showDetails}
                aria-label="Expand research details"
              >
                <Maximize2 size={14} />
              </Button>
            )}
          </div>
          {detail || (
            <p className="inspector-empty">
              Choose a work to explore its contribution and research
              connections.
            </p>
          )}
        </aside>
      </div>
      <p className="map-source-note">
        Arrows represent research development, not citation links. Paths arrange
        works by their connections; the timeline arranges them by year.
      </p>
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="atlas-sheet">
          <SheetTitle>Research details</SheetTitle>
          <SheetDescription>
            Contribution, publication information, and related work.
          </SheetDescription>
          <div className="atlas-sheet-body">{detail}</div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
