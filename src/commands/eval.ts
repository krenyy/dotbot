import Discord from "discord.js";
import BetterEmbed from "../util/betterembed.js";
import DiscordCommand from "./base.js";

export default class EvalCommand implements DiscordCommand {
  public static readonly id = "eval";
  public static readonly description = "Evaluates an expression.";

  static async execute(message: Discord.Message, args: Array<string>) {
    if (message.author !== message.client.owner) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Only the owner can use this command!")
          .setType("recyclable")
      );
      return;
    }

    const evalQuery = args.join(" ");
    const codeBlock = `\`\`\`ts\n${evalQuery}\`\`\`\n`;

    try {
      const evalResult = await eval(`(async () => { return ${evalQuery} })()`);
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setSuccess(codeBlock + evalResult)
          .setType("recyclable")
      );
    } catch (e) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError(codeBlock + e)
          .setType("recyclable")
      );
    }
  }
}
