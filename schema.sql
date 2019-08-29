/*
 Navicat Premium Data Transfer

 Source Server         : A11Y New
 Source Server Type    : MariaDB
 Source Server Version : 100221
 Source Schema         : platform

 Target Server Type    : MariaDB
 Target Server Version : 100221
 File Encoding         : 65001

 Date: 29/08/2019 12:26:46
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for staart-access-tokens
-- ----------------------------
DROP TABLE IF EXISTS `staart-access-tokens`;
CREATE TABLE `staart-access-tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `description` text COLLATE utf8mb4_bin DEFAULT NULL,
  `jwtAccessToken` text COLLATE utf8mb4_bin NOT NULL,
  `scopes` text COLLATE utf8mb4_bin DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-api-keys
-- ----------------------------
DROP TABLE IF EXISTS `staart-api-keys`;
CREATE TABLE `staart-api-keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `description` text COLLATE utf8mb4_bin DEFAULT NULL,
  `jwtApiKey` text COLLATE utf8mb4_bin NOT NULL,
  `organizationId` int(12) NOT NULL,
  `ipRestrictions` text COLLATE utf8mb4_bin DEFAULT NULL,
  `referrerRestrictions` text COLLATE utf8mb4_bin DEFAULT NULL,
  `scopes` text COLLATE utf8mb4_bin DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-approved-locations
-- ----------------------------
DROP TABLE IF EXISTS `staart-approved-locations`;
CREATE TABLE `staart-approved-locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `subnet` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-backup-codes
-- ----------------------------
DROP TABLE IF EXISTS `staart-backup-codes`;
CREATE TABLE `staart-backup-codes` (
  `code` int(6) NOT NULL,
  `userId` int(11) NOT NULL,
  `used` int(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`code`),
  KEY `id` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-domains
-- ----------------------------
DROP TABLE IF EXISTS `staart-domains`;
CREATE TABLE `staart-domains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organizationId` int(11) NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `verificationCode` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `isVerified` int(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-emails
-- ----------------------------
DROP TABLE IF EXISTS `staart-emails`;
CREATE TABLE `staart-emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `userId` int(11) NOT NULL,
  `isVerified` int(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-events
-- ----------------------------
DROP TABLE IF EXISTS `staart-events`;
CREATE TABLE `staart-events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `organizationId` int(11) DEFAULT NULL,
  `type` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `data` text COLLATE utf8mb4_bin DEFAULT NULL,
  `ipAddress` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-memberships
-- ----------------------------
DROP TABLE IF EXISTS `staart-memberships`;
CREATE TABLE `staart-memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organizationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` varchar(10) COLLATE utf8mb4_bin NOT NULL DEFAULT 'member',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `org` (`organizationId`),
  KEY `user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-organizations
-- ----------------------------
DROP TABLE IF EXISTS `staart-organizations`;
CREATE TABLE `staart-organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `username` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `stripeCustomerId` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `ipRestrictions` text COLLATE utf8mb4_bin DEFAULT NULL,
  `forceTwoFactor` int(1) NOT NULL DEFAULT 0,
  `autoJoinDomain` int(1) NOT NULL DEFAULT 0,
  `onlyAllowDomain` int(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `profilePicture` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT 'https://unavatar.now.sh/fallback.png',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-sessions
-- ----------------------------
DROP TABLE IF EXISTS `staart-sessions`;
CREATE TABLE `staart-sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `jwtToken` text COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `ipAddress` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `userAgent` text COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-users
-- ----------------------------
DROP TABLE IF EXISTS `staart-users`;
CREATE TABLE `staart-users` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `nickname` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `primaryEmail` int(12) DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `twoFactorEnabled` int(1) NOT NULL DEFAULT 0,
  `twoFactorSecret` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `countryCode` varchar(2) COLLATE utf8mb4_bin DEFAULT 'us',
  `timezone` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT 'Europe/Amsterdam',
  `notificationEmails` int(1) NOT NULL DEFAULT 1,
  `preferredLanguage` varchar(5) COLLATE utf8mb4_bin NOT NULL DEFAULT 'en-us',
  `prefersReducedMotion` int(1) NOT NULL DEFAULT 0,
  `prefersColorSchemeDark` int(1) NOT NULL DEFAULT 0,
  `role` int(1) NOT NULL DEFAULT 1,
  `gender` varchar(1) COLLATE utf8mb4_bin NOT NULL DEFAULT 'x',
  `profilePicture` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ----------------------------
-- Table structure for staart-webhooks
-- ----------------------------
DROP TABLE IF EXISTS `staart-webhooks`;
CREATE TABLE `staart-webhooks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organizationId` int(11) NOT NULL,
  `event` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `url` text COLLATE utf8mb4_bin NOT NULL,
  `contentType` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `secret` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` int(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `lastFiredAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS = 1;
