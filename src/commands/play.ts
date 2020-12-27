import Discord from "discord.js";
import BetterEmbed from "../util/betterembed.js";
import DiscordCommand from "./base.js";
import DiscordMusicPlayerFactory from "../util/musicPlayer.js";

export default class PlayCommand implements DiscordCommand {
  public static readonly id = "play";
  public static readonly description = "Plays a video from Youtube.";

  static async execute(message: Discord.Message, args: Array<string>) {
    const botIsInVoiceChannel = !!message.guild.me.voice.channel;
    const userInBotVoiceChannel =
      message.member.voice.channel === message.guild.me.voice.channel;

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

    if (!args.length) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("No URL or search query provided!")
          .setType("recyclable")
      );
      return;
    }

    const player = await DiscordMusicPlayerFactory.get(message.guild);
    await player.addToQueue(message, args.join(" "));
  }
}
