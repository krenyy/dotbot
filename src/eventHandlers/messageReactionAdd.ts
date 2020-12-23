import Discord from "discord.js";
import ReactionButtonHandler from "./custom/reactionButtonHandler.js";

export default class MessageReactionAddEventHandler {
    static async execute(
        messageReaction: Discord.MessageReaction,
        user: Discord.User
    ) {
        await ReactionButtonHandler.execute(messageReaction, user);
    }
}
