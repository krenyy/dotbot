import Discord from "discord.js";
import HelpCommand from "./commands/help.js";
import PlayCommand from "./commands/play.js";
import PurgeCommand from "./commands/purge.js";
import TeamsCommand from "./commands/teams.js";
import TestCommand from "./commands/test.js";

export default class CommandHandler {
    public static readonly prefix = "k/";
    private static readonly timeoutMs = 2000;

    public static readonly commands: Array<typeof Command> = [
        HelpCommand,
        PlayCommand,
        PurgeCommand,
        TeamsCommand,
        TestCommand,
    ];

    private static userTimeouts = new Set<string>();

    static async execute(message: Discord.Message) {
        if (message.channel.type !== "text") return;
        if (!message.content.startsWith(this.prefix)) return;

        await message.delete();

        if (this.userTimeouts.has(message.author.id)) {
            const msg = await message.channel.send(
                new Discord.MessageEmbed()
                    .default(message.author)
                    .setTitle("Error")
                    .setDescription("You're going too fast!")
            );

            await msg.registerRecyclable();
            return;
        }

        const cmdAndArgs = message.content.slice(this.prefix.length).split(" ");
        const cmd = cmdAndArgs[0];
        const args = cmdAndArgs.slice(1);

        (
            (await this.commands.find((value) => value.cmd === cmd)) ||
            UnknownCommand
        ).execute(message, args);

        this.userTimeouts.add(message.author.id);

        setTimeout(() => {
            this.userTimeouts.delete(message.author.id);
        }, this.timeoutMs);
    }
}

declare module "discord.js" {
    interface MessageEmbed {
        default(this: MessageEmbed, author: Discord.User): MessageEmbed;
    }
}

Discord.MessageEmbed.prototype.default = function (this, author: Discord.User) {
    return this.setColor("#FF0000")
        .setAuthor(author.tag, author.avatarURL())
        .setFooter(
            Buffer.from(
                JSON.stringify({ author: author.id, reactions: {} }),
                "binary"
            ).toString("base64")
        );
};

export abstract class Command {
    public static readonly cmd: string;

    public static readonly description: string;

    static async execute(message: Discord.Message, args: Array<string>) {}
}

class UnknownCommand implements Command {
    public static cmd = "";

    static async execute(message: Discord.Message, args: Array<string>) {
        const msg = await message.channel.send(
            new Discord.MessageEmbed()
                .default(message.author)
                .setTitle("Error")
                .setDescription(
                    `Unknown command! (use '${CommandHandler.prefix}help' for more info)`
                )
        );

        await msg.registerRecyclable();
    }
}
