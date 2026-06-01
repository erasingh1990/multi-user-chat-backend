package com.multiUser.chat.repository;

import com.multiUser.chat.entity.ChatRoomUser;
import com.multiUser.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomUserRepository extends JpaRepository<ChatRoomUser, Long> {

    List<ChatRoomUser> findByUserId(Long userId);

    List<ChatRoomUser> findByChatRoomId(Long chatRoomId);

    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    @Query("""
            SELECT cru.chatRoom
            FROM ChatRoomUser cru
            WHERE cru.chatRoom.type = 'PRIVATE'
              AND cru.user.id IN (:userId1, :userId2)
            GROUP BY cru.chatRoom
            HAVING COUNT(DISTINCT cru.user.id) = 2
            """)
    Optional<ChatRoom> findPrivateChatRoomBetweenUsers(Long userId1, Long userId2);

}
