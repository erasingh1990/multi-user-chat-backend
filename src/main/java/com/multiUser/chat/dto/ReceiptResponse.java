package com.multiUser.chat.dto;

import com.multiUser.chat.entity.MessageStatus;

import java.time.LocalDateTime;

public class ReceiptResponse {

    private Long messageId;
    private Long userId;
    private Long chatRoomId;
    private MessageStatus status;
    private LocalDateTime updatedAt;

    public ReceiptResponse(
            Long messageId,
            Long userId,
            Long chatRoomId,
            MessageStatus status,
            LocalDateTime updatedAt
    ) {
        this.messageId = messageId;
        this.userId = userId;
        this.chatRoomId = chatRoomId;
        this.status = status;
        this.updatedAt = updatedAt;
    }

    public Long getMessageId() {
        return messageId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getChatRoomId() {
        return chatRoomId;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
