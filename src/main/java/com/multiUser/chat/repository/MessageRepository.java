package com.multiUser.chat.repository;

import com.multiUser.chat.entity.Message;
import com.multiUser.chat.entity.MessageProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.UUID;


@Repository
    public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByChatRoomIdOrderByCreatedAtDesc(
            Long chatRoomId,
            Pageable pageable
    );

    Page<MessageProjection> findByUserId(UUID chatRoomId, Long userId, org.springframework.data.domain.Pageable pageable);
}

