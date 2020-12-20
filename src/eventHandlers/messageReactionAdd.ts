import Discord from "discord.js";
import ReactionHandler from "../reactionHandler.js";

export default class MessageReactionAddEventHandler {
    static async execute(
        messageReaction: Discord.MessageReaction,
        user: Discord.User
    ) {
        if (messageReaction.message.partial)
            await messageReaction.message.fetch();
        await ReactionHandler.runCallback(messageReaction, user);
    }
}
