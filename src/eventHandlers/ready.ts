import client from "../index.js";
import CommandHandler from "./custom/commandHandler.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";
import HelpCommand from "../commands/help.js";
import Discord from "discord.js";
import BetterEmbed from "../util/betterembed.js";

declare module "discord.js" {
  interface Client {
    owner: Discord.User;
  }
}

export default class ReadyEventHandler {
  static async execute() {
    client.owner = await client.users.fetch(process.env.KBOT_OWNER_ID);

    await client.user.setPresence({
      activity: { name: `${CommandHandler.prefix}${HelpCommand.id}` },
      status: "online",
    });

    await TempChannelHandler.initialCleanup();

    /** Make all bot messages recyclable */
    for (const [, channel] of client.channels.cache) {
      if (channel.type !== "text") continue;
      const textChannel = channel as Discord.TextChannel;
      for (const [, message] of await textChannel.messages.fetch()) {
        if (message.author !== client.user) continue;
        if (message.system) continue;
        await message.edit(
          new BetterEmbed(message.embeds[0]).setType("recyclable")
        );
      }
    }

    console.log(`${client.user.tag} is ready to go!`);
  }
}
