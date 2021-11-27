CREATE TABLE `automator`.`crawlers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `url` varchar(200) NOT NULL,
  `configChain` longtext,
  `status` enum('Not Configured', 'Configured', 'In Progress', 'Completed', 'Failed') default 'Not Configured',
  `lastRun` datetime,
  `isActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
);

CREATE TABLE `webhooks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `crawlerId` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `url` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
);



SELECT * FROM automator.crawlers;

desc automator.crawlers;