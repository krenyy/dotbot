import Discord from "discord.js";

export default class SlashCommand {
  public static readonly data: Discord.ApplicationCommandData;

  static async execute(interaction: Discord.CommandInteraction) {}
}
