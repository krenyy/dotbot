import Discord from "discord.js";

export default class DiscordCommand {
    public static id: string;
    public static description: string;

    static async execute(message: Discord.Message, args: Array<string>) {}
}
