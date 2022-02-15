import Discord from "discord.js";
import SlashCommand from "../../commands/base.js";
import PlayCommand from "../../commands/play.js";
import RemoveCommand from "../../commands/remove.js";
import GotoCommand from "../../commands/goto.js";
import QueueCommand from "../../commands/queue.js";
import PurgeCommand from "../../commands/purge.js";
import EvalCommand from "../../commands/eval.js";

export default class InteractionCommandHandler {
  static commands: Array<typeof SlashCommand> = [
    PlayCommand,
    RemoveCommand,
    GotoCommand,
    QueueCommand,
    PurgeCommand,
    EvalCommand,
  ];

  static async register(
    commandManager:
      | Discord.ApplicationCommandManager
      | Discord.GuildApplicationCommandManager
  ) {
    commandManager.set(this.commands.map((cmd) => cmd.data));
  }

  static async execute(interaction: Discord.CommandInteraction) {
    const command = this.commands.find(
      (cmd) => cmd.data.name === interaction.commandName
    );

    await command.execute(interaction);
  }
}
