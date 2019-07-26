const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());

const spotify = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotify.clientCredentialsGrant().then(
  data => {
    spotify.setAccessToken(data.body["access_token"]);
  },
  err => {
    console.error("Ruh roh no access token", err);
  }
);

app.get("/", (req, res) => {
  res.send("Oh hey!");
});

app.get("/artists", (req, res) => {
  console.log("/artists");
  const artist = req.query.q;
  let artistName, artistId;

  spotify
    .searchArtists(artist, { limit: 1 })
    .then(artists => {
      artistName = artists.body.artists.items[0].name;
      artistId = artists.body.artists.items[0].id;

      return artistId;
    })
    .then(artistId => {
      return spotify.getArtistTopTracks(artistId, "US");
    })
    .then(topTracks => {
      // return an array of track ids to get stats for
      return topTracks.body.tracks.map(track => track.id);
    })
    .then(trackIds => {
      return spotify.getAudioFeaturesForTracks(trackIds);
    })
    .then(audioFeatures => {
      const stats = audioFeatures.body.audio_features;
      console.log("Stats:");
      console.dir(stats);
      const acousticness = (
        stats.map(track => track.acousticness).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const danceability = (
        stats.map(track => track.danceability).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const energy = (
        stats.map(track => track.energy).reduce((a, b) => a + b) / stats.length
      ).toFixed(2);
      const instrumentalness = (
        stats.map(track => track.instrumentalness).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const liveness = (
        stats.map(track => track.liveness).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const loudness = (
        stats.map(track => track.loudness).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const speechiness = (
        stats.map(track => track.speechiness).reduce((a, b) => a + b) /
        stats.length
      ).toFixed(2);
      const tempo = (
        stats.map(track => track.tempo).reduce((a, b) => a + b) / stats.length
      ).toFixed(0);
      const valence = (
        stats.map(track => track.valence).reduce((a, b) => a + b) / stats.length
      ).toFixed(2);

      res.json({
        artistName,
        artistId,
        acousticness,
        danceability,
        energy,
        instrumentalness,
        liveness,
        loudness,
        speechiness,
        tempo,
        valence
      });
    })
    .catch(err => {
      console.error("Ruh roh search failed", err);
    });
});

app.listen(process.env.PORT || 8080);
