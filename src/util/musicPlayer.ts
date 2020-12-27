import Discord from "discord.js";
import ytdl from "ytdl-core";
import yts from "yt-search";
import BetterEmbed from "./betterembed.js";
import { getAverageColor } from "fast-average-color-node";

class DiscordMusicPlayerQueueEntry {
    author: Discord.User;
    videoInfoPromise: Promise<ytdl.videoInfo>;

    constructor(
        author: Discord.User,
        videoInfoPromise: Promise<ytdl.videoInfo>
    ) {
        this.author = author;
        this.videoInfoPromise = videoInfoPromise;
    }
}

class DiscordMusicPlayer {
    private guild: Discord.Guild;

    private currentlyPlaying: DiscordMusicPlayerQueueEntry;
    private queue: Array<DiscordMusicPlayerQueueEntry>;

    private statusEmbed: Discord.MessageEmbed;
    private statusMessage: Discord.Message;

    private isPaused: boolean;
    private isLooping: boolean;

    constructor(guild: Discord.Guild) {
        this.guild = guild;

        this.currentlyPlaying = undefined;
        this.queue = new Array<DiscordMusicPlayerQueueEntry>();

        this.statusEmbed = new BetterEmbed()
            .setTitle("Playing")
            .setType("musik");
        this.statusMessage = undefined;

        this.isPaused = false;
        this.isLooping = false;
    }

    async join(message: Discord.Message) {
        this.statusMessage = await message.channel.send(this.statusEmbed);

        const connection = await message.member.voice.channel.join();

        connection.on("disconnect", async () => {
            await this.statusMessage.delete().catch(() => {});

            await DiscordMusicPlayerFactory.remove(this.guild);
        });
    }

    async leave() {
        this.guild.me.voice.connection.disconnect();
    }

    async play(entry: DiscordMusicPlayerQueueEntry) {
        this.currentlyPlaying = entry;

        const connection = this.guild.me.voice.connection;

        if (!connection) return; // if for some reason bot is disconnected mid process

        const videoInfo = await entry.videoInfoPromise;
        const videoDetails = videoInfo.videoDetails;

        const dispatcher = connection.play(
            ytdl(videoDetails.video_url, {
                quality: "highestaudio",
                filter: "audioonly",
                highWaterMark: 1 << 25,
            })
        );

        dispatcher.removeAllListeners("finish");
        dispatcher.on("finish", async () => {
            await this.next();
        });

        await this.updateStatusMessage();
    }

    async next() {
        if (this.isLooping) this.queue.push(this.currentlyPlaying);

        const next = this.queue.shift();

        if (next) {
            await this.play(next);
        } else {
            await this.leave();
        }
    }

    /** Broken for now, causes speedups and skipping */
    async resume() {
        if (!this.isPaused) return;

        this.guild.me.voice.connection.dispatcher.resume();
        this.isPaused = false;

        await this.updateStatusMessage();
    }

    /** Broken for now, causes speedups and skipping */
    async pause() {
        if (this.isPaused) return;

        this.guild.me.voice.connection.dispatcher.pause(true);
        this.isPaused = true;

        await this.updateStatusMessage();
    }

    async loop() {
        if (!this.currentlyPlaying) return;

        this.isLooping = !this.isLooping;

        await this.updateStatusMessage();
    }

    async queryToUrl(queryOrUrl: string) {
        if (ytdl.validateURL(queryOrUrl)) return queryOrUrl;

        const videos = (await yts.search(queryOrUrl)).videos;
        if (!videos.length) throw new Error("No videos found!");
        return videos[0].url;
    }

    async addToQueue(message: Discord.Message, queryOrUrl: string) {
        const url = await this.queryToUrl(queryOrUrl);

        const entry = new DiscordMusicPlayerQueueEntry(
            message.author,
            ytdl.getInfo(url)
        );

        if (!this.currentlyPlaying) {
            await this.join(message);
            await this.play(entry);
        } else {
            this.queue.push(entry);
            await this.updateStatusMessage();
        }
    }

    async updateStatusMessage() {
        await this.updateStatusEmbed();
        await this.statusMessage.edit(this.statusEmbed);
    }

    async updateStatusEmbed() {
        const videoInfo = await this.currentlyPlaying.videoInfoPromise;
        const videoDetails = videoInfo.videoDetails;

        const thumbnailURL = await this.getBestThumbnailURL(videoDetails);
        const averageColor = await getAverageColor(thumbnailURL);
        const averageColorHex = averageColor.hex;

        this.statusEmbed = new BetterEmbed(this.statusEmbed)
            .setAuthor(this.currentlyPlaying.author)
            .setTitle(
                `${this.isLooping ? "🔁 " : ""}${this.isPaused ? "⏸️ " : "▶ "}${
                    videoDetails.title
                }`
            )
            .setURL(videoDetails.video_url)
            .setThumbnail(thumbnailURL)
            .setColor(averageColorHex)
            .setDescription(
                (this.queue.length ? "**Queue:**\n" : "") +
                    (
                        await Promise.all(
                            this.queue.map(
                                async (entry) =>
                                    (await entry.videoInfoPromise).videoDetails
                                        .title
                            )
                        )
                    ).join("\n")
            );
    }

    async getBestThumbnailURL(videoDetails: ytdl.MoreVideoDetails) {
        const thumbnails = videoDetails.thumbnails;
        return thumbnails[thumbnails.length - 1].url;
    }
}

export default class DiscordMusicPlayerFactory {
    private static guildPlayers = new Map<Discord.Guild, DiscordMusicPlayer>();

    static async get(guild: Discord.Guild) {
        if (this.guildPlayers.has(guild)) {
            return this.guildPlayers.get(guild);
        }

        const player = new DiscordMusicPlayer(guild);
        this.guildPlayers.set(guild, player);

        return player;
    }

    static async remove(guild: Discord.Guild) {
        this.guildPlayers.delete(guild);
    }
}
