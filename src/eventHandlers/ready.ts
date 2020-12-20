import client from "../index.js";
import TempChannelHandler from "../tempChannelHandler.js";

export default class ReadyEventHandler {
    static async execute() {
        await TempChannelHandler.initialCleanup();
    }
}
