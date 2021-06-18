import Discord from 'discord.js';
import SlashCommand from './base.js';
import DiscordMusicPlayerFactory from '../musicPlayer/factory.js';

export default class UnqueueCommand implements SlashCommand {
  public static readonly data: Discord.ApplicationCommandData = {
    name: 'remove',
    description: 'Remove entry from music player queue',
    options: [
      {
        name: 'index',
        description: 'Index of the entry to remove',
        type: 'INTEGER',
        required: true,
      },
    ],
  };

  static async execute(interaction: Discord.CommandInteraction) {
    await interaction.defer({ ephemeral: true });

    const member = interaction.member as Discord.GuildMember;

    const botIsInVoiceChannel = !!interaction.guild.me.voice.channel;
    const userInBotVoiceChannel =
      member.voice.channel === interaction.guild.me.voice.channel;

    if (!botIsInVoiceChannel) {
      await interaction.editReply({
        content: 'Bot is currently not playing!',
      });
      return;
    }

    if (botIsInVoiceChannel && !userInBotVoiceChannel) {
      await interaction.editReply({
        content: "You're not connected to the same voice channel as bot!",
      });
      return;
    }

    if (!member.voice.channel) {
      await interaction.editReply({
        content: "You're not connected to a voice channel!",
      });
      return;
    }

    // -----

    const player = await DiscordMusicPlayerFactory.get(interaction.guild);

    const fakeIndex = interaction.options.get('index').value as number;
    const index = fakeIndex - 1;

    if (index >= player.queue.length() || index < 0) {
      interaction.editReply({ content: 'Invalid queue index!' });
      return;
    }

    if (index === player.queue.position()) {
      interaction.editReply({
        content: 'Cannot remove current entry!',
      });
      return;
    }

    const entry = player.queue.at(index);

    if (
      interaction.user.id !== entry.requestedBy &&
      !(interaction.member.permissions as Readonly<Discord.Permissions>).has(
        'ADMINISTRATOR'
      )
    ) {
      await interaction.editReply({
        content: 'You cannot remove this queue entry!',
      });
      return;
    }

    const title = entry.trackData.title;

    player.queue.remove(index);

    await interaction.editReply({
      content: `'${title}' removed from queue!`,
    });

    await player.updateStatusMessage();
  }
}
