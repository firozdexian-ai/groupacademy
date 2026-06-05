/**
 * Messaging domain barrel. Surfaces peer DM threads, agent inbox UI,
 * the Unipile WhatsApp channel admin tab, and the typed edge client.
 * Repo + hook helpers are imported directly via deep paths from external
 * consumers; this barrel exists for shell wiring discoverability.
 */
export { useMessageThreads } from "./hooks/useMessageThreads";
export { useDirectMessages } from "./hooks/useDirectMessages";
export { ChatBubble } from "./components/talent/ChatBubble";
export { ThreadListItem } from "./components/talent/ThreadListItem";
export { MessagingChannelsTab } from "./components/admin/MessagingChannelsTab";
export { messagingApi } from "./api/manifest";
export type { MessagingApi } from "./api/manifest";
