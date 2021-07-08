import Discord from 'discord.js';
import { Readable } from 'stream';
import DiscordMusicPlayerFactory from '../musicPlayer/factory.js';
import SlashCommand from './base.js';

export default class QueueCommand implements SlashCommand {
  public static readonly data: Discord.ApplicationCommandData = {
    name: 'queue',
    description: 'Show current music player queue',
  };

  static async execute(interaction: Discord.CommandInteraction) {
    // For now, ephemeral messages don't support attachments
    await interaction.defer({ ephemeral: false });

    const botIsInVoiceChannel = !!interaction.guild.me.voice.channel;

    if (!botIsInVoiceChannel) {
      await interaction.editReply({
        content: "Bot isn't playing at the moment!",
      });
      return;
    }

    // -----

    const player = await DiscordMusicPlayerFactory.get(interaction.guild);

    const formattedQueue = player.queue.getFormatted();

    interaction.editReply({
      files: [
        new Discord.MessageAttachment(
          Readable.from(formattedQueue),
          'queue.txt'
        ),
      ],
      components: [
        [
          new Discord.MessageButton({
            customId: 'delete',
            label: 'Delete',
            style: 'DANGER',
          }),
        ],
      ],
    });
  }
}
