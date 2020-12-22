import { Command } from "../commandHandler.js";
import Discord from "discord.js";

export default class TestCommand implements Command {
    public static readonly cmd = "test";

    public static readonly description = "Prints this message.";

    static async execute(message: Discord.Message, args: Array<string>) {
        const msg = await message.channel.send(
            new Discord.MessageEmbed()
                .default(message.author)
                .setTitle("TEST")
                .setDescription("TEST")
        );

        await msg.registerReactionButton("🧡", (messageReaction, user) => {
            console.log("AHOJ");
        });
        await msg.registerRecyclable("🗑");
    }
}
