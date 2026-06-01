package com.multiUser.chat.controller;

import com.multiUser.chat.dto.ChatRequest;
import com.multiUser.chat.entity.Message;
import com.multiUser.chat.service.ChatService;
import com.multiUser.chat.service.MessageService;
import com.multiUser.chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageService service;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;


    @MessageMapping("/send")
    public void sendMessage(ChatRequest request,
                            Principal principal) {

        Long senderId = userService
                .findByEmail(principal.getName())
                .getId();

        chatService.sendMessage(
                senderId,
                request.getReceiverId(),
                request.getConversationId(),
                request.getContent()
        );
    }

    @GetMapping("/messages")
    public List<Message> getAll() {
        return service.getAll();
    }
}