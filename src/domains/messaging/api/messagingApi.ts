/**
 * Messaging domain — typed edge function wrappers (Phase 9g + 9h).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  HandleEmailUnsubscribeResponseSchema,
  MessagingGroupManagerResponseSchema,
  MessagingSendResponseSchema,
  SendTransactionalEmailResponseSchema,
  TelegramDiagnosticResponseSchema,
  UnipileConnectResponseSchema,
  type HandleEmailUnsubscribeRequest,
  type HandleEmailUnsubscribeResponse,
  type MessagingGroupManagerRequest,
  type MessagingGroupManagerResponse,
  type MessagingSendRequest,
  type MessagingSendResponse,
  type SendTransactionalEmailRequest,
  type SendTransactionalEmailResponse,
  type TelegramDiagnosticRequest,
  type TelegramDiagnosticResponse,
  type UnipileConnectRequest,
  type UnipileConnectResponse,
} from "@/edge/contracts/messaging";

export async function unipileConnect(
  req: UnipileConnectRequest,
): Promise<UnipileConnectResponse> {
  const { data, error } = await supabase.functions.invoke("unipile-connect", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("unipile-connect", error);
  return parseEdgeResponse(
    "unipile-connect",
    UnipileConnectResponseSchema,
    data ?? {},
  );
}

export async function messagingSend(
  req: MessagingSendRequest,
): Promise<MessagingSendResponse> {
  const { data, error } = await supabase.functions.invoke("messaging-send", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("messaging-send", error);
  return parseEdgeResponse(
    "messaging-send",
    MessagingSendResponseSchema,
    data ?? {},
  );
}

export async function messagingGroupManager(
  req: MessagingGroupManagerRequest,
): Promise<MessagingGroupManagerResponse> {
  const { data, error } = await supabase.functions.invoke(
    "messaging-group-manager",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("messaging-group-manager", error);
  return parseEdgeResponse(
    "messaging-group-manager",
    MessagingGroupManagerResponseSchema,
    data ?? {},
  );
}

export async function sendTransactionalEmail(
  req: SendTransactionalEmailRequest,
): Promise<SendTransactionalEmailResponse> {
  const { data, error } = await supabase.functions.invoke(
    "send-transactional-email",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("send-transactional-email", error);
  return parseEdgeResponse(
    "send-transactional-email",
    SendTransactionalEmailResponseSchema,
    data ?? {},
  );
}

export async function telegramDiagnostic(
  req: TelegramDiagnosticRequest = {},
): Promise<TelegramDiagnosticResponse> {
  const { data, error } = await supabase.functions.invoke(
    "telegram-diagnostic",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("telegram-diagnostic", error);
  return parseEdgeResponse(
    "telegram-diagnostic",
    TelegramDiagnosticResponseSchema,
    data ?? {},
  );
}

export async function handleEmailUnsubscribe(
  req: HandleEmailUnsubscribeRequest,
): Promise<HandleEmailUnsubscribeResponse> {
  const { data, error } = await supabase.functions.invoke(
    "handle-email-unsubscribe",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("handle-email-unsubscribe", error);
  return parseEdgeResponse(
    "handle-email-unsubscribe",
    HandleEmailUnsubscribeResponseSchema,
    data ?? {},
  );
}
