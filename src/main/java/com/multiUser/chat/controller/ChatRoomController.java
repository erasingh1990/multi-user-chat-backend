package com.multiUser.chat.controller;

import com.multiUser.chat.dto.ChatRoomResponse;
import com.multiUser.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatrooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;


    @PostMapping("/private")
    public ResponseEntity<ChatRoomResponse> createChat(
            @RequestParam Long user1,
            @RequestParam Long user2) {

        return ResponseEntity.ok(
                chatRoomService.getOrCreateChatRoom(user1, user2)
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ChatRoomResponse>> getUserChats(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                chatRoomService.getUserChatRooms(userId)
        );
    }
}
