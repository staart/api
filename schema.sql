SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for api-keys
-- ----------------------------
DROP TABLE IF EXISTS `api-keys`;
CREATE TABLE `api-keys` (
  `apiKey` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `secretKey` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `userId` int(12) NOT NULL,
  `organizationId` int(12) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`apiKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for approved-locations
-- ----------------------------
DROP TABLE IF EXISTS `approved-locations`;
CREATE TABLE `approved-locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `subnet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for backup-codes
-- ----------------------------
DROP TABLE IF EXISTS `backup-codes`;
CREATE TABLE `backup-codes` (
  `code` int(6) NOT NULL,
  `userId` int(11) NOT NULL,
  `used` int(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `id` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for emails
-- ----------------------------
DROP TABLE IF EXISTS `emails`;
CREATE TABLE `emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `userId` int(11) NOT NULL,
  `isVerified` int(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for events
-- ----------------------------
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `organizationId` int(11) DEFAULT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `data` text,
  `ipAddress` varchar(255) DEFAULT NULL,
  `userAgent` text,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for memberships
-- ----------------------------
DROP TABLE IF EXISTS `memberships`;
CREATE TABLE `memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organizationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT 'member',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `org` (`organizationId`),
  KEY `user` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `userId` int(12) NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `text` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `link` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `read` int(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for organizations
-- ----------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `invitationDomain` varchar(255) DEFAULT NULL,
  `stripeCustomerId` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `primaryEmail` int(12) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `twoFactorEnabled` int(1) NOT NULL DEFAULT '0',
  `twoFactorSecret` varchar(255) DEFAULT NULL,
  `countryCode` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT 'us',
  `timezone` varchar(255) NOT NULL DEFAULT 'Europe/Amsterdam',
  `notificationEmails` int(1) NOT NULL DEFAULT '1',
  `preferredLanguage` varchar(5) NOT NULL DEFAULT 'en-us',
  `prefersReducedMotion` int(1) NOT NULL DEFAULT '0',
  `prefersColorSchemeDark` int(1) NOT NULL DEFAULT '0',
  `role` int(1) NOT NULL DEFAULT '1',
  `gender` varchar(1) NOT NULL DEFAULT 'x',
  `profilePicture` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS = 1;
