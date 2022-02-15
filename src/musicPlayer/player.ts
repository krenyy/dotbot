import * as DiscordVoice from "@discordjs/voice";
import Discord from "discord.js";
import { Readable } from "stream";
import ytdl from "ytdl-core";

import DiscordMusicPlayerFactory from "./factory.js";
import { DiscordMusicPlayerQueue, DiscordMusicPlayerTrack } from "./queue.js";

export default class DiscordMusicPlayer {
  private readonly guild: Discord.Guild;
  public readonly queue: DiscordMusicPlayerQueue;

  private subscription: DiscordVoice.PlayerSubscription;
  public message: Discord.Message;

  public paused: boolean;

  public get looping() {
    return this.queue.looping;
  }

  public set looping(looping: boolean) {
    this.queue.looping = looping;
  }

  constructor(guild: Discord.Guild) {
    this.guild = guild;
    this.queue = new DiscordMusicPlayerQueue();

    this.subscription = null;
    this.message = null;

    this.paused = false;
  }

  async play(entry: DiscordMusicPlayerTrack) {
    const stream = ytdl(entry.trackData.url, { quality: "lowestaudio" });
    this.subscription.player.play(DiscordVoice.createAudioResource(stream));

    await this.updateStatusMessage();
  }

  async next() {
    const entry = this.queue.next();

    if (!entry) {
      this.queue.previous();
      await this.leave();
      return;
    }

    await this.play(entry);
  }

  async previous() {
    const entry = this.queue.previous();

    if (!entry) {
      await this.leave();
      return;
    }

    await this.play(entry);
  }

  async loop() {
    this.looping = !this.looping;

    await this.updateStatusMessage();
  }

  async pause() {
    if (this.paused) return;

    this.subscription.player.pause(true);
    this.paused = true;

    await this.updateStatusMessage();
  }

  async resume() {
    if (!this.paused) return;

    this.subscription.player.unpause();
    this.paused = false;

    await this.updateStatusMessage();
  }

  async join(voiceChannel: Discord.VoiceChannel) {
    const connection = DiscordVoice.joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild
        .voiceAdapterCreator as unknown as DiscordVoice.DiscordGatewayAdapterCreator,
    });
    const audioPlayer = DiscordVoice.createAudioPlayer();

    connection.on("stateChange", async (oldState, newState) => {
      if (newState.status === DiscordVoice.VoiceConnectionStatus.Disconnected) {
        await this.leave();
      }
    });

    audioPlayer.on("stateChange", async (oldState, newState) => {
      if (
        newState.status === DiscordVoice.AudioPlayerStatus.Idle &&
        oldState.status !== DiscordVoice.AudioPlayerStatus.Idle
      ) {
        await this.next();
      }
    });

    audioPlayer.on("error", console.error);

    this.subscription = connection.subscribe(audioPlayer);
  }

  async leave() {
    const date = new Date();
    const dateTimeString = [
      date.getFullYear().toString().padStart(4, "0"),
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getDate().toString().padStart(2, "0"),
      date.getHours().toString().padStart(2, "0"),
      date.getMinutes().toString().padStart(2, "0"),
      date.getSeconds().toString().padStart(2, "0"),
    ].join("-");

    await this.message.edit({
      embeds: [],
      attachments: [],
      files: [
        new Discord.MessageAttachment(
          Readable.from(JSON.stringify(this.queue)),
          `queue-${dateTimeString}.saved`
        ),
        new Discord.MessageAttachment(
          Readable.from(this.queue.getFormatted()),
          "queue.txt"
        ),
      ],
      components: [
        new Discord.MessageActionRow({
          components: [
            new Discord.MessageButton({
              customId: "music_player_revive",
              label: "Play",
              style: "PRIMARY",
            }),
            new Discord.MessageButton({
              customId: "delete",
              label: "Delete",
              style: "DANGER",
            }),
          ],
        }),
      ],
    });

    await DiscordMusicPlayerFactory.remove(this.guild);
    this.subscription.unsubscribe();

    // Don't try to destroy a non-existing connection
    if (
      this.subscription.connection.state.status !==
      DiscordVoice.VoiceConnectionStatus.Disconnected
    )
      this.subscription.connection.destroy();
  }

  async updateStatusMessage() {
    const current = this.queue.current();
    const author = this.guild.client.users.resolve(current.requestedBy);

    const embed = new Discord.MessageEmbed()
      .setAuthor({ name: author.username, iconURL: author.avatarURL() })
      .setTitle(current.trackData.title)
      .setDescription("")
      .addField("Status", this.paused ? "Paused" : "Playing", true)
      .addField("Looping", this.looping ? "Yes" : "No", true)
      .setURL(current.trackData.url)
      .setThumbnail(current.trackData.thumbnailURL)
      .setColor("BLURPLE");

    if (this.queue.length() > 1) {
      let description = "";

      const previous = this.queue.previous(true);
      const next = this.queue.next(true);

      if (previous) {
        const title = previous.trackData.title;

        description += `${
          this.queue.position() !== 0
            ? this.queue.position()
            : this.queue.length()
        }. ${title}\n`;
      }

      const title = current.trackData.title;
      description += `**${this.queue.position() + 1}. ${title}**\n`;

      if (next) {
        const title = next.trackData.title;

        description += `${
          this.queue.position() + 1 !== this.queue.length()
            ? this.queue.position() + 2
            : 1
        }. ${title}\n`;
      }

      embed.setDescription(description);
    }

    const buttons = [
      new Discord.MessageButton({
        style: "SECONDARY",
        customId: "music_player_loop",
        label: "Loop",
      }),
      new Discord.MessageButton({
        style: "SECONDARY",
        customId: "music_player_pause",
        label: "Pause",
      }),
      new Discord.MessageButton({
        style: "DANGER",
        customId: "music_player_stop",
        label: "Stop",
      }),
      new Discord.MessageButton({
        style: "PRIMARY",
        customId: "music_player_previous",
        label: "Previous",
      }),
      new Discord.MessageButton({
        style: "PRIMARY",
        customId: "music_player_next",
        label: "Next",
      }),
    ];

    // Pause / resume button
    buttons[1]
      .setCustomId(`music_player_${this.paused ? "resume" : "pause"}`)
      .setLabel(this.paused ? "Resume" : "Pause");

    if (!this.looping) {
      if (this.queue.isAtStart()) buttons[3].setDisabled(true);
      if (this.queue.isAtEnd()) buttons[4].setDisabled(true);
    }

    await this.message.edit({
      embeds: [embed],
      components: [new Discord.MessageActionRow({ components: buttons })],
    });
  }
}
