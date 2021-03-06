import DiscordCommand from "../../commands/base.js";
import HelpCommand from "../../commands/help.js";
import PlayCommand from "../../commands/play.js";
import UnqueueCommand from "../../commands/unqueue.js";
import PurgeCommand from "../../commands/purge.js";
import TeamsCommand from "../../commands/teams.js";
import EvalCommand from "../../commands/eval.js";
import Discord from "discord.js";

export default class CommandHandler {
  public static readonly prefix = ".";
  public static commands: Array<typeof DiscordCommand> = [
    HelpCommand,
    PlayCommand,
    UnqueueCommand,
    PurgeCommand,
    TeamsCommand,
    EvalCommand,
  ];

  static async execute(message: Discord.Message) {
    if (message.channel.type !== "text") return;
    if (!message.content.startsWith(this.prefix)) return;

    const [cmd, ...args] = message.content.slice(this.prefix.length).split(" ");

    await message.delete();

    const command = this.commands.find((command) => command.id === cmd);

    if (!command) return;

    await command.execute(message, args);
  }
}
