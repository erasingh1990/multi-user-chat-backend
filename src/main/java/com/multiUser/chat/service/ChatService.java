package com.multiUser.chat.service;

import com.multiUser.chat.kafka.dto.ChatMessageEvent;
import com.multiUser.chat.kafka.producer.ChatMessageProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageProducer producer;

    public void sendMessage(Long senderId,
                            Long receiverId,
                            String conversationId,
                            String content) {

        ChatMessageEvent event = ChatMessageEvent.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .conversationId(conversationId)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        producer.sendMessage(event);
    }
}