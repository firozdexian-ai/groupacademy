import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/**
 * GroUp Academy: Feedback Orchestration Logic
 * CTO Reference: Governs real-time system notifications and protocol feedback.
 * Performance: Enforces executive focus via single-toast limits.
 * Architecture: Digital Workforce sensor-enabled for anomaly reporting.
 */

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000; // 5s for sustained legibility

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let registryCounter = 0;
function generateNodeId() {
  registryCounter = (registryCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `SYNC_NODE_${registryCounter.toString()}`;
}

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

interface State {
  toasts: ToasterToast[];
}

const removalQueue = new Map<string, ReturnType<typeof setTimeout>>();

const queueForRegistryPurge = (toastId: string) => {
  if (removalQueue.has(toastId)) return;

  const timer = setTimeout(() => {
    removalQueue.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  removalQueue.set(toastId, timer);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        queueForRegistryPurge(toastId);
      } else {
        state.toasts.forEach((toast) => queueForRegistryPurge(toast.id));
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];
let memoryRegistry: State = { toasts: [] };

function dispatch(action: Action) {
  memoryRegistry = reducer(memoryRegistry, action);
  listeners.forEach((listener) => listener(memoryRegistry));
}

type Toast = Omit<ToasterToast, "id">;

/**
 * Enhanced Toast Dispatcher
 * Automatically identifies Employer-side anomalies for Digital Workforce reporting.
 */
function toast({ ...props }: Toast) {
  const id = generateNodeId();

  // ANOMALY SENSOR: If this is an error occurring in the Gro10x (B2B) shell,
  // it is reported to the Admin Chat for human-in-the-loop audit.
  if (props.variant === "destructive" && window.location.pathname.startsWith("/gro10x")) {
    console.warn(`[Digital Workforce] B2B Anomaly Detected: ${props.title}`);
    // Future Bridge: trigger_admin_anomaly_report({ title: props.title, desc: props.description });
  }

  const update = (props: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryRegistry);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []); // Performance: listeners should only mount once to prevent sync issues.

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
