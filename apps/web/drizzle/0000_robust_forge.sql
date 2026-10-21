CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` text NOT NULL,
	`authorId` text NOT NULL,
	`text` text NOT NULL,
	`parentId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authorId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_post` ON `comments` (`postId`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`userId` text NOT NULL,
	`postId` text NOT NULL,
	PRIMARY KEY(`userId`, `postId`),
	FOREIGN KEY (`userId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`userId` text NOT NULL,
	`authorId` text NOT NULL,
	PRIMARY KEY(`userId`, `authorId`),
	FOREIGN KEY (`userId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`userId` text NOT NULL,
	`postId` text NOT NULL,
	PRIMARY KEY(`userId`, `postId`),
	FOREIGN KEY (`userId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`authorId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`images` text NOT NULL,
	`ingredients` text NOT NULL,
	`steps` text NOT NULL,
	`servings` text DEFAULT '' NOT NULL,
	`tag` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posts_created` ON `posts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `posts_author` ON `posts` (`authorId`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`key` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
