import Discord from "discord.js";
import DiscordCommand from "./base.js";

export default class TestCommand implements DiscordCommand {
    public static readonly id = "test";
    public static readonly description =
        "Command used for testing stuff in development.";

    static async execute(message: Discord.Message, args: Array<string>) {
        console.log("TEST");
    }
}
