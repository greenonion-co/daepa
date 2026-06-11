-- 전체 공지 푸시(Announcement Broadcast) 테이블 DDL
--
-- 주의: 서버는 TypeORM `synchronize: true` 로 동작하므로, 엔티티 등록 후
--      서버 부팅 시 이 테이블이 자동 생성됩니다. 이 파일은 수동 검토/사전 적용용 참고 DDL입니다.
--
-- 컬럼명은 SnakeNamingStrategy 기준 (entity camelCase -> snake_case).

CREATE TABLE IF NOT EXISTS `announcements` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `title`         VARCHAR(255) NOT NULL,
  `body`          TEXT         NOT NULL,
  `data_path`     VARCHAR(255) NULL,
  `sent_by`       VARCHAR(255) NOT NULL,
  `status`        ENUM('sending', 'sent', 'failed') NOT NULL DEFAULT 'sending',
  `target_count`  INT          NOT NULL DEFAULT 0,
  `success_count` INT          NOT NULL DEFAULT 0,
  `failure_count` INT          NOT NULL DEFAULT 0,
  `failures_by_code` JSON      NULL,
  `created_at`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
