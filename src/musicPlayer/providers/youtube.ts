import { getAverageColor } from 'fast-average-color-node';
import ytdl from 'ytdl-core';
import yts from 'yt-search';
import ytpl from 'ytpl';
import { DiscordMusicPlayerTrackData } from '../queue';

export default class YoutubeTrackProvider {
  private static playlistItemLimit: number = 100;

  static async getFromSearch(query: string) {
    const searchResults = (await yts.search(query)).videos;

    if (!searchResults.length) throw new Error('No videos found!');

    const video = searchResults[0];

    return [
      {
        title: video.title,
        url: video.url,
        thumbnailURL: video.thumbnail,
        averageColor: (await getAverageColor(video.thumbnail)).hex,
      },
    ] as DiscordMusicPlayerTrackData[];
  }

  static async getFromURL(url: string) {
    const info = await ytdl.getBasicInfo(url);
    const details = info.videoDetails;

    return [
      {
        title: details.title,
        url: details.video_url,
        thumbnailURL: details.thumbnails[details.thumbnails.length - 1].url,
        averageColor: (
          await getAverageColor(details.thumbnails[0].url.split('?')[0])
        ).hex,
      },
    ] as DiscordMusicPlayerTrackData[];
  }

  static async getFromPlaylistURL(url: string) {
    const playlist = await ytpl(url, { limit: Infinity });

    if (playlist.estimatedItemCount > this.playlistItemLimit)
      throw new Error(
        `Playlist too long! (must be ${this.playlistItemLimit} or less)`
      );

    return (await Promise.all(
      playlist.items.map(async (item) => ({
        title: item.title,
        url: item.url,
        thumbnailURL: item.bestThumbnail.url,
        averageColor: (await getAverageColor(item.bestThumbnail.url)).hex,
      }))
    )) as DiscordMusicPlayerTrackData[];
  }

  static async get(query: string) {
    if (!ytdl.validateURL(query)) return this.getFromSearch(query);
    if (ytpl.validateID(query)) return this.getFromPlaylistURL(query);
    return this.getFromURL(query);
  }
}
