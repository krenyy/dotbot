import Discord from "discord.js";
import musicPlayer from "../util/musicPlayer.js";

export default class MessageReactionAddEventHandler {
    static async execute(
        messageReaction: Discord.MessageReaction,
        user: Discord.User
    ) {
        if (messageReaction.message.partial) {
            await messageReaction.message.fetch();
        }

        if (user.bot) return;

        await messageReaction.users.remove(user);

        if (messageReaction.message.author !== user.client.user) return;

        const reactionUsers = await messageReaction.users.fetch();
        if (reactionUsers.every((user) => user !== user.client.user)) return;

        const embed = messageReaction.message.embeds[0];
        const embedAuthor = embed.author;
        const embedAuthorId = embedAuthor ? embedAuthor.name : null;
        const author = embedAuthorId
            ? await user.client.users.fetch(embedAuthorId)
            : null;
        const type = embed.footer.text;

        const ownsMessage = user === author;
        const isBotOwner = user === user.client.owner;
        const hasAdminPerms = messageReaction.message.guild
            .member(user)
            .hasPermission("ADMINISTRATOR");

        switch (type) {
            case "recyclable": {
                if (!(ownsMessage || hasAdminPerms || isBotOwner)) return;

                switch (messageReaction.emoji.name) {
                    case "♻": {
                        await messageReaction.message.delete();
                        break;
                    }
                }

                break;
            }

            case "musik": {
                const message = messageReaction.message;
                const guild = message.guild;
                const voiceState = guild.me.voice;
                const connection = voiceState ? voiceState.connection : null;
                const dispatcher = connection ? connection.dispatcher : null;

                if (!connection) {
                    await message.delete();
                }

                const isInVoiceChannel =
                    guild.member(user).voice.channel === voiceState.channel;

                if (!(isInVoiceChannel || hasAdminPerms || isBotOwner)) return;

                switch (messageReaction.emoji.name) {
                    case "🔁": {
                        await musicPlayer.loop(guild);
                        break;
                    }

                    case "⏹": {
                        if (connection) {
                            connection.disconnect();
                        }
                        break;
                    }

                    case "⏭️": {
                        if (connection && dispatcher) {
                            dispatcher.emit("finish");
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
}
