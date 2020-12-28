import Discord from "discord.js";
import DiscordMusicPlayerFactory from "../../util/musicPlayer.js";

type ReactionCallback = (
  messageReaction: Discord.MessageReaction,
  user: Discord.User
) => void;

type MessageTypeData = { reactions: Array<string>; callback: ReactionCallback };

export default class ReactionButtonHandler {
  private static messageTypes = new Map<string, MessageTypeData>()
    .set("recyclable", {
      reactions: ["♻"],
      callback: async (messageReaction, user) => {
        switch (messageReaction.emoji.name) {
          case "♻": {
            await messageReaction.message.delete();
            break;
          }
        }
      },
    })
    .set("musik", {
      reactions: ["🔁", "⏹", "⏭"],
      callback: async (messageReaction, user) => {
        const message = messageReaction.message;
        const guild = message.guild;
        const voiceState = guild.me.voice;
        const voiceChannel = voiceState.channel;

        const isInVoiceChannel =
          guild.member(user).voice.channel === voiceChannel;

        if (!isInVoiceChannel && user !== user.client.owner) return;

        const player = await DiscordMusicPlayerFactory.get(guild);

        switch (messageReaction.emoji.name) {
          case "🔁": {
            await player.loop();
            break;
          }

          case "⏹": {
            await player.leave();
            break;
          }

          case "⏭": {
            await player.next();
            break;
          }
        }
      },
    });

  static async register(message: Discord.Message) {
    if (message.author !== message.client.user) return;

    if (!message.embeds.length) return;

    const embed = message.embeds[0];

    const footer = embed.footer;
    if (!footer) return;
    const embedType = embed.footer.text;

    if (!this.messageTypes.has(embedType)) return;

    const type = this.messageTypes.get(embedType);

    await message.reactions.removeAll();
    for (const reaction of type.reactions) {
      await message.react(reaction);
    }
  }

  static async execute(
    messageReaction: Discord.MessageReaction,
    user: Discord.User
  ) {
    if (user.bot) return;

    await messageReaction.users.remove(user);

    if (messageReaction.message.author !== user.client.user) return;

    const reactionUsers = await messageReaction.users.fetch();
    if (reactionUsers.every((user) => user !== user.client.user)) return;

    const embed = messageReaction.message.embeds[0];
    const embedType = embed.footer.text;

    const type = this.messageTypes.get(embedType);

    await type.callback(messageReaction, user);
  }
}
