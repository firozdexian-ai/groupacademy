import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_data_room_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as IRDocument[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (input: {
      file: File;
      title: string;
      doc_type: string;
      total_slides?: number | null;
    }) => {
      const path = `${crypto.randomUUID()}/${input.file.name}`;
      const { error: upErr } = await supabase.storage
        .from("ir-data-room")
        .upload(path, input.file, { upsert: false });
      if (upErr) throw upErr;
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("ir_data_room_documents").insert({
        title: input.title,
        doc_type: input.doc_type,
        file_url: path,
        total_slides: input.total_slides ?? null,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-data-room-documents"] });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createShareLink = useMutation({
    mutationFn: async (input: {
      document_id: string;
      investor_id?: string | null;
      expires_in_days?: number | null;
      require_email?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const expires_at =
        input.expires_in_days && input.expires_in_days > 0
          ? new Date(Date.now() + input.expires_in_days * 86400000).toISOString()
          : null;
      const { data, error } = await supabase
        .from("ir_data_room_share_links")
        .insert({
          document_id: input.document_id,
          investor_id: input.investor_id ?? null,
          expires_at,
          require_email: input.require_email ?? true,
          created_by: user.user?.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as IRShareLink;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ir-share-links"] });
      toast.success("Share link created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeShareLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ir_data_room_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_data_room_share_links")
        .select("*")
        .eq("document_id", documentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as IRShareLink[];
    },
  });

  const views = useQuery({
    queryKey: ["ir-document-views", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_document_views")
        .select("*")
        .eq("document_id", documentId!)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as IRDocumentView[];
    },
  });

  const hotSlides = useQuery({
    queryKey: ["ir-document-hot-slides", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_document_hot_slides" as any)
        .select("*")
        .eq("document_id", documentId!)
        .order("total_dwell", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as IRHotSlide[];
    },
  });

  return { links, views, hotSlides };
}
