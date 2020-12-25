import Discord from "discord.js";
import CommandHandler from "./custom/commandHandler.js";
import ReactionButtonHandler from "./custom/reactionButtonHandler.js";

export default class MessageEventHandler {
    static async execute(message: Discord.Message) {
        if (message.partial) await message.fetch();

        await CommandHandler.execute(message);
        await ReactionButtonHandler.register(message);
    }
}
