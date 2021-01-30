import Discord from "discord.js";
import DiscordCommand from "./base.js";
import BetterEmbed from "../util/betterEmbed.js";
import CommandHandler from "../eventHandlers/custom/commandHandler.js";

export default class HelpCommand implements DiscordCommand {
  public static readonly id = "help";
  public static readonly type = "USER";
  public static readonly description = "Prints this message.";
  public static readonly helpText = "";

  private static readonly typeMap = new Map<string, string>()
    .set("OWNER", "Bot owner")
    .set("ADMIN", "Administrator");

  static async execute(message: Discord.Message, args: Array<string>) {
    if (args.length > 1) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Too many arguments!")
          .setType("recyclable")
      );
    } else if (args.length == 1) {
      const command = CommandHandler.commands.find(
        (command) => command.id === args[0]
      );

      if (!command) {
        await message.channel.send(
          new BetterEmbed()
            .setAuthor(message.author)
            .setError("Command doesn't exist!")
            .setType("recyclable")
        );
        return;
      }

      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setTitle(command.id)
          .setDescription(
            command.helpText
              ? `${CommandHandler.prefix}${command.id} ${command.helpText}`
              : "Nothing special here!"
          )
          .setType("recyclable")
      );
    } else {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setTitle("Help")
          .setDescription(
            `Type '${CommandHandler.prefix}${this.id} <command>' for more information`
          )
          .addFields(
            ...CommandHandler.commands.map((command) => ({
              name:
                CommandHandler.prefix +
                command.id +
                (command.type === "USER"
                  ? ""
                  : ` (${this.typeMap.get(command.type)} only)`),
              value: command.description,
            }))
          )
          .setType("recyclable")
      );
    }
  }
}
