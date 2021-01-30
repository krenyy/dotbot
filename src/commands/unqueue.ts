import Discord from "discord.js";
import BetterEmbed from "../util/betterEmbed.js";
import DiscordCommand from "./base.js";
import DiscordMusicPlayerFactory from "../util/musicPlayer.js";

export default class UnqueueCommand implements DiscordCommand {
  public static readonly id = "unqueue";
  public static readonly type = "USER";
  public static readonly description =
    "Removes an entry from music player queue.";
  public static readonly helpText = "<queue index>";

  static async execute(message: Discord.Message, args: Array<string>) {
    const botIsInVoiceChannel = !!message.guild.me.voice.channel;
    const userInBotVoiceChannel =
      message.member.voice.channel === message.guild.me.voice.channel;

    if (!botIsInVoiceChannel) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Bot is currently not playing!")
          .setType("recyclable")
      );
      return;
    }

    if (botIsInVoiceChannel && !userInBotVoiceChannel) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("You're not connected to the same voice channel as bot!")
          .setType("recyclable")
      );
      return;
    }

    if (!message.member.voice.channel) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("You're not connected to a voice channel!")
          .setType("recyclable")
      );
      return;
    }

    if (args.length > 1 || args.length < 0) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Invalid amount of arguments! (expected 1)")
          .setType("recyclable")
      );
      return;
    }

    const index = Number(args[0]);
    if (Number.isNaN(index)) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Argument is not a number!")
          .setType("recyclable")
      );
      return;
    }

    if (!Number.isInteger(index)) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Argument is not an integer!")
          .setType("recyclable")
      );
      return;
    }

    const player = await DiscordMusicPlayerFactory.get(message.guild);
    await player.removeFromQueue(message, index - 1);
  }
}
