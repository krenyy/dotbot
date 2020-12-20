import CommandHandler, { Command } from "../commandHandler.js";
import Discord from "discord.js";

export default class HelpCommand implements Command {
    public static readonly cmd = "help";

    public static readonly description = "Prints this message.";

    static async execute(message: Discord.Message, args: Array<string>) {
        const embed = new Discord.MessageEmbed()
            .default(message.author)
            .setTitle("Help")
            .addFields(
                ...CommandHandler.commands.map((command) => {
                    return {
                        name: CommandHandler.prefix + command.cmd,
                        value: command.description,
                    };
                })
            );

        const msg = await message.channel.send(embed);

        await msg.registerRecyclable();
    }
}
