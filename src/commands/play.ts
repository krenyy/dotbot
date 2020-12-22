import { Command } from "../commandHandler.js";
import Discord from "discord.js";
import ytdl from "ytdl-core";
import yts from "yt-search";

export default class PlayCommand implements Command {
    public static readonly cmd = "play";

    public static readonly description = "Plays a video from Youtube.";

    static async execute(message: Discord.Message, args: Array<string>) {
        if (!message.member.voice.channel) {
            await (
                await message.channel.send(
                    new Discord.MessageEmbed()
                        .default(message.author)
                        .setTitle("Error")
                        .setDescription(
                            "You're not connected to a voice channel!"
                        )
                )
            ).registerRecyclable();
            return;
        }

        if (
            message.client.voice.connections.find(
                (con) => con.voice.channel === message.member.voice.channel
            )
        ) {
            await (
                await message.channel.send(
                    new Discord.MessageEmbed()
                        .default(message.author)
                        .setTitle("Error")
                        .setDescription(
                            "Bot is already connected to your voice channel!"
                        )
                )
            ).registerRecyclable();
            return;
        }

        if (message.guild.me.voice.channel) {
            if (message.author.id !== message.client.owner.id) {
                await (
                    await message.channel.send(
                        new Discord.MessageEmbed()
                            .default(message.author)
                            .setTitle("Error")
                            .setDescription(
                                "Bot is already connected to a voice channel!"
                            )
                    )
                ).registerRecyclable();
                return;
            }

            message.guild.me.voice.connection.disconnect();
        }

        if (!args) {
            await (
                await message.channel.send(
                    new Discord.MessageEmbed()
                        .default(message.author)
                        .setTitle("Error")
                        .setDescription("No URL or search query provided!")
                )
            ).registerRecyclable();
            return;
        }

        if (!ytdl.validateURL(args[0])) {
            args[0] = (await yts.search(args.join(" "))).videos[0].url;
        }

        const stream = ytdl(args[0], { quality: "highestaudio" });

        const connection = await message.member.voice.channel.join();

        const dispatcher = connection.play(stream);

        dispatcher.once("finish", async () => {
            connection.disconnect();
            console.log("dispatcher finish");
        });

        connection.once("disconnect", async () => {
            stream.destroy();
            await msg.delete();
            console.log("connection disconnect");
        });

        const videoInfo = await ytdl.getInfo(args[0]);
        const videoDetails = videoInfo.videoDetails;

        const embedPlaying = new Discord.MessageEmbed()
            .default(message.author)
            .setTitle("Playing")
            .setDescription(
                `[${videoDetails.title}](${videoDetails.video_url})`
            )
            .setImage(
                videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url
            );

        const msg = await message.channel.send(embedPlaying);

        // ? Wait for a fix for the speedup issue
        /*
        await msg.registerReactionButton(
            "▶️",
            async (messageReaction, user) => {
                const msg = messageReaction.message;
                const dispatcher = msg.member.voice.connection.dispatcher;
                if (!dispatcher.paused) {
                    return;
                }

                dispatcher.resume();
                await msg.edit(
                    new Discord.MessageEmbed(msg.embeds[0]).setTitle("Playing")
                );
            }
        );

        await msg.registerReactionButton(
            "⏸️",
            async (messageReaction, user) => {
                const msg = messageReaction.message;
                const dispatcher = msg.member.voice.connection.dispatcher;
                if (dispatcher.paused) {
                    return;
                }

                dispatcher.pause(true);

                await msg.edit(
                    new Discord.MessageEmbed(msg.embeds[0]).setTitle("Paused")
                );
            }
        );
        */

        await msg.registerReactionButton(
            "⏹️",
            async (messageReaction, user) => {
                const msg = messageReaction.message;
                const voiceState = msg.member.voice;
                if (
                    msg.guild.member(user).voice.channel !== voiceState.channel
                ) {
                    return;
                }

                if (voiceState.connection) {
                    voiceState.connection.disconnect();
                }
            }
        );
    }
}
