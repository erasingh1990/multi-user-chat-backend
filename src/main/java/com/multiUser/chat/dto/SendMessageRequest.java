package com.multiUser.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "chatRoomId is required")
    private Long chatRoomId;

    @NotBlank(message = "content is required")
    private String content;
}
