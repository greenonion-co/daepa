import { useCallback, useEffect, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import type { GraphNode, GraphLink } from "../lib/types";
import { getLinkSourceId, getLinkTargetId, nodeRadius } from "../lib/force-graph-utils";
import {
  SIM_LINK_DISTANCE,
  SIM_CHARGE_STRENGTH,
  SIM_AXIS_STRENGTH,
  SIM_COLLIDE_PADDING,
  SIM_ALPHA_DECAY,
  SIM_ALPHA_EXPANSION,
  SIM_ALPHA_INITIAL,
  SIM_DRAG_ALPHA_TARGET,
  PAIR_ALIGN_STRENGTH,
  GENERATION_GAP,
  GENERATION_Y_STRENGTH,
} from "../lib/force-graph-constants";

interface UseForceSimulationParams {
  nodes: GraphNode[];
  links: GraphLink[];
  maxDegree: number;
  initialNodePositions?: Record<string, { x: number; y: number }>;
}

export function useForceSimulation({
  nodes,
  links,
  maxDegree,
  initialNodePositions,
}: UseForceSimulationParams) {
  const simNodesRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<GraphLink[]>([]);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const prevNodeCountRef = useRef(0);
  const initialNodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const rafRef = useRef<number>(0);
  const [tickId, setTickId] = useState(0);

  useEffect(() => {
    initialNodePositionsRef.current = initialNodePositions ?? {};
  }, [initialNodePositions]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const prevPositions = new Map<
      string,
      { x: number; y: number; fx?: number | null; fy?: number | null }
    >();
    for (const n of simNodesRef.current) {
      if (n.x != null && n.y != null) {
        prevPositions.set(n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy });
      }
    }

    const neighborMap = new Map<string, string[]>();
    for (const link of links) {
      const s = getLinkSourceId(link);
      const t = getLinkTargetId(link);
      if (!neighborMap.has(s)) neighborMap.set(s, []);
      if (!neighborMap.has(t)) neighborMap.set(t, []);
      neighborMap.get(s)!.push(t);
      neighborMap.get(t)!.push(s);
    }

    const existingPositions = Array.from(prevPositions.values());
    const maxX = existingPositions.length > 0 ? Math.max(...existingPositions.map((p) => p.x)) : 0;
    const midY =
      existingPositions.length > 0
        ? existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length
        : 0;

    const newNodes: GraphNode[] = nodes.map((n) => {
      const prev = prevPositions.get(n.id);
      if (prev) {
        return { ...n, x: prev.x, y: prev.y, fx: prev.fx ?? undefined, fy: prev.fy ?? undefined };
      }
      for (const neighborId of neighborMap.get(n.id) ?? []) {
        const neighborPos = prevPositions.get(neighborId);
        if (neighborPos) {
          return {
            ...n,
            x: neighborPos.x + (Math.random() - 0.5) * 60,
            y: neighborPos.y + (Math.random() - 0.5) * 60,
          };
        }
      }
      const initialPos = initialNodePositionsRef.current[n.id];
      if (initialPos) {
        delete initialNodePositionsRef.current[n.id];
        return { ...n, x: initialPos.x, y: initialPos.y };
      }
      return {
        ...n,
        x: maxX + 150 + (Math.random() - 0.5) * 80,
        y: midY + (Math.random() - 0.5) * 150,
      };
    });

    const newLinks: GraphLink[] = links.map((l) => ({ ...l }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    simNodesRef.current = newNodes;
    simLinksRef.current = newLinks;

    const pairAlignForce = (alpha: number) => {
      for (const link of newLinks) {
        if (!link.isPair) continue;
        const s = link.source as GraphNode;
        const t = link.target as GraphNode;
        if (s.y == null || t.y == null) continue;
        const avgY = (s.y + t.y) / 2;
        const k = PAIR_ALIGN_STRENGTH * alpha;
        if (s.vy != null) s.vy += (avgY - s.y) * k;
        if (t.vy != null) t.vy += (avgY - t.y) * k;
      }
    };

    const sim = forceSimulation<GraphNode>(newNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(newLinks)
          .id((d) => d.id)
          .distance(SIM_LINK_DISTANCE),
      )
      .force("charge", forceManyBody().strength(SIM_CHARGE_STRENGTH))
      .force("center", forceCenter(0, 0))
      .force("x", forceX(0).strength(SIM_AXIS_STRENGTH))
      .force(
        "y",
        forceY<GraphNode>((d) =>
          d.generation != null ? d.generation * GENERATION_GAP : 0,
        ).strength((d) => (d.generation != null ? GENERATION_Y_STRENGTH : SIM_AXIS_STRENGTH)),
      )
      .force(
        "collide",
        forceCollide<GraphNode>((d) => nodeRadius(d.degree, maxDegree, d.isPairOfCenter) + SIM_COLLIDE_PADDING),
      )
      .force("pairAlign", pairAlignForce)
      .alphaDecay(SIM_ALPHA_DECAY)
      .on("tick", () => {
        // rAF 배칭: 프레임당 최대 1회 리렌더
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setTickId((t) => t + 1));
      });

    simulationRef.current = sim;

    if (nodes.length !== prevNodeCountRef.current) {
      const isExpansion = nodes.length > prevNodeCountRef.current;
      prevNodeCountRef.current = nodes.length;
      sim.alpha(isExpansion ? SIM_ALPHA_EXPANSION : SIM_ALPHA_INITIAL).restart();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      sim.stop();
    };
  }, [nodes, links, maxDegree]);

  // 노드 위치 랜덤 재배치
  const reshufflePositions = useCallback(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    for (const node of simNodesRef.current) {
      node.x = (Math.random() - 0.5) * 300;
      node.y = (Math.random() - 0.5) * 300;
      node.fx = undefined;
      node.fy = undefined;
    }
    sim.alpha(SIM_ALPHA_INITIAL).restart();
  }, []);

  return {
    simNodesRef,
    simLinksRef,
    simulationRef,
    tickId,
    /** 드래그 시 사용 */
    SIM_DRAG_ALPHA_TARGET,
    reshufflePositions,
  };
}
