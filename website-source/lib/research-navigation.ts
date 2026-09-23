export type ResearchLocation = {
  area: string | null;
  paper: string | null;
};
export type ResearchNavigation = {
  current: ResearchLocation;
  past: ResearchLocation[];
};
export type ResearchAction =
  | { type: 'area'; area: string | null }
  | { type: 'paper'; paper: string; area: string }
  | { type: 'clear-paper' }
  | { type: 'back' };

export const initialResearchNavigation: ResearchNavigation = {
  current: { area: null, paper: null },
  past: [],
};

/** Every action stays on one canvas; it only changes focus and selection. */
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
  if (action.type === 'area') next = { area: action.area, paper: null };
  if (action.type === 'paper')
    next = { area: action.area, paper: action.paper };
  if (action.type === 'clear-paper') next = { ...state.current, paper: null };
  if (next.area === state.current.area && next.paper === state.current.paper)
    return state;
  return { current: next, past: [...state.past, state.current].slice(-50) };
}
