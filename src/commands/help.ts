import Discord from "discord.js";
import DiscordCommand from "./base.js";
import BetterEmbed from "../util/betterembed.js";
import CommandHandler from "../eventHandlers/custom/commandHandler.js";

export default class HelpCommand implements DiscordCommand {
    public static readonly id = "help";
    public static readonly description = "Prints this message.";

    static async execute(message: Discord.Message, args: Array<string>) {
        await message.channel.send(
            new BetterEmbed()
                .setAuthor(message.author)
                .setTitle("Help")
                .addFields(
                    ...CommandHandler.commands.map((command) => ({
                        name: CommandHandler.prefix + command.id,
                        value: command.description,
                    }))
                )
                .setType("recyclable")
        );
    }
}
