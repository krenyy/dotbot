import axios from 'axios';
import Discord from 'discord.js';
import DiscordMusicPlayerFactory from '../../musicPlayer/factory.js';

type InteractionCallback = (
  interaction: Discord.MessageComponentInteraction
) => Promise<void>;

export default class InteractionMessageComponentHandler {
  static readonly interaction_handlers: Map<string, InteractionCallback> =
    new Map<string, InteractionCallback>()
      .set('delete', async (interaction) => {
        await (interaction.message as Discord.Message).delete();
        await interaction.reply({ content: 'Deleted!', ephemeral: true });
      })
      .set('music_player_previous', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.previous();
        await interaction.reply({ content: 'Backtracked!', ephemeral: true });
      })
      .set('music_player_next', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.next();
        await interaction.reply({ content: 'Skipped!', ephemeral: true });
      })
      .set('music_player_resume', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.resume();
        await interaction.reply({ content: 'Resumed!', ephemeral: true });
      })
      .set('music_player_pause', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.pause();
        await interaction.reply({ content: 'Paused!', ephemeral: true });
      })
      .set('music_player_stop', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.leave();
        await interaction.reply({ content: 'Stopped!', ephemeral: true });
      })
      .set('music_player_loop', async (interaction) => {
        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.loop();
        await interaction.reply({
          content: `${musicPlayer.looping ? 'En' : 'Dis'}abled looping!`,
          ephemeral: true,
        });
      })
      .set('music_player_revive', async (interaction) => {
        const voiceChannel = (interaction.member as Discord.GuildMember).voice
          .channel as Discord.VoiceChannel;

        if (!voiceChannel) {
          interaction.reply("You're not connected to a voice channel!");
          return;
        }

        const config = (
          await axios.get(
            (
              interaction.message.attachments.values().next()
                .value as Discord.MessageAttachment
            ).url
          )
        ).data;

        await (interaction.message as Discord.Message).delete();

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );

        musicPlayer.message = await (
          interaction.channel as Discord.TextChannel
        ).send({
          embeds: [
            new Discord.MessageEmbed()
              .setDescription('Preparing music for your ears...')
              .setColor('black'),
          ],
        });

        musicPlayer.queue.load(config);
        musicPlayer.join(voiceChannel);
        musicPlayer.play(musicPlayer.queue.current());
      });

  static async execute(interaction: Discord.MessageComponentInteraction) {
    if (interaction.customID.startsWith('music_player')) {
      const msg = interaction.message as Discord.Message;

      const components = msg.components.map(
        (row) =>
          new Discord.MessageActionRow({
            components: row.components.map((button) =>
              new Discord.MessageButton(button).setDisabled(true)
            ),
          })
      );

      await msg.edit({
        embeds: msg.embeds,
        components,
      });
    }

    const action = this.interaction_handlers.get(interaction.customID);

    await action(interaction);
  }
}
