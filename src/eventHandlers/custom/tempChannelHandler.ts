import Discord from "discord.js";
import client from "../../index.js";

export default class TempChannelHandler {
  public static readonly factoryPrefix = "➕ ";
  public static readonly tempChannelPrefix = "⚠️ ";

  static async create(state: Discord.VoiceState) {
    const tempChannelName = state.channel.name.slice(2);

    const categoryChannel = await state.guild.channels.create(
      `${this.tempChannelPrefix} ${tempChannelName}`,
      {
        type: "category",
      }
    );

    const textChannel = await state.guild.channels.create(tempChannelName, {
      parent: categoryChannel,
      type: "text",
    });
    const voiceChannel = await state.guild.channels.create(tempChannelName, {
      parent: categoryChannel,
      type: "voice",
    });

    await state.setChannel(voiceChannel);
  }

  static async tryCleanup(state: Discord.VoiceState) {
    const category = state.channel.parent;

    if (!category) {
      return;
    }

    if (!category.name.startsWith(this.tempChannelPrefix)) {
      return;
    }

    if (state.channel.members.filter((member) => !member.user.bot).size) {
      return;
    }

    if (state.member.user.bot) {
      return;
    }

    for (const [, channel] of category.children) {
      await channel.delete();
    }

    await category.delete();
  }

  static async initialCleanup() {
    for (const [, guild] of client.guilds.cache) {
      for (const [, category] of guild.channels.cache.filter(
        (channel) =>
          channel.type === "category" &&
          channel.name.startsWith(this.tempChannelPrefix) &&
          !(channel as Discord.CategoryChannel).children
            .find((child) => child.type === "voice")
            .members.filter((member) => !member.user.bot).size
      )) {
        for (const [, channel] of (category as Discord.CategoryChannel)
          .children) {
          await channel.delete();
        }

        await category.delete();
      }
    }
  }
}
