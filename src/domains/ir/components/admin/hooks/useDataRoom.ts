import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDataRoomDocuments,
  uploadDataRoomDocument,
  createDataRoomShareLink,
  revokeDataRoomShareLink,
  listShareLinksByDocument,
  listDocumentViews,
  listDocumentHotSlides,
} from "@/domains/ir/repo/irRepo";

export interface IRDocument {
  id: string;
  title: string;
  doc_type: string;
  file_url: string | null;
  external_url: string | null;
  version: number;
  total_slides: number | null;
  is_active: boolean;
  created_at: string;
}

export interface IRShareLink {
  id: string;
  document_id: string;
  investor_id: string | null;
  token: string;
  expires_at: string | null;
  require_email: boolean;
  revoked_at: string | null;
  created_at: string;
}

export interface IRDocumentView {
  id: string;
  share_link_id: string | null;
  viewer_email: string | null;
  viewer_ip: string | null;
  user_agent: string | null;
  started_at: string;
  total_seconds: number;
  completed: boolean;
}

export interface IRHotSlide {
  document_id: string;
  investor_id: string | null;
  slide_number: number;
  slide_label: string | null;
  total_dwell: number;
  last_seen: string;
}

export function useIRDataRoom() {
  const qc = useQueryClient();

  const documents = useQuery({
    queryKey: ["ir-data-room-documents"],
    queryFn: async () => (await listDataRoomDocuments()) as IRDocument[],
  });

  const uploadDocument = useMutation({
    mutationFn: (input: { file: File; title: string; doc_type: string; total_slides?: number | null }) =>
      uploadDataRoomDocument(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-data-room-documents"] });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createShareLink = useMutation({
    mutationFn: (input: {
      document_id: string;
      investor_id?: string | null;
      expires_in_days?: number | null;
      require_email?: boolean;
    }) => createDataRoomShareLink(input) as Promise<IRShareLink>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-share-links"] });
      toast.success("Share link created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeShareLink = useMutation({
    mutationFn: (id: string) => revokeDataRoomShareLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-share-links"] });
      toast.success("Share link revoked");
    },
  });

  return { documents, uploadDocument, createShareLink, revokeShareLink };
}

export function useDocumentTelemetry(documentId: string | null) {
  const links = useQuery({
    queryKey: ["ir-share-links", documentId],
    enabled: !!documentId,
    queryFn: async () => (await listShareLinksByDocument(documentId!)) as IRShareLink[],
  });

  const views = useQuery({
    queryKey: ["ir-document-views", documentId],
    enabled: !!documentId,
    queryFn: async () => (await listDocumentViews(documentId!)) as IRDocumentView[],
  });

  const hotSlides = useQuery({
    queryKey: ["ir-document-hot-slides", documentId],
    enabled: !!documentId,
    queryFn: async () => (await listDocumentHotSlides(documentId!)) as IRHotSlide[],
  });

  return { links, views, hotSlides };
}
