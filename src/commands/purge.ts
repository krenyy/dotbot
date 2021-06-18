import Discord from 'discord.js';
import SlashCommand from './base.js';

export default class PurgeCommand implements SlashCommand {
  public static readonly data: Discord.ApplicationCommandData = {
    name: 'purge',
    description: 'Purges 100 (max) messages from current text channel',
  };

  static async execute(interaction: Discord.CommandInteraction) {
    await interaction.defer({ ephemeral: true });

    const messagesToDelete = (
      await interaction.channel.messages.fetch({
        limit: 100,
      })
    ) /** Filters out all messages older than 14 days,
          older messages are not allowed to be deleted */
      .filter((m) => m.createdTimestamp > Date.now() - 14 * 24 * 60 * 60 * 1000)
      /** Filters out bot messages */
      .filter((m) => m.author !== m.client.user);

    if (!messagesToDelete.size) {
      await interaction.editReply({
        content: 'No messages to remove!',
      });
      return;
    }

    const deletedMessages = await (
      interaction.channel as Discord.TextChannel
    ).bulkDelete(messagesToDelete, true);

    await interaction.editReply({
      content: `Purged ${deletedMessages.size} messages!`,
    });
  }
}
