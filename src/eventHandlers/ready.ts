import client from '../index.js';
import TempChannelHandler from './custom/tempChannelHandler.js';

export default class ReadyEventHandler {
  static async execute() {
    await client.application.fetch();

    client.user.setPresence({
      activities: [
        {
          name: '/',
          type: 'LISTENING',
        },
      ],
      status: 'online',
    });

    await TempChannelHandler.initialCleanup();

    console.log(`${client.user.tag} is ready to go!`);
  }
}
