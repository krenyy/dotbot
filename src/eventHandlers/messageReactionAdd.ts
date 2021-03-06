import Discord from "discord.js";
import ReactionButtonHandler from "./custom/reactionButtonHandler.js";

export default class MessageReactionAddEventHandler {
  static async execute(
    messageReaction: Discord.MessageReaction,
    user: Discord.User
  ) {
    if (messageReaction.partial) await messageReaction.fetch();
    if (user.partial) await user.fetch();

    if (messageReaction.message.author === user.client.user) {
      await ReactionButtonHandler.execute(messageReaction, user);
    }
  }
}
