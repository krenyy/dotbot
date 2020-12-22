import Discord from "discord.js";

declare module "discord.js" {
    interface Message {
        registerReactionButton(
            this: Message,
            emoji: string,
            callback: ReactionCallback
        ): Promise<void>;
        unregisterReactionButton(this: Message, emoji: string): Promise<void>;
        unregisterReactionButtons(this: Message): Promise<void>;

        // Convenience methods

        registerRecyclable(this: Message, emoji?: string): Promise<void>;
    }
}

Discord.Message.prototype.registerReactionButton = async function (
    this: Discord.Message,
    emoji: string,
    callback: ReactionCallback
) {
    await ReactionHandler.registerMessageReactionButton(this, emoji, callback);
};

Discord.Message.prototype.unregisterReactionButton = async function (
    this: Discord.Message,
    emoji: string
) {
    await ReactionHandler.unregisterMessageReactionButton(this, emoji);
};

Discord.Message.prototype.unregisterReactionButtons = async function (
    this: Discord.Message
) {
    await ReactionHandler.unregisterMessageReactionButtons(this);
};

Discord.Message.prototype.registerRecyclable = async function (
    this: Discord.Message,
    emoji?: string
) {
    await ReactionHandler.registerMessageRecyclable(this, emoji);
};

type ReactionCallback = (
    messageReaction: Discord.MessageReaction,
    user: Discord.User
) => any;

type FooterData = {
    author: string;
    reactions: { [key: string]: ReactionCallback };
};

export default class ReactionHandler {
    static async decode(obj: string): Promise<FooterData> {
        return JSON.parse(
            Buffer.from(obj, "base64").toString("binary"),
            (key, value) => {
                if (
                    typeof value === "string" &&
                    value.startsWith("/Function(") &&
                    value.endsWith(")/")
                ) {
                    return eval(value.substring(10, value.length - 2));
                }
                return value;
            }
        );
    }

    static async encode(obj: FooterData): Promise<string> {
        return Buffer.from(
            JSON.stringify(obj, function (key, value) {
                if (typeof value === "function") {
                    return "/Function(" + value.toString() + ")/";
                }
                return value;
            }),
            "binary"
        ).toString("base64");
    }

    static async registerMessageReactionButton(
        message: Discord.Message,
        emoji: string,
        callback: ReactionCallback
    ) {
        const json = await this.decode(message.embeds[0].footer.text);
        json.reactions[emoji.codePointAt(0).toString(16)] = callback;
        await message.edit(
            new Discord.MessageEmbed(message.embeds[0]).setFooter(
                await this.encode(json)
            )
        );
        await message.react(emoji);
    }

    static async unregisterMessageReactionButton(
        message: Discord.Message,
        emoji: string
    ) {
        await message.reactions.cache
            .find((messageReaction) => messageReaction.emoji.name === emoji)
            .remove();
        const json = await this.decode(message.embeds[0].footer.text);
        delete json.reactions[emoji.codePointAt(0).toString(16)];
        await message.edit(
            new Discord.MessageEmbed(message.embeds[0]).setFooter(
                await this.encode(json)
            )
        );
    }

    static async unregisterMessageReactionButtons(message: Discord.Message) {
        await message.reactions.removeAll();
        const json = await this.decode(message.embeds[0].footer.text);
        json.reactions = {};
        await message.edit(
            new Discord.MessageEmbed(message.embeds[0]).setFooter(
                await this.encode(json)
            )
        );
    }

    static async registerMessageRecyclable(
        message: Discord.Message,
        emoji?: string
    ) {
        await this.registerMessageReactionButton(
            message,
            emoji || "♻",
            async (reactionMessage) => {
                await reactionMessage.message.delete();
            }
        );
    }

    static async runCallback(
        messageReaction: Discord.MessageReaction,
        user: Discord.User
    ) {
        const message = messageReaction.message;

        if (message.author !== messageReaction.client.user) return;
        if (user === message.author) return;
        if (user.bot) return;

        if (user !== messageReaction.client.user) {
            await messageReaction.users.remove(user);
        }

        const embed = message.embeds[0];
        const emoji = messageReaction.emoji;
        const emojiUnicode = emoji.name.codePointAt(0).toString(16);
        const json = await this.decode(embed.footer.text);

        if (emojiUnicode in json.reactions) {
            await json.reactions[emojiUnicode](messageReaction, user);
        }
    }
}
