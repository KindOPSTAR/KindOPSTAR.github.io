export type Edge = {from:string;to:string};
export function traceLineage(key:string, edges:Edge[]) {
 const ancestors=new Set<string>(),descendants=new Set<string>();
 function walk(start:string,direction:'up'|'down',seen:Set<string>){const queue=[start];while(queue.length){const next=queue.shift()!;for(const edge of edges){const a=direction==='up'?edge.to:edge.from;const b=direction==='up'?edge.from:edge.to;if(a===next&&b!==start&&!seen.has(b)){seen.add(b);queue.push(b);}}}}
 walk(key,'up',ancestors);walk(key,'down',descendants);return {ancestors,descendants};
}
