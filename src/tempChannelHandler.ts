import Discord from "discord.js";
import client from "./index.js";

export default class TempChannelHandler {
    public static readonly prefix = "-=TEMP=-";

    static async create(state: Discord.VoiceState) {
        const tempChannelsName = state.channel.name.slice(2);

        const categoryChannel = await state.guild.channels.create(
            `${this.prefix} ${tempChannelsName}`,
            {
                type: "category",
            }
        );

        const textChannel = await state.guild.channels.create(
            tempChannelsName,
            { parent: categoryChannel, type: "text" }
        );
        const voiceChannel = await state.guild.channels.create(
            tempChannelsName,
            { parent: categoryChannel, type: "voice" }
        );

        await state.setChannel(voiceChannel);
    }

    static async tryCleanup(state: Discord.VoiceState) {
        const category = state.channel.parent;

        if (!category) {
            return;
        }

        if (!category.name.startsWith(this.prefix)) {
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
                    channel.name.startsWith(this.prefix) &&
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
