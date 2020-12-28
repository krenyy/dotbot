import Discord from "discord.js";
import BetterEmbed from "../util/betterembed.js";
import DiscordCommand from "./base.js";
import js_beautify from "js-beautify";

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

    if (evalQuery.includes("setTimeout") || evalQuery.includes("setInterval")) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError(
            "Cannot use `setTimeout` or `setInterval` inside an eval!\n" +
              "Use special `await sleep(ms)` instead!"
          )
          .setType("recyclable")
      );
      return;
    }

    const codeBlock = `\`\`\`ts\n${js_beautify(evalQuery)}\`\`\`\n`;

    const evalEmbed = new BetterEmbed()
      .setAuthor(message.author)
      .setInfo(codeBlock)
      .setTitle("Running...");

    const evalMsg = await message.channel.send(evalEmbed);

    async function sleep(ms: number) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, ms);
      });
    }
    try {
      const evalResult = await eval(`(async()=>{${evalQuery}})()`);
      await evalMsg.edit(
        evalEmbed.setSuccess(codeBlock + evalResult).setType("recyclable")
      );
    } catch (e) {
      await evalMsg.edit(
        evalEmbed.setError(codeBlock + e).setType("recyclable")
      );
    }
  }
}
