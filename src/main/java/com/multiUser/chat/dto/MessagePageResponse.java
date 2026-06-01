package com.multiUser.chat.dto;

import java.util.List;

public class MessagePageResponse {
    private List<MessageResponse> messages;
    private boolean hasNext;
    private String nextCursor; // optional if cursor-based
}