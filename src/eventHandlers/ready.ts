import client from "../index.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";

export default class ReadyEventHandler {
    static async execute() {
        client.owner = await client.users.fetch("231409772677562368");

        await TempChannelHandler.initialCleanup();
        console.log(`${client.user.tag} is ready to go!`);
    }
}
