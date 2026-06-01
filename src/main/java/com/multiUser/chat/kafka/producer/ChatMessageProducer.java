package com.multiUser.chat.kafka.producer;

import com.multiUser.chat.kafka.dto.ChatMessageEvent;
import com.multiUser.chat.kafka.topics.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageProducer {

    private final KafkaTemplate<String, ChatMessageEvent> kafkaTemplate;

    public void sendMessage(ChatMessageEvent event) {

        kafkaTemplate.send(
                KafkaTopics.CHAT_MESSAGES,
                event.getConversationId(),
                event
        );

        log.info("Message published to Kafka for conversation: {}",
                event.getConversationId());
    }
}