/**
 * Messaging domain barrel. Surfaces peer DM threads, agent inbox UI,
 * the Unipile WhatsApp channel admin tab, and the typed edge client.
 */
export * from "./hooks/useMessageThreads";
export * from "./hooks/useDirectMessages";
export * from "./components/talent/ChatBubble";
export * from "./components/talent/ThreadListItem";
export * from "./components/admin/MessagingChannelsTab";
export * from "./api/manifest";
