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
    const botIsInVoiceChannel = !!interaction.guild.me.voice.channel;

    if (!botIsInVoiceChannel) {
      await interaction.reply({
        content: "Bot isn't playing at the moment!",
        ephemeral: true,
      });
      return;
    }

    // -----

    const player = await DiscordMusicPlayerFactory.get(interaction.guild);

    await interaction.defer({ ephemeral: true });

    const formattedQueue = player.queue.getFormatted();

    interaction.editReply({
      content: 'Queue:\n```' + formattedQueue + '```',
      // WAIT FOR ATTACHMENT SUPPORT IN EPHEMERAL MESSAGES
      // files: [
      //   new Discord.MessageAttachment(
      //     Readable.from(formattedQueue),
      //     'queue.txt'
      //   ),
      // ],
    });
  }
}
