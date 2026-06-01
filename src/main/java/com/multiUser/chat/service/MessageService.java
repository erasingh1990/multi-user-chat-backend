package com.multiUser.chat.service;

import com.multiUser.chat.dto.MessageResponse;
import com.multiUser.chat.dto.ReceiptResponse;
import com.multiUser.chat.dto.SendMessageRequest;
import com.multiUser.chat.entity.*;
import com.multiUser.chat.repository.*;
import com.multiUser.chat.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Comparator;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;

    private final ChatRoomRepository chatRoomRepository;

    private final ChatRoomUserRepository chatRoomUserRepository;

    private final UserRepository userRepository;

    private final MessageReceiptRepository messageReceiptRepository;

    private final SecurityUtils securityUtils;

    private final SimpMessagingTemplate messagingTemplate;

    public Message save(Message msg) {
        msg.setCreatedAt(LocalDateTime.now());
        return messageRepository.save(msg);
    }

    public List<Message> getAll() {
        return messageRepository.findAll();
    }


    public MessageResponse sendMessage(SendMessageRequest request) {

        Long currentUserId = securityUtils.getCurrentUserId();

        boolean isParticipant =
                chatRoomUserRepository
                        .existsByChatRoomIdAndUserId(
                                request.getChatRoomId(),
                                currentUserId
                        );

        if (!isParticipant) {
            throw new RuntimeException(
                    "User is not part of this chat room"
            );
        }

        ChatRoom chatRoom = chatRoomRepository.findById(
                request.getChatRoomId()
        ).orElseThrow(() ->
                new RuntimeException("Chat room not found")
        );

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        Message message = Message.builder()
                .content(request.getContent())
                .chatRoom(chatRoom)
                .user(sender)
                .createdAt(LocalDateTime.now())
                .status(MessageStatus.SENT)
                .build();

        Message savedMessage =
                messageRepository.save(message);

        List<MessageReceipt> receipts = chatRoomUserRepository
                .findByChatRoomId(chatRoom.getId())
                .stream()
                .filter(participant -> !participant.getUser().getId().equals(currentUserId))
                .map(participant -> MessageReceipt.builder()
                        .message(savedMessage)
                        .userId(participant.getUser().getId())
                        .status(MessageStatus.SENT)
                        .updatedAt(LocalDateTime.now())
                        .build())
                .toList();

        messageReceiptRepository.saveAll(receipts);

        MessageResponse response = mapToResponse(savedMessage);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + chatRoom.getId(),
                response
        );

        return response;
    }

    public PageImpl<MessageResponse> getMessages(UUID chatRoomId, Pageable pageable) {

        Long userId = securityUtils.getCurrentUserId();

        // 1. Validate membership
        //existsByChatRoomIdAndUserId(chatRoomId, userId);

        // 2. Fetch messages findByChatRoomIdOrderByCreatedAtDesc
        Page<MessageProjection> page = messageRepository.findByUserId(chatRoomId, userId, pageable);

        // 3. Map to DTO
        List<MessageResponse> responses = page.getContent().stream()
                .map(p -> new MessageResponse(
                        p.getMessageId(),
                        p.getSenderId(),
                        p.getContent(),
                        p.getCreatedAt(),
                        p.getStatus(
                ))).toList();

        // 4. Build response
        return new PageImpl<>(
                responses,
                pageable,
                page.getTotalElements()
        );
    }

    @Transactional()
    public Page<MessageResponse> getChatMessages(
            Long chatRoomId,
            int page,
            int size
    ) {

        Long currentUserId = securityUtils.getCurrentUserId();

        boolean isParticipant =
                chatRoomUserRepository
                        .existsByChatRoomIdAndUserId(
                                chatRoomId,
                                currentUserId
                        );

        if (!isParticipant) {
            throw new RuntimeException(
                    "User not part of chat"
            );
        }

        Pageable pageable =
                PageRequest.of(page, size);

        Page<Message> messages =
                messageRepository
                        .findByChatRoomIdOrderByCreatedAtDesc(
                                 chatRoomId,
                                 pageable
                        );

        return messages.map(this::mapToResponse);
    }

    public ReceiptResponse markDelivered(Long messageId) {
        return updateReceiptStatus(messageId, MessageStatus.DELIVERED);
    }

    public ReceiptResponse markRead(Long messageId) {
        return updateReceiptStatus(messageId, MessageStatus.READ);
    }

    private MessageResponse mapToResponse(
            Message message
    ) {

        return new MessageResponse(
                message.getId(),
                message.getUser().getId(),
                message.getContent(),
                message.getCreatedAt(),
                resolveMessageStatus(message)
        );
    }

    private MessageStatus resolveMessageStatus(Message message) {

        Long currentUserId = securityUtils.getCurrentUserId();

        if (!message.getUser().getId().equals(currentUserId)) {
            return messageReceiptRepository.findByMessageId(message.getId())
                    .stream()
                    .filter(receipt -> receipt.getUserId().equals(currentUserId))
                    .map(MessageReceipt::getStatus)
                    .findFirst()
                    .orElse(MessageStatus.SENT);
        }

        return messageReceiptRepository.findByMessageId(message.getId())
                .stream()
                .map(MessageReceipt::getStatus)
                .max(Comparator.comparingInt(Enum::ordinal))
                .orElse(MessageStatus.SENT);
    }

    private ReceiptResponse updateReceiptStatus(
            Long messageId,
            MessageStatus status
    ) {

        Long currentUserId = securityUtils.getCurrentUserId();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getUser().getId().equals(currentUserId)) {
            throw new RuntimeException("Sender cannot update their own receipt");
        }

        boolean isParticipant = chatRoomUserRepository.existsByChatRoomIdAndUserId(
                message.getChatRoom().getId(),
                currentUserId
        );

        if (!isParticipant) {
            throw new RuntimeException("User not part of chat");
        }

        MessageReceipt receipt = messageReceiptRepository
                .findByMessageIdAndUserId(messageId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        if (receipt.getStatus().ordinal() < status.ordinal()) {
            receipt.setStatus(status);
            receipt.setUpdatedAt(LocalDateTime.now());
        }

        MessageReceipt savedReceipt = messageReceiptRepository.save(receipt);

        ReceiptResponse response = new ReceiptResponse(
                message.getId(),
                currentUserId,
                message.getChatRoom().getId(),
                savedReceipt.getStatus(),
                savedReceipt.getUpdatedAt()
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/" + message.getChatRoom().getId() + "/receipts",
                response
        );

        return response;
    }
}
