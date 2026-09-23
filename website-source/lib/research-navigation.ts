export type ResearchLocation = {
  area: string | null;
  paper: string | null;
  anchor: string | null;
};
export type ResearchNavigation = {
  current: ResearchLocation;
  past: ResearchLocation[];
};
export type ResearchAction =
  | { type: 'area'; area: string }
  | { type: 'paper'; paper: string; area: string }
  | { type: 'locate'; area: string }
  | { type: 'overview' }
  | { type: 'back' };
export const initialResearchNavigation: ResearchNavigation = {
  current: { area: null, paper: null, anchor: null },
  past: [],
};

/** Preview related papers without changing the graph's context. */
export function researchNavigation(
  state: ResearchNavigation,
  action: ResearchAction,
): ResearchNavigation {
  if (action.type === 'back') {
    if (!state.past.length) return state;
    return {
      current: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
    };
  }
  let next = state.current;
  if (action.type === 'overview') next = initialResearchNavigation.current;
  if (action.type === 'area' && action.area !== state.current.area)
    next = { area: action.area, paper: null, anchor: null };
  if (action.type === 'paper')
    next = {
      area: state.current.area ?? action.area,
      paper: action.paper,
      anchor:
        !state.current.area || action.area === state.current.area
          ? action.paper
          : state.current.anchor,
    };
  if (action.type === 'locate' && state.current.paper)
    next = {
      area: action.area,
      paper: state.current.paper,
      anchor: state.current.paper,
    };
  if (
    next.area === state.current.area &&
    next.paper === state.current.paper &&
    next.anchor === state.current.anchor
  )
    return state;
  return { current: next, past: [...state.past, state.current].slice(-50) };
}
