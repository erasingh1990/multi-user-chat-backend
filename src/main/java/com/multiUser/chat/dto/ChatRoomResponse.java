package com.multiUser.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ChatRoomResponse {

    private Long chatRoomId;
    private String type;
    private List<Long> participantIds;
    private LocalDateTime createdAt;
}
