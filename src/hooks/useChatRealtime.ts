import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface UseChatRealtimeOptions {
  chatId: string | null | undefined;
  onNewMessage?: (payload: any) => void;
}

export function useChatRealtime({ chatId, onNewMessage }: UseChatRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-realtime-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["course-messages", chatId] });
          if (onNewMessage) {
            onNewMessage(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient, onNewMessage]);
}
