-- CreateTable
CREATE TABLE `guides` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `appName` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `mode` ENUM('LIBRARY', 'LIVE') NOT NULL,
    `archetype` ENUM('INSTANT', 'HIDDEN_LIMITS', 'REVIEW', 'PARTNER_GATED', 'ENTERPRISE', 'UNKNOWN') NOT NULL,
    `difficulty` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `asOf` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guides_slug_key`(`slug`),
    INDEX `guides_mode_difficulty_idx`(`mode`, `difficulty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `runs` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'DONE', 'PARTIAL', 'FAILED') NOT NULL DEFAULT 'RUNNING',
    `stageReached` INTEGER NULL,
    `errorCode` VARCHAR(191) NULL,
    `activeSlug` VARCHAR(191) NULL,
    `guideId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,

    UNIQUE INDEX `runs_activeSlug_key`(`activeSlug`),
    INDEX `runs_slug_startedAt_idx`(`slug`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_cache` (
    `urlHash` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `tier` ENUM('OFFICIAL', 'THIRD_PARTY', 'FORUM') NOT NULL,
    `text` LONGTEXT NOT NULL,
    `contentHash` VARCHAR(191) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `page_cache_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`urlHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_log` (
    `id` VARCHAR(191) NOT NULL,
    `guideId` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NULL,
    `claimId` VARCHAR(191) NOT NULL,
    `method` ENUM('QUOTE_MATCH', 'PROBE', 'MANUAL', 'BROWSER') NOT NULL,
    `result` ENUM('PASS', 'FAIL') NOT NULL,
    `detail` TEXT NULL,
    `sourceUrl` TEXT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_log_guideId_claimId_idx`(`guideId`, `claimId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claim_reports` (
    `id` VARCHAR(191) NOT NULL,
    `guideId` VARCHAR(191) NOT NULL,
    `claimId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `claim_reports_guideId_idx`(`guideId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `runs` ADD CONSTRAINT `runs_guideId_fkey` FOREIGN KEY (`guideId`) REFERENCES `guides`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_log` ADD CONSTRAINT `verification_log_guideId_fkey` FOREIGN KEY (`guideId`) REFERENCES `guides`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_log` ADD CONSTRAINT `verification_log_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `claim_reports` ADD CONSTRAINT `claim_reports_guideId_fkey` FOREIGN KEY (`guideId`) REFERENCES `guides`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
