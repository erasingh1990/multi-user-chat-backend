package com.multiUser.chat.kafka.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEvent {

    private Long senderId;

    private Long receiverId;

    private String conversationId;

    private String content;

    private LocalDateTime timestamp;
}