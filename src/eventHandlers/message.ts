import Discord from "discord.js";
import CommandHandler from "../commandHandler.js";

export default class MessageEventHandler {
    static async execute(message: Discord.Message) {
        await CommandHandler.execute(message);
    }
}
