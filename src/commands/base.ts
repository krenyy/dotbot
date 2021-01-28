import Discord from "discord.js";

export default class DiscordCommand {
  public static readonly id: string;
  public static readonly type: "USER" | "ADMIN" | "OWNER";
  public static readonly description: string;

  static async execute(message: Discord.Message, args: Array<string>) {}
}
