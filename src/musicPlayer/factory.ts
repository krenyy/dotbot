import Discord from "discord.js";
import DiscordMusicPlayer from "./player.js";

export default class DiscordMusicPlayerFactory {
  private static guildPlayers = new Map<`${bigint}`, DiscordMusicPlayer>();

  static async get(guild: Discord.Guild) {
    if (this.guildPlayers.has(guild.id)) {
      return this.guildPlayers.get(guild.id);
    }

    const player = new DiscordMusicPlayer(guild);
    this.guildPlayers.set(guild.id, player);

    return player;
  }

  static async remove(guild: Discord.Guild) {
    this.guildPlayers.delete(guild.id);
  }
}
