package com.multiUser.chat.dto;

import com.multiUser.chat.entity.MessageStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
public class MessageResponse {

    private Long messageId;
    private Long senderId;
    private String content;
    private LocalDateTime createdAt;
    private MessageStatus status;

    public MessageResponse(Long messageId,
                           Long senderId,
                           String content,
                           LocalDateTime createdAt,
                           MessageStatus status) {
        this.messageId = messageId;
        this.senderId = senderId;
        this.content = content;
        this.createdAt = createdAt;
        this.status = status;
    }
}