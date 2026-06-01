package com.multiUser.chat.entity;

import lombok.Getter;
import java.time.LocalDateTime;

public interface MessageProjection {

    Long getMessageId();

    Long getSenderId();

    String getContent();

    LocalDateTime getCreatedAt();

    MessageStatus getStatus();
}