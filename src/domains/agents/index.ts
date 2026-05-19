/**
 * Public surface of the Agents domain. Shells must import from here, never
 * from internal files, so we can refactor freely behind this boundary.
 */
export * from "./registry";
export { agentsApi } from "./api/manifest";
export type { AgentRuntimeRequest, AgentRuntimeResponse } from "./api/manifest";
