// server/api/get-video-metadata.js

import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id) {
    return { error: 'Video ID is required' };
  }

  const apiKey = process.env.YOUTUBE_API_KEY; // Ensure your API key is stored securely

  try {
    const response = await $fetch('https://www.googleapis.com/youtube/v3/videos', {
      method: 'GET',
      params: {
        part: 'snippet',
        id,
        key: apiKey,
      },
    });

    const videoData = response.items[0];

    if (!videoData) {
      return { error: 'Video not found' };
    }

    const { title, description, thumbnails } = videoData.snippet;

    return {
      title,
      description,
      thumbnails,
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return { error: 'Failed to fetch video metadata', details: error.message };
  }
});
