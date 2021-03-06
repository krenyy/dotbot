import Discord from "discord.js";
import BetterEmbed from "../util/betterEmbed.js";
import DiscordCommand from "./base.js";

export default class PurgeCommand implements DiscordCommand {
  public static readonly id = "purge";
  public static readonly type = "ADMIN";
  public static readonly description =
    "Purges 100 text messages from current channel.";
  public static readonly helpText = "";

  static async execute(message: Discord.Message, args: Array<string>) {
    const messagesToDelete = (
      await message.channel.messages.fetch({
        limit: 100,
      })
    ) /** Filters out all messages older than 14 days */
      .filter((m) => m.createdTimestamp > Date.now() - 14 * 24 * 60 * 60 * 1000)
      /** Filters out bot messages */
      .filter((m) => m.author !== m.client.user);

    if (!messagesToDelete.size) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("No messages to remove!")
          .setType("recyclable")
      );
      return;
    }

    const deletedMessages = await (message.channel as Discord.TextChannel).bulkDelete(
      messagesToDelete,
      true
    );

    await message.channel.send(
      new BetterEmbed()
        .setAuthor(message.author)
        .setSuccess(`Removed ${deletedMessages.size} messages!`)
        .setType("recyclable")
    );
  }
}
