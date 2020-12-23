import DiscordCommand from "../commands/base.js";
import HelpCommand from "../commands/help.js";
import PlayCommand from "../commands/play.js";
import PurgeCommand from "../commands/purge.js";
import TeamsCommand from "../commands/teams.js";
import TestCommand from "../commands/test.js";
import Discord from "discord.js";

export default class CommandHandler {
    public static readonly prefix = "k/";
    public static commands: Array<typeof DiscordCommand> = [
        HelpCommand,
        PlayCommand,
        PurgeCommand,
        TeamsCommand,
        TestCommand,
    ];

    static async execute(message: Discord.Message) {
        if (message.channel.type !== "text") return;
        if (!message.content.startsWith(this.prefix)) return;

        const [cmd, ...args] = message.content
            .slice(this.prefix.length)
            .split(" ");

        await message.delete();

        const command = this.commands.find((command) => command.id === cmd);

        if (!command) return;

        await command.execute(message, args);
    }
}
