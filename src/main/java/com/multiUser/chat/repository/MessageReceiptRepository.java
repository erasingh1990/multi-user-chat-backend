package com.multiUser.chat.repository;

import com.multiUser.chat.entity.MessageReceipt;
import com.multiUser.chat.entity.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, Long> {

    List<MessageReceipt> findByUserIdAndStatus(Long userId, MessageStatus status);

    List<MessageReceipt> findByMessageId(Long messageId);

    Optional<MessageReceipt> findByMessageIdAndUserId(Long messageId, Long userId);

    @Modifying
    @Query("""
    UPDATE MessageReceipt mr
    SET mr.status = :status, mr.updatedAt = CURRENT_TIMESTAMP
    WHERE mr.userId = :userId AND mr.message.id IN :messageIds """)
    void updateStatusForMessages(Long userId, List<Long> messageIds, MessageStatus status);



}
