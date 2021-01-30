import Discord from "discord.js";
import ytdl from "ytdl-core";
import yts from "yt-search";
import BetterEmbed from "./betterEmbed.js";
import { getAverageColor } from "fast-average-color-node";

class DiscordMusicPlayerQueueEntry {
  author: Discord.User;
  videoInfoPromise: Promise<ytdl.videoInfo>;

  constructor(author: Discord.User, videoInfoPromise: Promise<ytdl.videoInfo>) {
    this.author = author;
    this.videoInfoPromise = videoInfoPromise;
  }
}

class DiscordMusicPlayer {
  private readonly guild: Discord.Guild;

  private currentlyPlaying: DiscordMusicPlayerQueueEntry;
  private queue: Array<DiscordMusicPlayerQueueEntry>;

  private statusEmbed: BetterEmbed;
  private statusMessage: Discord.Message;

  private isPaused: boolean;
  private isLooping: boolean;

  constructor(guild: Discord.Guild) {
    this.guild = guild;

    this.currentlyPlaying = undefined;
    this.queue = new Array<DiscordMusicPlayerQueueEntry>();

    this.statusEmbed = new BetterEmbed();
    this.statusMessage = undefined;

    this.isPaused = false;
    this.isLooping = false;
  }

  async join(voiceChannel: Discord.VoiceChannel) {
    const connection = await voiceChannel.join();

    connection.on("disconnect", async () => {
      await this.statusMessage.edit(
        this.statusEmbed.setAuthor(null).setType("recyclable")
      );

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
    if (!videos.length) return null;
    return videos[0].url;
  }

  async addToQueue(message: Discord.Message, queryOrUrl: string) {
    const url = await this.queryToUrl(queryOrUrl);

    if (!url) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("No videos found!")
          .setType("recyclable")
      );
      return;
    }

    const entry = new DiscordMusicPlayerQueueEntry(
      message.author,
      ytdl.getInfo(url)
    );

    if (!this.currentlyPlaying) {
      this.statusMessage = await message.channel.send(this.statusEmbed);

      await this.join(message.member.voice.channel);
      await this.play(entry);
    } else {
      this.queue.push(entry);
      await this.updateStatusMessage();
    }
  }

  async removeFromQueue(message: Discord.Message, index: number) {
    if (index > this.queue.length || index < 0) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Invalid queue index!")
          .setType("recyclable")
      );
      return;
    }

    const queueEntry = this.queue[index];

    if (
      message.author !== queueEntry.author &&
      !message.member.hasPermission("ADMINISTRATOR")
    ) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("You cannot remove this queue entry!")
          .setType("recyclable")
      );
      return;
    }

    this.queue.splice(index, 1);

    await this.updateStatusMessage();
  }

  async updateStatusMessage() {
    await this.updateStatusEmbed();

    const oldEmbed = this.statusMessage.embeds[0];
    const newEmbed = this.statusEmbed;

    if (
      oldEmbed.title === newEmbed.title &&
      (oldEmbed.description || "") === newEmbed.description &&
      oldEmbed.author.name === newEmbed.author.name &&
      oldEmbed.author.url === newEmbed.author.url &&
      oldEmbed.author.iconURL === newEmbed.author.iconURL
    )
      return;
    await this.statusMessage.edit(this.statusEmbed);
  }

  private async updateStatusEmbed() {
    const videoInfo = await this.currentlyPlaying.videoInfoPromise;
    const videoDetails = videoInfo.videoDetails;

    // Need to have this stupid logic because youtube started
    // using RIFF, which is not supported by NodeJS canvas.
    let averageColorHex: string;
    const worstThumbnailURL = await this.getWorstThumbnailURL(videoDetails);
    const split = worstThumbnailURL.split("?");
    if (split.length >= 2) {
      const fixedURL = split.slice(0, split.length - 1).join("");
      const averageColor = await getAverageColor(fixedURL);
      averageColorHex = averageColor.hex;
    } else {
      averageColorHex = "#FF0000";
    }

    const description =
      (this.queue.length ? "**Queue:**\n" : "") +
      (
        await Promise.all(
          this.queue.map(
            async (entry, index) =>
              `**${index + 1}.** ${
                (await entry.videoInfoPromise).videoDetails.title
              }`
          )
        )
      ).join("\n");

    this.statusEmbed = new BetterEmbed(this.statusEmbed)
      .setAuthor(this.currentlyPlaying.author)
      .setTitle(
        `${this.isLooping ? "🔁 " : ""}${this.isPaused ? "⏸️ " : "▶ "}${
          videoDetails.title
        }`
      )
      .setURL(videoDetails.video_url)
      .setThumbnail(await this.getBestThumbnailURL(videoDetails))
      .setColor(averageColorHex)
      .setDescription(
        description.length <= 2048
          ? description
          : description.slice(0, 2045) + "..."
      )
      .setType("music");
  }

  async getBestThumbnailURL(videoDetails: ytdl.MoreVideoDetails) {
    const thumbnails = videoDetails.thumbnails;
    return thumbnails[thumbnails.length - 1].url;
  }

  async getWorstThumbnailURL(videoDetails: ytdl.MoreVideoDetails) {
    const thumbnails = videoDetails.thumbnails;
    return thumbnails[0].url;
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
