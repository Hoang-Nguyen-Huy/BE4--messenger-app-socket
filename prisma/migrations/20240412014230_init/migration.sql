-- CreateTable
CREATE TABLE `User` (
    `userid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avt` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`userid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userid` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `User`(`userid`) ON DELETE RESTRICT ON UPDATE CASCADE;
