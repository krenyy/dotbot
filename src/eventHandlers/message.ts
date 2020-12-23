import Discord from "discord.js";
import CommandHandler from "../customHandlers/commandHandler.js";

export default class MessageEventHandler {
    static async execute(message: Discord.Message) {
        await CommandHandler.execute(message);

        if (message.author === message.client.user) {
            const embed = message.embeds[0];
            const footer = embed.footer;

            if (!footer) return;

            const type = embed.footer.text;

            switch (type) {
                case "recyclable": {
                    await message.react("♻");
                    break;
                }
                case "musik": {
                    await message.react("🔁");
                    await message.react("⏹");
                    await message.react("⏭️");
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }
}
