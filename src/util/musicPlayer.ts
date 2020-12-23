import Discord from "discord.js";
import ytdl from "ytdl-core";
import yts from "yt-search";
import BetterEmbed from "./betterembed.js";
import { getAverageColor } from "fast-average-color-node";

class DiscordMusicPlayerGuildData {
    public currentlyPlaying: Promise<ytdl.videoInfo>;
    public statusMessage: Discord.Message;
    public queueMessage: Discord.Message;
    public queue: Array<Promise<ytdl.videoInfo>>;
    public loop: boolean;

    constructor() {
        this.currentlyPlaying = undefined;
        this.statusMessage = undefined;
        this.queueMessage = undefined;
        this.queue = new Array<Promise<ytdl.videoInfo>>();
        this.loop = false;
    }
}

class DiscordMusicPlayer {
    private guilds: Map<Discord.Guild, DiscordMusicPlayerGuildData>;

    constructor() {
        this.guilds = new Map<Discord.Guild, DiscordMusicPlayerGuildData>();
    }

    async join(voiceChannel: Discord.VoiceChannel) {
        await voiceChannel.join();
    }

    async play(
        guild: Discord.Guild,
        queueEntryPromise: Promise<ytdl.videoInfo>
    ) {
        const guildData = await this.getGuildData(guild);

        guildData.currentlyPlaying = queueEntryPromise;

        const connection = guild.me.voice.connection;
        if (!connection) return; // if for some reason bot is disconnected mid process

        const queueEntry = await queueEntryPromise;
        const queueEntryDetails = queueEntry.videoDetails;

        const stream = ytdl(queueEntryDetails.video_url, {
            quality: "highestaudio",
            filter: "audioonly",
            highWaterMark: 1 << 25,
        });

        const dispatcher = connection.play(stream);

        const thumbnailURL = await this.getBestThumbnailURL(queueEntryDetails);
        const averageColor = (await getAverageColor(thumbnailURL)).hex;

        await guildData.statusMessage.edit(
            new Discord.MessageEmbed(guildData.statusMessage.embeds[0])
                .setDescription(
                    `[${queueEntryDetails.title}](${queueEntryDetails.video_url})`
                )
                .setThumbnail(thumbnailURL)
                .setColor(averageColor)
        );

        dispatcher.removeAllListeners();
        connection.removeAllListeners();

        dispatcher.once("finish", async () => {
            stream.destroy();
            await this.next(guild);
        });

        connection.once("disconnect", async () => {
            const guildData = this.guilds.get(guild);

            guildData.statusMessage.delete().catch(() => {});

            this.guilds.delete(guild);
        });
    }

    async next(guild: Discord.Guild) {
        const guildData = this.guilds.get(guild);

        if (guildData.loop) {
            guildData.queue.push(guildData.currentlyPlaying);
        }

        const next = guildData.queue.shift();

        if (next) {
            await this.play(guild, next);
            await this.updateStatusMessageQueue(guild);
        } else {
            await this.leave(guild);
        }
    }

    async leave(guild: Discord.Guild) {
        guild.me.voice.connection.disconnect();
    }

    /** Broken for now, causes speedups and skipping */
    async resume(guild: Discord.Guild) {
        guild.me.voice.connection.dispatcher.resume();
    }

    /** Broken for now, causes speedups and skipping */
    async pause(guild: Discord.Guild) {
        guild.me.voice.connection.dispatcher.pause(true);
    }

    async loop(guild: Discord.Guild) {
        const guildData = await this.getGuildData(guild);

        if (!guildData.currentlyPlaying) return;

        guildData.loop = !guildData.loop;

        await guildData.statusMessage.edit(
            new BetterEmbed(guildData.statusMessage.embeds[0]).setTitle(
                `Playing${guildData.loop ? " 🔁" : ""}`
            )
        );
    }

    async updateStatusMessageQueue(guild: Discord.Guild) {
        const guildData = await this.getGuildData(guild);

        const embed = new BetterEmbed(guildData.statusMessage.embeds[0]);

        if (guildData.queue.length) {
            const queue = new Array<string>();

            for (const [i, queueEntryPromise] of guildData.queue.entries()) {
                if (i >= 10) break;

                const queueEntry = await queueEntryPromise;
                const queueEntryDetails = queueEntry.videoDetails;

                queue.push(queueEntryDetails.title);
            }

            embed.fields = [
                {
                    name: "Queue",
                    value: queue.join("\n"),
                    inline: false,
                },
            ];
        } else {
            embed.fields = [];
        }

        await guildData.statusMessage.edit(embed);
    }

    async addToQueue(message: Discord.Message, queryOrUrl: string) {
        const guildData = await this.getGuildData(message.guild);

        if (!guildData.statusMessage) {
            guildData.statusMessage = await message.channel.send(
                new BetterEmbed()
                    .setAuthor(message.author)
                    .setTitle("Playing")
                    .setType("musik")
            );

            await this.join(message.member.voice.channel);
        }

        let url: string;
        if (!ytdl.validateURL(queryOrUrl)) {
            const videos = (await yts.search(queryOrUrl)).videos;

            if (!videos.length) return;

            url = videos[0].url;
        } else {
            url = queryOrUrl;
        }

        const queueEntryPromise = ytdl.getInfo(url);

        if (!guildData.currentlyPlaying) {
            await this.play(message.guild, queueEntryPromise);
        } else {
            guildData.queue.push(queueEntryPromise);
        }

        await this.updateStatusMessageQueue(message.guild);
    }

    async getGuildData(guild: Discord.Guild) {
        if (!this.guilds.has(guild)) {
            this.guilds.set(guild, new DiscordMusicPlayerGuildData());
        }

        return this.guilds.get(guild);
    }

    async getBestThumbnailURL(queueEntryDetails: ytdl.MoreVideoDetails) {
        const thumbnails = queueEntryDetails.thumbnails;
        return thumbnails[thumbnails.length - 1].url;
    }
}

export default new DiscordMusicPlayer();
