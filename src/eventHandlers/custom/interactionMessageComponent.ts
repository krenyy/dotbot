import axios from "axios";
import Discord from "discord.js";
import DiscordMusicPlayerFactory from "../../musicPlayer/factory.js";

type InteractionCallback = (
  interaction: Discord.MessageComponentInteraction
) => Promise<void>;

export default class InteractionMessageComponentHandler {
  static readonly interaction_handlers: Map<string, InteractionCallback> =
    new Map<string, InteractionCallback>()
      .set("delete", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        await (interaction.message as Discord.Message).delete();
        await interaction.editReply({ content: "Deleted!" });
      })
      .set("music_player_previous", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.previous();
        await interaction.editReply({ content: "Backtracked!" });
      })
      .set("music_player_next", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.next();
        await interaction.editReply({ content: "Skipped!" });
      })
      .set("music_player_resume", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.resume();
        await interaction.editReply({ content: "Resumed!" });
      })
      .set("music_player_pause", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.pause();
        await interaction.editReply({ content: "Paused!" });
      })
      .set("music_player_stop", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.leave();
        await interaction.editReply({ content: "Stopped!" });
      })
      .set("music_player_loop", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );
        await musicPlayer.loop();
        await interaction.editReply({
          content: `${musicPlayer.looping ? "En" : "Dis"}abled looping!`,
        });
      })
      .set("music_player_revive", async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel as Discord.TextChannel;
        const message = interaction.message as Discord.Message;
        const member = interaction.member as Discord.GuildMember;
        const voiceChannel = member.voice.channel as Discord.VoiceChannel;

        if (!voiceChannel) {
          await interaction.editReply({
            content: "You're not connected to a voice channel!",
          });
          await message.edit({
            components: message.components.map(
              (row) =>
                new Discord.MessageActionRow({
                  components: row.components.map((button) =>
                    new Discord.MessageButton(
                      button as Discord.MessageButton
                    ).setDisabled(false)
                  ),
                })
            ),
          });
          return;
        }

        const config = (
          await axios.get(
            (
              message.attachments.values().next()
                .value as Discord.MessageAttachment
            ).url
          )
        ).data;

        await message.delete();

        const musicPlayer = await DiscordMusicPlayerFactory.get(
          interaction.guild
        );

        musicPlayer.message = await channel.send({
          embeds: [
            new Discord.MessageEmbed()
              .setDescription("Preparing music for your ears...")
              .setColor("#000000"),
          ],
        });

        musicPlayer.queue.load(config);
        musicPlayer.join(voiceChannel);
        musicPlayer.play(musicPlayer.queue.current());

        interaction.editReply("Revived!");
      });

  static async execute(interaction: Discord.MessageComponentInteraction) {
    if (interaction.customId.startsWith("music_player")) {
      const msg = interaction.message as Discord.Message;

      const components = msg.components.map(
        (row) =>
          new Discord.MessageActionRow({
            components: row.components.map((button) =>
              new Discord.MessageButton(
                button as Discord.MessageButton
              ).setDisabled(true)
            ),
          })
      );

      await msg.edit({
        embeds: msg.embeds,
        components,
      });
    }

    const action = this.interaction_handlers.get(interaction.customId);

    await action(interaction);
  }
}
