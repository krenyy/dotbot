import { getTracks } from "spotify-url-info";
import YoutubeTrackProvider from "./youtube.js";

export default class SpotifyTrackProvider {
  static async get(query: string) {
    const tracks = await getTracks(query);

    if (tracks.length > 1)
      throw new Error(
        "Currently, it is not allowed to play whole playlists from Spotify!"
      );

    return (
      await Promise.all(
        tracks.map(async (track) => {
          return await YoutubeTrackProvider.get(
            `${track.name} - ${track.artists
              .map((artist) => artist.name)
              .join(" ")}`
          );
        })
      )
    ).flat();
  }
}
