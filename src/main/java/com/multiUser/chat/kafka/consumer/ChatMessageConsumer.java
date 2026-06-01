package com.multiUser.chat.kafka.consumer;

import com.multiUser.chat.kafka.dto.ChatMessageEvent;
import com.multiUser.chat.service.MessagePersistenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageConsumer {

    private final MessagePersistenceService messagePersistenceService;

    @KafkaListener(
            topics = "chat-messages",
            groupId = "chat-consumer-group"
    )
    public void consume(ChatMessageEvent event) {

        log.info("Kafka message consumed: {}", event);

        messagePersistenceService.processIncomingMessage(event);
    }
}