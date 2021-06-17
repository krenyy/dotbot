import Discord from 'discord.js';
import DiscordMusicPlayerFactory from '../musicPlayer/factory.js';
import SpotifyTrackProvider from '../musicPlayer/providers/spotify.js';
import YoutubeTrackProvider from '../musicPlayer/providers/youtube.js';
import { DiscordMusicPlayerTrackData } from '../musicPlayer/queue.js';
import SlashCommand from './base.js';

export default class PlayCommand implements SlashCommand {
  public static readonly data: Discord.ApplicationCommandData = {
    name: 'play',
    description: 'Play a song!',
    options: [
      {
        name: 'query',
        description: 'YouTube URL or search query',
        type: 'STRING',
        required: true,
      },
    ],
  };

  static async execute(interaction: Discord.CommandInteraction) {
    const member = interaction.member as Discord.GuildMember;

    const botIsInVoiceChannel = !!interaction.guild.me.voice.channel;
    const userInBotVoiceChannel =
      member.voice.channel === interaction.guild.me.voice.channel;

    if (botIsInVoiceChannel && !userInBotVoiceChannel) {
      await interaction.reply({
        content: "You're not connected to the same voice channel as bot!",
        ephemeral: true,
      });
      return;
    }

    if (!member.voice.channel) {
      await interaction.reply({
        content: "You're not connected to a voice channel!",
        ephemeral: true,
      });
      return;
    }

    // -----

    const player = await DiscordMusicPlayerFactory.get(interaction.guild);

    await interaction.defer({ ephemeral: true });

    const query = interaction.options.get('query').value as string;

    let tracks: DiscordMusicPlayerTrackData[] = [];
    try {
      tracks =
        query.startsWith('https://open.spotify.com/') ||
        query.startsWith('https://play.spotify.com/')
          ? await SpotifyTrackProvider.get(query)
          : await YoutubeTrackProvider.get(query);
    } catch (e) {
      interaction.editReply({ content: `${e}` });
      return;
    }

    if (!tracks.length) {
      await interaction.editReply({ content: 'No videos found!' });
      return;
    }

    for (const track of tracks) {
      player.queue.add({
        requestedBy: interaction.user.id,
        trackData: track,
      });
    }

    if (player.queue.length() - tracks.length > 0) {
      await interaction.editReply({ content: 'Added to queue!' });
      await player.updateStatusMessage();
      return;
    }

    player.message = await interaction.channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setDescription('Preparing music for your ears...')
          .setColor('black'),
      ],
    });

    await interaction.editReply({ content: 'Added to queue!' });

    await player.join(
      (interaction.member as Discord.GuildMember).voice
        .channel as Discord.VoiceChannel
    );
    await player.play(player.queue.at(0));
  }
}
