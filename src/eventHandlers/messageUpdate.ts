import Discord from "discord.js";
import CommandHandler from "./custom/commandHandler.js";
import ReactionButtonHandler from "./custom/reactionButtonHandler.js";

export default class MessageUpdateEventHandler {
  static async execute(
    oldMessage: Discord.Message,
    newMessage: Discord.Message
  ) {
    if (oldMessage.partial) await oldMessage.fetch();
    if (newMessage.partial) await newMessage.fetch();

    await CommandHandler.execute(newMessage);

    if (newMessage.author === newMessage.client.user) {
      const oldEmbedFooter = oldMessage.embeds[0].footer;
      const oldEmbedType = oldEmbedFooter ? oldEmbedFooter.text : null;

      const newEmbedFooter = newMessage.embeds[0].footer;
      const newEmbedType = newEmbedFooter ? newEmbedFooter.text : null;

      if (oldEmbedType !== newEmbedType) {
        await ReactionButtonHandler.register(newMessage);
      }
    }
  }
}
