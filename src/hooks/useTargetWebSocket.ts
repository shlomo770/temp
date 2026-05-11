import { useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

export const useTargetWebSocket = () => {
  const { sendMessage } = useWebSocket();

  const allocateTarget = useCallback((targetId: string) => {
    sendMessage("ALLOCATE", {
      tgt_id: targetId,
      context: 0
    });
  }, [sendMessage]);

  const abortTarget = useCallback((targetId: string) => {
    sendMessage("CANCEL_ENGAGEMENT", {
      tgt_id: targetId,
      context: 0
    });
  }, [sendMessage]);

  const setTargetInfo = useCallback((targetId: string, identity: boolean) => {
    sendMessage("SET_TARGET_INFO", {
      tgt_id: targetId,
      platform_override: false,
      platform: 0,
      identity_override: true,
      identity: identity ? 1 : 0,
      is_allowed_in_tera: true
    });
  }, [sendMessage]);

  return {
    allocateTarget,
    abortTarget,
    setTargetInfo
  };
};
