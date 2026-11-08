import type { Schema, Attribute } from '@strapi/strapi';

export interface AlbumSong extends Schema.Component {
  collectionName: 'components_album_songs';
  info: {
    name: 'song';
    icon: 'music';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    file: Attribute.Media<'audios'> & Attribute.Required;
  };
}

export interface CustomLinkButtonCustomLinkButton extends Schema.Component {
  collectionName: 'components_custom_link_button_custom_link_buttons';
  info: {
    displayName: 'Custom Link Button';
    icon: 'link';
    description: 'A custom link button with title, subtitle, URL, and optional icon';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    subtitle: Attribute.String;
    url: Attribute.String & Attribute.Required;
    iconName: Attribute.String;
    customIcon: Attribute.Media<'images'>;
  };
}

export interface EditorialEditorialItem extends Schema.Component {
  collectionName: 'components_editorial_editorial_items';
  info: {
    displayName: 'Editorial Item';
    icon: 'book';
    description: 'A curated editorial showcase entry for publications and media profiles';
  };
  attributes: {
    contentType: Attribute.Enumeration<
      [
        'article',
        'video',
        'interview',
        'concert_review',
        'music_news',
        'photo_gallery',
        'album_review'
      ]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'article'>;
    title: Attribute.String & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    image: Attribute.Media<'images'>;
    category: Attribute.String;
    excerpt: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    isFeatured: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface GalleryGallery extends Schema.Component {
  collectionName: 'components_gallery_galleries';
  info: {
    displayName: 'gallery';
  };
  attributes: {
    image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface MemberMembers extends Schema.Component {
  collectionName: 'components_member_members';
  info: {
    displayName: 'members';
  };
  attributes: {
    name: Attribute.String;
    instrument: Attribute.String;
    image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface ScanTimeScanTime extends Schema.Component {
  collectionName: 'components_scan_time_scan_times';
  info: {
    displayName: 'scanTime';
  };
  attributes: {
    date: Attribute.String;
  };
}

export interface SinglesongSinglesong extends Schema.Component {
  collectionName: 'components_singlesong_singlesongs';
  info: {
    displayName: 'singlesong';
    icon: 'music';
    description: 'A single featured song, either uploaded or embedded';
  };
  attributes: {
    title: Attribute.String;
    song: Attribute.Media<'audios'>;
    isEmbed: Attribute.Boolean & Attribute.DefaultTo<false>;
    platform: Attribute.Enumeration<
      [
        'spotify',
        'appleMusic',
        'youtube',
        'deezer',
        'bandcamp',
        'mixcloud',
        'audiomack',
        'soundcloud'
      ]
    >;
    url: Attribute.String;
    embedUrl: Attribute.String;
    embedHtml: Attribute.Text;
    trackId: Attribute.String;
    spotifyUrl: Attribute.String;
    spotifyOembedTitle: Attribute.String;
    spotifyOembedThumbnailUrl: Attribute.String;
    spotifyOembedType: Attribute.Enumeration<
      ['track', 'album', 'playlist', 'artist']
    >;
    spotifyOembedHtml: Attribute.Text;
  };
}

export interface SinglevideoSinglevideo extends Schema.Component {
  collectionName: 'components_singlevideo_singlevideos';
  info: {
    displayName: 'singlevideo';
    icon: 'calendar';
  };
  attributes: {
    title: Attribute.String;
    youtubeid: Attribute.String;
  };
}

export interface SongSongs extends Schema.Component {
  collectionName: 'components_song_songs';
  info: {
    displayName: 'songs';
  };
  attributes: {
    title: Attribute.String;
    file: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface SpotifySpotify extends Schema.Component {
  collectionName: 'components_spotify_spotifies';
  info: {
    displayName: 'spotify';
    icon: 'cast';
  };
  attributes: {
    spotifyAlbumId: Attribute.String;
    embedUrl: Attribute.String;
  };
}

export interface YoutubeVideoyoutube extends Schema.Component {
  collectionName: 'components_youtube_videoyoutubes';
  info: {
    displayName: 'videoyoutube';
    icon: 'calendar';
  };
  attributes: {
    videoid: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'album.song': AlbumSong;
      'custom-link-button.custom-link-button': CustomLinkButtonCustomLinkButton;
      'editorial.editorial-item': EditorialEditorialItem;
      'gallery.gallery': GalleryGallery;
      'member.members': MemberMembers;
      'scan-time.scan-time': ScanTimeScanTime;
      'singlesong.singlesong': SinglesongSinglesong;
      'singlevideo.singlevideo': SinglevideoSinglevideo;
      'song.songs': SongSongs;
      'spotify.spotify': SpotifySpotify;
      'youtube.videoyoutube': YoutubeVideoyoutube;
    }
  }
}
