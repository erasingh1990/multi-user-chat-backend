package com.multiUser.chat.controller;

import com.multiUser.chat.dto.MessageResponse;
import com.multiUser.chat.dto.ReceiptResponse;
import com.multiUser.chat.dto.SendMessageRequest;
import com.multiUser.chat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody
            SendMessageRequest request
    ) {

        return ResponseEntity.ok(
                messageService.sendMessage(request)
        );
    }

    @GetMapping("/chat/{chatRoomId}")
    public ResponseEntity<Page<MessageResponse>>
    getMessages(
            @PathVariable Long chatRoomId,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "20")
            int size
    ) {

        return ResponseEntity.ok(
                messageService.getChatMessages(
                        chatRoomId,
                        page,
                        size
                )
        );
    }

    @PatchMapping("/{messageId}/delivered")
    public ResponseEntity<ReceiptResponse> markDelivered(
            @PathVariable Long messageId
    ) {

        return ResponseEntity.ok(
                messageService.markDelivered(messageId)
        );
    }

    @PostMapping("/{messageId}/delivered")
    public ResponseEntity<ReceiptResponse> markDeliveredWithPost(
            @PathVariable Long messageId
    ) {

        return ResponseEntity.ok(
                messageService.markDelivered(messageId)
        );
    }

    @PatchMapping("/{messageId}/read")
    public ResponseEntity<ReceiptResponse> markRead(
            @PathVariable Long messageId
    ) {

        return ResponseEntity.ok(
                messageService.markRead(messageId)
        );
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<ReceiptResponse> markReadWithPost(
            @PathVariable Long messageId
    ) {

        return ResponseEntity.ok(
                messageService.markRead(messageId)
        );
    }
}
