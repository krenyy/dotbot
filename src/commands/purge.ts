import { Command } from "../commandHandler.js";
import Discord from "discord.js";

export default class PurgeCommand implements Command {
    public static readonly cmd = "purge";

    public static readonly description =
        "Purges 100 text messages from current channel.";

    static async execute(message: Discord.Message, args: Array<string>) {
        let messagesToDelete = await message.channel.messages.fetch({
            limit: 100,
        });

        if (!messagesToDelete.size) {
            await (
                await message.channel.send(
                    new Discord.MessageEmbed()
                        .default(message.author)
                        .setTitle("Error")
                        .setDescription("No messages to remove!")
                )
            ).registerRecyclable();
            return;
        }

        const embedAsk = new Discord.MessageEmbed()
            .default(message.author)
            .setTitle(
                `Delete${message.channel.type === "dm" ? " DM" : ""} messages?`
            )
            .setDescription(
                `This will remove ${messagesToDelete.size}${
                    message.channel.type === "dm" ? " bot" : ""
                } messages.\n` + "Continue?"
            );

        const msg = await message.channel.send(embedAsk);

        await msg.registerReactionButton("☑", async (messageReaction, user) => {
            const deletedMessages = await (messageReaction.message
                .channel as Discord.TextChannel).bulkDelete(
                (
                    await messageReaction.message.channel.messages.fetch({
                        limit: 100,
                    })
                ).filter(
                    (m) =>
                        m.id !== messageReaction.message.id &&
                        m.createdTimestamp <=
                            messageReaction.message.createdTimestamp
                )
            );

            const embedSuccess = new Discord.MessageEmbed()
                .default(messageReaction.message.author)
                .setTitle("Success")
                .setDescription(`Removed ${deletedMessages.size} messages!`);

            await messageReaction.message.unregisterReactionButtons();
            await messageReaction.message.edit(embedSuccess);
            await messageReaction.message.registerRecyclable();
        });
        await msg.registerRecyclable("❌");
    }
}
