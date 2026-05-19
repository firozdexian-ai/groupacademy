/**
 * Agents domain registry — single declarative surface for every agent the
 * platform exposes (talent-facing, admin, and B2B/Gro10x). Adding a new agent
 * = one row here + (optionally) a lazy-loaded UI module.
 *
 * Migration note: this re-exports the existing legacy catalogs so behaviour
 * is byte-identical. As we move the catalogs into this folder, swap the
 * imports below — call sites are already pointing here.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { AI_AGENTS, type AIAgent, getAgentById } from "@/lib/constants/agents";
import { ADMIN_AGENTS, ADMIN_AGENTS_BY_KEY, type AdminAgent } from "@/lib/adminAgents";
import { GRO10X_AGENTS, AGENT_BY_KEY as GRO10X_AGENT_BY_KEY, getAgentMeta as getGro10xAgentMeta, type Gro10xAgent } from "@/gro10x/lib/agents";

export type AgentScope = "talent" | "admin" | "gro10x";

export interface AgentRegistryEntry {
  /** Stable agent_key matching the `ai_agents` table. */
  id: string;
  /** Where this agent surfaces in the UI shells. */
  scope: AgentScope;
  /** Display label. */
  label: string;
  /** Edge function that backs the chat runtime. */
  edge: string;
  /** Optional lazy UI module for the agent's dedicated screen. */
  ui?: LazyExoticComponent<ComponentType<any>>;
}

/**
 * AgentChat is the shared screen used by every shell when a user opens a
 * single-agent thread. Shells import it via `@/domains/agents` so we have a
 * single bundle entry point per shell.
 */
export const AgentChatScreen = lazy(() => import("@/pages/app/AgentChat"));

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  ...AI_AGENTS.map<AgentRegistryEntry>((a) => ({
    id: a.id,
    scope: "talent",
    label: a.name,
    edge: "agent-runtime",
    ui: AgentChatScreen,
  })),
  ...ADMIN_AGENTS.map<AgentRegistryEntry>((a) => ({
    id: a.key,
    scope: "admin",
    label: a.name,
    edge: a.functionName ?? "agent-runtime",
  })),
  ...GRO10X_AGENTS.map<AgentRegistryEntry>((a) => ({
    id: a.key,
    scope: "gro10x",
    label: a.name,
    edge: "agent-runtime",
  })),
];

export const AGENT_BY_ID: Record<string, AgentRegistryEntry> = Object.fromEntries(
  AGENT_REGISTRY.map((a) => [`${a.scope}:${a.id}`, a]),
);

export function getAgent(scope: AgentScope, id: string): AgentRegistryEntry | undefined {
  return AGENT_BY_ID[`${scope}:${id}`];
}

// Legacy re-exports so consumers can migrate gradually.
export {
  AI_AGENTS,
  getAgentById,
  ADMIN_AGENTS,
  ADMIN_AGENTS_BY_KEY,
  GRO10X_AGENTS,
  GRO10X_AGENT_BY_KEY,
  getGro10xAgentMeta,
};
export type { AIAgent, AdminAgent, Gro10xAgent };
