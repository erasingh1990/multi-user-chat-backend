package com.multiUser.chat.service;

import com.multiUser.chat.dto.ChatRoomResponse;
import com.multiUser.chat.entity.ChatRoom;
import com.multiUser.chat.entity.ChatRoomUser;
import com.multiUser.chat.entity.User;
import com.multiUser.chat.repository.ChatRoomRepository;
import com.multiUser.chat.repository.ChatRoomUserRepository;
import com.multiUser.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomUserRepository chatRoomUserRepository;
    private final UserRepository userRepository;

    public ChatRoomResponse getOrCreateChatRoom(Long userId1, Long userId2) {

        if (userId1.equals(userId2)) {
            throw new RuntimeException("Cannot create a private chat with the same user");
        }

        return chatRoomUserRepository
                .findPrivateChatRoomBetweenUsers(userId1, userId2)
                .map(this::mapToResponse)
                .orElseGet(() -> createPrivateChatRoom(userId1, userId2));
    }


    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getUserChatRooms(Long userId) {

        return chatRoomUserRepository.findByUserId(userId)
                .stream()
                .map(ChatRoomUser::getChatRoom)
                .map(this::mapToResponse)
                .toList();
    }

    private ChatRoomResponse createPrivateChatRoom(Long userId1, Long userId2) {

        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId1));

        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId2));

        ChatRoom chatRoom = new ChatRoom();
        chatRoom.setType("PRIVATE");
        chatRoom.setCreatedAt(LocalDateTime.now());

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);

        chatRoomUserRepository.save(new ChatRoomUser(savedChatRoom, user1));
        chatRoomUserRepository.save(new ChatRoomUser(savedChatRoom, user2));

        return mapToResponse(savedChatRoom);
    }

    private ChatRoomResponse mapToResponse(ChatRoom chatRoom) {

        List<Long> participantIds = chatRoomUserRepository
                .findByChatRoomId(chatRoom.getId())
                .stream()
                .map(chatRoomUser -> chatRoomUser.getUser().getId())
                .toList();

        return new ChatRoomResponse(
                chatRoom.getId(),
                chatRoom.getType(),
                participantIds,
                chatRoom.getCreatedAt()
        );
    }
}
