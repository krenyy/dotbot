import Discord from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import client from "../../index.js";

export default class TempChannelHandler {
  public static readonly factoryPrefix = "➕ ";
  public static readonly tempCategoryPrefix = "⚠ ";

  static async create(state: Discord.VoiceState) {
    if (!state.channel.name.startsWith(this.factoryPrefix)) {
      return;
    }

    const tempChannelName = state.channel.name.slice(this.factoryPrefix.length);

    state.guild.channels.create;
    const categoryChannel = await state.guild.channels.create(
      `${this.tempCategoryPrefix}${tempChannelName}`,
      {
        type: ChannelTypes.GUILD_CATEGORY,
      }
    );

    const textChannel = await state.guild.channels.create(tempChannelName, {
      parent: categoryChannel,
      type: ChannelTypes.GUILD_TEXT,
    });
    const voiceChannel = await state.guild.channels.create(tempChannelName, {
      parent: categoryChannel,
      type: ChannelTypes.GUILD_VOICE,
    });

    await state.setChannel(voiceChannel);
  }

  static async tryCleanup(state: Discord.VoiceState) {
    const category = state.channel.parent;

    if (!category) {
      return;
    }

    if (!category.name.startsWith(this.tempCategoryPrefix)) {
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
          channel.type === "GUILD_CATEGORY" &&
          channel.name.startsWith(this.tempCategoryPrefix) &&
          !(channel as Discord.CategoryChannel).children
            .find((child) => child.type === "GUILD_VOICE")
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
