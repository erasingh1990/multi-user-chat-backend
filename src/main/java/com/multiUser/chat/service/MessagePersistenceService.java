package com.multiUser.chat.service;

import com.multiUser.chat.entity.Message;
import com.multiUser.chat.kafka.dto.ChatMessageEvent;
import com.multiUser.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MessagePersistenceService {

    private final MessageRepository messageRepository;

    private final SimpMessagingTemplate messagingTemplate;

    public void processIncomingMessage(ChatMessageEvent event) {

        Message message = Message.builder()
                .content(event.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/messages/" + event.getReceiverId(),
                event
        );
    }
}