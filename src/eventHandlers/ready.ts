import client from "../index.js";
import CommandHandler from "./custom/commandHandler.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";
import HelpCommand from "../commands/help.js";
import Discord from "discord.js";

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

    console.log(`${client.user.tag} is ready to go!`);
  }
}
