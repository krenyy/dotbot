import Discord from "discord.js";
import InteractionCommandHandler from "./custom/interactionCommand.js";

export default class MessageCreateHandler {
  static async execute(message: Discord.Message) {
    if (message.partial) await message.fetch();

    if (message.author === message.client.application.owner) {
      switch (message.content) {
        case "!deployGlobal": {
          await InteractionCommandHandler.register(
            message.client.application.commands
          );
          break;
        }
        case "!deployGuild": {
          await InteractionCommandHandler.register(message.guild.commands);
          break;
        }
        case "!clearGuild": {
          await message.guild.commands.set([]);
          break;
        }
        default: {
          return;
        }
      }

      await message.reply("Action performed!");
    }
  }
}
