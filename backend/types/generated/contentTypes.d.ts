import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    timezone: Attribute.String;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    isEntryValid: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    qrs: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::qr.qr'
    >;
    albums: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::album.album'
    >;
    events: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::event.event'
    >;
    bands: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::band.band'
    >;
    tours: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::tour.tour'
    >;
    streams: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::stream.stream'
    >;
    socialpages: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::socialpage.socialpage'
    >;
    videos: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::video.video'
    >;
    subscriptionStatus: Attribute.Enumeration<
      [
        'active',
        'trialing',
        'pastDue',
        'canceled',
        'unpaid',
        'past_due',
        'free'
      ]
    > &
      Attribute.DefaultTo<'unpaid'>;
    subscriptionId: Attribute.String;
    customerId: Attribute.String;
    plan: Attribute.String;
    trialEndsAt: Attribute.Date;
    gracePeriodStart: Attribute.Date;
    cancelAt: Attribute.Date;
    pushOptIn: Attribute.Boolean & Attribute.DefaultTo<false>;
    referredByMarketer: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'api::marketer.marketer'
    >;
    marketerCodeUsed: Attribute.String;
    referredAt: Attribute.DateTime;
    isMarketer: Attribute.Boolean & Attribute.DefaultTo<false>;
    editorialShowcaseAccess: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAlbumAlbum extends Schema.CollectionType {
  collectionName: 'albums';
  info: {
    singularName: 'album';
    pluralName: 'albums';
    displayName: 'Album';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    releaseDate: Attribute.Date & Attribute.Required;
    cover: Attribute.Media<'images'>;
    songs: Attribute.Component<'album.song', true>;
    band: Attribute.Relation<'api::album.album', 'manyToOne', 'api::band.band'>;
    users_permissions_user: Attribute.Relation<
      'api::album.album',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    streamingService: Attribute.Enumeration<
      [
        'Spotify',
        'Apple Music',
        'YouTube Music',
        'Amazon Music',
        'Tidal',
        'Deezer'
      ]
    >;
    albumId: Attribute.String;
    albumUrl: Attribute.String;
    embedUrl: Attribute.String;
    isApproved: Attribute.Boolean & Attribute.DefaultTo<true>;
    type: Attribute.String;
    gallery: Attribute.Component<'gallery.gallery', true>;
    biotagline: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::album.album',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::album.album',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiArtistUpdateArtistUpdate extends Schema.CollectionType {
  collectionName: 'artist_updates';
  info: {
    singularName: 'artist-update';
    pluralName: 'artist-updates';
    displayName: 'Artist Update';
    description: 'Published artist photo/gallery updates. Independent of conversation-message.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::artist-update.artist-update',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    createdByUser: Attribute.Relation<
      'api::artist-update.artist-update',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    title: Attribute.String;
    bodyText: Attribute.Text;
    slug: Attribute.String & Attribute.Required;
    contentKind: Attribute.Enumeration<['image', 'gallery']> &
      Attribute.DefaultTo<'image'>;
    media: Attribute.Media<'images', true>;
    visibility: Attribute.Enumeration<
      ['public', 'fan_list', 'show_attendees']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'public'>;
    event: Attribute.Relation<
      'api::artist-update.artist-update',
      'manyToOne',
      'api::event.event'
    >;
    showRecap: Attribute.Relation<
      'api::artist-update.artist-update',
      'manyToOne',
      'api::show-recap.show-recap'
    >;
    campaign: Attribute.Relation<
      'api::artist-update.artist-update',
      'manyToOne',
      'api::message-campaign.message-campaign'
    >;
    status: Attribute.Enumeration<['draft', 'published', 'hidden']> &
      Attribute.Required &
      Attribute.DefaultTo<'draft'>;
    publishedAt: Attribute.DateTime;
    hiddenAt: Attribute.DateTime;
    coverMediaId: Attribute.Integer;
    mediaCaptions: Attribute.JSON;
    galleryVersion: Attribute.Integer & Attribute.DefaultTo<0>;
    publishIdempotencyKey: Attribute.String &
      Attribute.Private &
      Attribute.Unique;
    showOnRockSnaps: Attribute.Boolean & Attribute.DefaultTo<false>;
    rocksnapsPublishedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::artist-update.artist-update',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::artist-update.artist-update',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandBand extends Schema.CollectionType {
  collectionName: 'bands';
  info: {
    singularName: 'band';
    pluralName: 'bands';
    displayName: 'Band';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required & Attribute.Unique;
    genre: Attribute.String & Attribute.Required;
    bio: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 347;
      }>;
    bandImg: Attribute.Media<'images'>;
    members: Attribute.Component<'member.members', true>;
    facebook: Attribute.String;
    instagram: Attribute.String;
    twitch: Attribute.String;
    appleMusic: Attribute.String;
    soundcloud: Attribute.String;
    albums: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::album.album'
    >;
    events: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::event.event'
    >;
    users_permissions_user: Attribute.Relation<
      'api::band.band',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    tours: Attribute.Relation<'api::band.band', 'manyToMany', 'api::tour.tour'>;
    deezer: Attribute.String;
    youtube: Attribute.String;
    bandcamp: Attribute.String;
    videos: Attribute.Relation<
      'api::band.band',
      'manyToMany',
      'api::video.video'
    >;
    twitter: Attribute.String;
    whatsapp: Attribute.String;
    tiktok: Attribute.String;
    media_plays: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::media-play.media-play'
    >;
    singlesong: Attribute.Component<'singlesong.singlesong'>;
    singlevideo: Attribute.Component<'singlevideo.singlevideo'>;
    spotify: Attribute.String;
    snapchat: Attribute.String;
    websitelink: Attribute.String;
    websitelinktext: Attribute.String;
    biotagline: Attribute.String;
    link_clicks: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::link-click.link-click'
    >;
    qrs: Attribute.Relation<'api::band.band', 'oneToMany', 'api::qr.qr'>;
    reverbnation: Attribute.String;
    isBandNameInLogo: Attribute.Boolean & Attribute.DefaultTo<false>;
    slug: Attribute.String & Attribute.Unique;
    externalAccounts: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::band-external-account.band-external-account'
    >;
    externalMetrics: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::band-external-metric.band-external-metric'
    >;
    band_page_views: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::band-page-view.band-page-view'
    >;
    paymentsEnabled: Attribute.Boolean & Attribute.DefaultTo<false>;
    stripeAccountId: Attribute.String;
    stripeOnboardingComplete: Attribute.Boolean & Attribute.DefaultTo<false>;
    paymentButtons: Attribute.JSON;
    merchConcierge: Attribute.JSON;
    hiddenLinks: Attribute.JSON;
    support_moments: Attribute.Relation<
      'api::band.band',
      'oneToMany',
      'api::support-moment.support-moment'
    >;
    layoutConfig: Attribute.JSON;
    layoutVersion: Attribute.Integer & Attribute.DefaultTo<1>;
    pageStyle: Attribute.Enumeration<
      ['default', 'compact', 'bold', 'smartlink']
    > &
      Attribute.DefaultTo<'default'>;
    buttonStyle: Attribute.Enumeration<['classic', 'modern']> &
      Attribute.DefaultTo<'classic'>;
    newReleaseDate: Attribute.Date;
    nowBannerOverride: Attribute.Enumeration<
      [
        'SHOW_TONIGHT',
        'ON_TOUR',
        'NEW_RELEASE',
        'POST_SHOW_THANKS',
        'QUIET_DEFAULT'
      ]
    >;
    youtubeMusic: Attribute.String;
    amazonMusic: Attribute.String;
    tidal: Attribute.String;
    pandora: Attribute.String;
    audiomack: Attribute.String;
    mixcloud: Attribute.String;
    beatport: Attribute.String;
    napster: Attribute.String;
    vimeo: Attribute.String;
    kick: Attribute.String;
    threads: Attribute.String;
    discord: Attribute.String;
    telegram: Attribute.String;
    reddit: Attribute.String;
    pinterest: Attribute.String;
    linkedin: Attribute.String;
    bandsintown: Attribute.String;
    songkick: Attribute.String;
    patreon: Attribute.String;
    jambase: Attribute.String;
    relix: Attribute.String;
    bookingEmail: Attribute.String;
    managementEmail: Attribute.String;
    pressEmail: Attribute.String;
    bookingAgent: Attribute.String;
    labelUrl: Attribute.String;
    officialMerchUrl: Attribute.String;
    labelName: Attribute.String;
    customButtons: Attribute.Component<
      'custom-link-button.custom-link-button',
      true
    >;
    editorialShowcaseEnabled: Attribute.Boolean & Attribute.DefaultTo<false>;
    publicationHeaderImageMode: Attribute.Enumeration<
      ['contain_blur', 'cinematic_cover']
    > &
      Attribute.DefaultTo<'contain_blur'>;
    editorialSectionTitle: Attribute.String;
    editorialArchiveUrl: Attribute.String;
    editorialArchiveLabel: Attribute.String;
    editorialItems: Attribute.Component<'editorial.editorial-item', true>;
    fans: Attribute.Relation<'api::band.band', 'oneToMany', 'api::fan.fan'>;
    fanCaptureEnabled: Attribute.Boolean & Attribute.DefaultTo<true>;
    fanCaptureHeadline: Attribute.String &
      Attribute.DefaultTo<'Join the fan list'>;
    fanCaptureMessage: Attribute.Text &
      Attribute.DefaultTo<'Get first access to merch drops, show announcements, discounted shows, and exclusive updates.'>;
    fanCaptureButtonLabel: Attribute.String &
      Attribute.DefaultTo<'Join Fan List'>;
    fanCaptureSuccessMessage: Attribute.String &
      Attribute.DefaultTo<"You're on the list.">;
    cyberedImagePositionX: Attribute.Integer & Attribute.DefaultTo<50>;
    cyberedImagePositionY: Attribute.Integer & Attribute.DefaultTo<50>;
    cyberedImageZoom: Attribute.Decimal & Attribute.DefaultTo<1>;
    cyberedDesktopPositionX: Attribute.Integer;
    cyberedDesktopPositionY: Attribute.Integer;
    cyberedDesktopZoom: Attribute.Decimal;
    cyberedDesktopFit: Attribute.Enumeration<['fill', 'full']>;
    cyberedMobileFit: Attribute.Enumeration<['fill', 'full']>;
    showModeStatus: Attribute.Enumeration<['off', 'scheduled', 'live']> &
      Attribute.DefaultTo<'off'>;
    showModeEnabled: Attribute.Boolean & Attribute.DefaultTo<false>;
    showModeType: Attribute.Enumeration<['manual', 'event']>;
    showModeStartedAt: Attribute.DateTime;
    showModeEndsAt: Attribute.DateTime;
    showModeActivatedAt: Attribute.DateTime;
    showModeEventId: Attribute.Integer;
    showModeTitle: Attribute.String;
    showModeVenue: Attribute.String;
    showModeCity: Attribute.String;
    showModeRegion: Attribute.String;
    showModeCountry: Attribute.String;
    showModeTimezone: Attribute.String;
    showModeSourceDetail: Attribute.Enumeration<
      [
        'manual_dashboard',
        'event_auto',
        'qr_poster',
        'qr_merch_table',
        'qr_stage_screen',
        'qr_flyer',
        'qr_table_tent',
        'event_page',
        'unknown'
      ]
    > &
      Attribute.DefaultTo<'unknown'>;
    showModeCampaignId: Attribute.String;
    showModeLastCampaignId: Attribute.String;
    showModeMetadata: Attribute.JSON;
    showModeAutoManaged: Attribute.Boolean & Attribute.DefaultTo<false>;
    showModeScheduledStartAt: Attribute.DateTime;
    showModeScheduledEndAt: Attribute.DateTime;
    showModeLastAutoDeactivatedAt: Attribute.DateTime;
    showModeLastManualOverrideAt: Attribute.DateTime;
    showModeEndedAt: Attribute.DateTime;
    showModePerformanceStartsAt: Attribute.DateTime;
    showModePerformanceEndsAt: Attribute.DateTime;
    showModeLastDeactivationReason: Attribute.Enumeration<
      ['manual', 'performance_end', 'safety_expiry', 'auto']
    >;
    showModeLastContext: Attribute.JSON;
    featuredGallery: Attribute.Relation<
      'api::band.band',
      'oneToOne',
      'api::artist-update.artist-update'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::band.band', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::band.band', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiBandExternalAccountBandExternalAccount
  extends Schema.CollectionType {
  collectionName: 'band_external_accounts';
  info: {
    singularName: 'band-external-account';
    pluralName: 'band-external-accounts';
    displayName: 'Band External Account';
    description: 'OAuth / API connection to external platforms (YouTube, Spotify, etc.)';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-external-account.band-external-account',
      'manyToOne',
      'api::band.band'
    >;
    provider: Attribute.Enumeration<
      ['youtube', 'spotify', 'apple', 'tiktok', 'instagram', 'soundcloud']
    > &
      Attribute.Required;
    externalId: Attribute.String;
    displayName: Attribute.String;
    accessToken: Attribute.Text & Attribute.Private;
    refreshToken: Attribute.Text & Attribute.Private;
    expiresAt: Attribute.DateTime;
    lastSyncAt: Attribute.DateTime;
    status: Attribute.String & Attribute.DefaultTo<'connected'>;
    meta: Attribute.JSON;
    channelId: Attribute.String;
    channelTitle: Attribute.String;
    raw: Attribute.JSON;
    syncedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-external-account.band-external-account',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-external-account.band-external-account',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandExternalMetricBandExternalMetric
  extends Schema.CollectionType {
  collectionName: 'band_external_metrics';
  info: {
    singularName: 'band-external-metric';
    pluralName: 'band-external-metrics';
    displayName: 'Band External Metric';
    description: 'Daily external analytics snapshot per band per provider (AI-ready)';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-external-metric.band-external-metric',
      'manyToOne',
      'api::band.band'
    >;
    provider: Attribute.String & Attribute.Required;
    metricDate: Attribute.DateTime;
    kind: Attribute.String;
    date: Attribute.Date & Attribute.Required;
    normalizedData: Attribute.JSON;
    raw: Attribute.JSON;
    syncedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-external-metric.band-external-metric',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-external-metric.band-external-metric',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandInsightDailyBandInsightDaily
  extends Schema.CollectionType {
  collectionName: 'band_insights_daily';
  info: {
    singularName: 'band-insight-daily';
    pluralName: 'band-insights-daily';
    displayName: 'Band Insight (Daily)';
    description: 'Daily rollups for band analytics';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    key: Attribute.String & Attribute.Required & Attribute.Unique;
    date: Attribute.Date & Attribute.Required;
    band: Attribute.Relation<
      'api::band-insight-daily.band-insight-daily',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    pageViews: Attribute.Integer & Attribute.DefaultTo<0>;
    uniqueIps: Attribute.Integer & Attribute.DefaultTo<0>;
    linkClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    songPlays: Attribute.Integer & Attribute.DefaultTo<0>;
    videoPlays: Attribute.Integer & Attribute.DefaultTo<0>;
    deviceDesktop: Attribute.Integer & Attribute.DefaultTo<0>;
    deviceMobile: Attribute.Integer & Attribute.DefaultTo<0>;
    deviceTablet: Attribute.Integer & Attribute.DefaultTo<0>;
    topCities: Attribute.JSON;
    topLinks: Attribute.JSON;
    sources: Attribute.JSON;
    mediums: Attribute.JSON;
    refDomains: Attribute.JSON;
    platforms: Attribute.JSON;
    growthPct: Attribute.Float & Attribute.DefaultTo<0>;
    lastUpdated: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-insight-daily.band-insight-daily',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-insight-daily.band-insight-daily',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandInviteBandInvite extends Schema.CollectionType {
  collectionName: 'band_invites';
  info: {
    singularName: 'band-invite';
    pluralName: 'band-invites';
    displayName: 'Band Invite';
    description: 'Email invitation to join a band team. Token is stored hashed only.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-invite.band-invite',
      'manyToOne',
      'api::band.band'
    >;
    email: Attribute.Email & Attribute.Required;
    role: Attribute.Enumeration<['manager', 'viewer']> & Attribute.Required;
    tokenHash: Attribute.String & Attribute.Private;
    status: Attribute.Enumeration<
      ['pending', 'accepted', 'revoked', 'expired']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'pending'>;
    expiresAt: Attribute.DateTime;
    invitedBy: Attribute.Relation<
      'api::band-invite.band-invite',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    acceptedBy: Attribute.Relation<
      'api::band-invite.band-invite',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    acceptedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-invite.band-invite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-invite.band-invite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandMemberBandMember extends Schema.CollectionType {
  collectionName: 'band_members';
  info: {
    singularName: 'band-member';
    pluralName: 'band-members';
    displayName: 'Band Member';
    description: 'Team membership for a band page (owner / manager / viewer). Page access only \u2014 not equity or company ownership.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-member.band-member',
      'manyToOne',
      'api::band.band'
    >;
    user: Attribute.Relation<
      'api::band-member.band-member',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    role: Attribute.Enumeration<['owner', 'manager', 'viewer']> &
      Attribute.Required;
    status: Attribute.Enumeration<['active', 'removed']> &
      Attribute.Required &
      Attribute.DefaultTo<'active'>;
    invitedBy: Attribute.Relation<
      'api::band-member.band-member',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    acceptedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-member.band-member',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-member.band-member',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandPageViewBandPageView extends Schema.CollectionType {
  collectionName: 'band_page_views';
  info: {
    singularName: 'band-page-view';
    pluralName: 'band-page-views';
    displayName: 'band-page-view';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-page-view.band-page-view',
      'manyToOne',
      'api::band.band'
    >;
    timestamp: Attribute.DateTime;
    title: Attribute.String;
    pageUrl: Attribute.String;
    landingPath: Attribute.String;
    landingQuery: Attribute.Text;
    referrer: Attribute.String;
    refUrl: Attribute.Text;
    refDomain: Attribute.String;
    refSource: Attribute.String;
    refMedium: Attribute.String;
    utmSource: Attribute.String;
    utmMedium: Attribute.String;
    utmCampaign: Attribute.String;
    utmTerm: Attribute.String;
    utmContent: Attribute.String;
    gclid: Attribute.String;
    fbclid: Attribute.String;
    ttclid: Attribute.String;
    twclid: Attribute.String;
    ipAddress: Attribute.String;
    userAgent: Attribute.String;
    path: Attribute.String;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    lat: Attribute.Decimal;
    lon: Attribute.Decimal;
    geoSource: Attribute.Enumeration<
      ['override', 'cloudflare', 'geoip', 'external', 'none']
    >;
    deviceType: Attribute.Enumeration<
      ['desktop', 'mobile', 'tablet', 'bot', 'unknown']
    >;
    os: Attribute.String;
    browser: Attribute.String;
    host: Attribute.String;
    protocol: Attribute.String;
    sessionId: Attribute.String;
    visitorId: Attribute.String;
    pageLoadMs: Attribute.Integer;
    screenW: Attribute.Integer;
    screenH: Attribute.Integer;
    tzOffset: Attribute.Integer;
    lang: Attribute.String;
    fcpMs: Attribute.Integer;
    lcpMs: Attribute.Integer;
    cls: Attribute.Decimal;
    fidMs: Attribute.Integer;
    inpMs: Attribute.Integer;
    botScore: Attribute.Decimal;
    asn: Attribute.String;
    isp: Attribute.String;
    sourceCategory: Attribute.Enumeration<
      ['direct', 'search', 'social', 'referral', 'email', 'ads', 'unknown']
    >;
    sourceType: Attribute.String;
    sourceQR: Attribute.Integer;
    sourceBand: Attribute.Integer;
    sourceLabel: Attribute.String;
    qrScanId: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-page-view.band-page-view',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-page-view.band-page-view',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandShareBandShare extends Schema.CollectionType {
  collectionName: 'band_shares';
  info: {
    singularName: 'band-share';
    pluralName: 'band-shares';
    displayName: 'Band Share';
    description: 'Tracks band share events including shareable cards';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-share.band-share',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    visitorId: Attribute.String;
    sessionId: Attribute.String;
    shareChannel: Attribute.Enumeration<
      [
        'WEB_SHARE',
        'COPY',
        'DOWNLOAD',
        'COPY_LINK',
        'COPY_CAPTION',
        'DOWNLOAD_IMAGE',
        'INSTAGRAM_KIT',
        'FACEBOOK_SHARE',
        'OTHER'
      ]
    >;
    placement: Attribute.Enumeration<
      ['FOOTER', 'FAN_MOMENT_SECTION', 'DASHBOARD', 'DRAWER']
    > &
      Attribute.Required;
    sharedAt: Attribute.DateTime & Attribute.Required;
    shareableId: Attribute.String;
    cardType: Attribute.String;
    window: Attribute.String;
    accent: Attribute.String;
    captionStyle: Attribute.Enumeration<['hype', 'grateful', 'tease']>;
    context: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-share.band-share',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-share.band-share',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBandUiEventBandUiEvent extends Schema.CollectionType {
  collectionName: 'band_ui_events';
  info: {
    singularName: 'band-ui-event';
    pluralName: 'band-ui-events';
    displayName: 'Band UI Event';
    description: 'Anonymous UI interaction events (follow modal, etc.)';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::band-ui-event.band-ui-event',
      'manyToOne',
      'api::band.band'
    >;
    bandSlug: Attribute.String;
    eventName: Attribute.String & Attribute.Required;
    payload: Attribute.JSON;
    timestamp: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::band-ui-event.band-ui-event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::band-ui-event.band-ui-event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConversationConversation extends Schema.CollectionType {
  collectionName: 'conversations';
  info: {
    singularName: 'conversation';
    pluralName: 'conversations';
    displayName: 'Conversation';
    description: 'One band \u2194 verified fan-account Inbox thread. Not a campaign.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::conversation.conversation',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    fanAccountUser: Attribute.Relation<
      'api::conversation.conversation',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    originFan: Attribute.Relation<
      'api::conversation.conversation',
      'manyToOne',
      'api::fan.fan'
    >;
    pairKey: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    status: Attribute.Enumeration<['active', 'closed']> &
      Attribute.Required &
      Attribute.DefaultTo<'active'>;
    originType: Attribute.Enumeration<
      ['artist_direct', 'campaign_reply', 'fan_request']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'artist_direct'>;
    lastMessageAt: Attribute.DateTime;
    lastMessagePreview: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 180;
      }>;
    lastMessageSenderSide: Attribute.Enumeration<['band', 'fan']>;
    lastMessageId: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conversation.conversation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::conversation.conversation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConversationMessageConversationMessage
  extends Schema.CollectionType {
  collectionName: 'conversation_messages';
  info: {
    singularName: 'conversation-message';
    pluralName: 'conversation-messages';
    displayName: 'Conversation Message';
    description: 'Plain-text Inbox message. Independent of email campaigns.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    conversation: Attribute.Relation<
      'api::conversation-message.conversation-message',
      'manyToOne',
      'api::conversation.conversation'
    > &
      Attribute.Required;
    senderParticipant: Attribute.Relation<
      'api::conversation-message.conversation-message',
      'manyToOne',
      'api::conversation-participant.conversation-participant'
    > &
      Attribute.Required;
    senderUser: Attribute.Relation<
      'api::conversation-message.conversation-message',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    senderSide: Attribute.Enumeration<['band', 'fan']> & Attribute.Required;
    bodyText: Attribute.Text;
    attachmentMedia: Attribute.Media<'images'>;
    attachmentGallery: Attribute.Media<'images', true>;
    clientMessageId: Attribute.String;
    idempotencyKey: Attribute.String & Attribute.Private & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conversation-message.conversation-message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::conversation-message.conversation-message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConversationParticipantConversationParticipant
  extends Schema.CollectionType {
  collectionName: 'conversation_participants';
  info: {
    singularName: 'conversation-participant';
    pluralName: 'conversation-participants';
    displayName: 'Conversation Participant';
    description: 'Per-side Inbox state (read/block). One band + one fan per conversation.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    conversation: Attribute.Relation<
      'api::conversation-participant.conversation-participant',
      'manyToOne',
      'api::conversation.conversation'
    > &
      Attribute.Required;
    side: Attribute.Enumeration<['band', 'fan']> & Attribute.Required;
    accountUser: Attribute.Relation<
      'api::conversation-participant.conversation-participant',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    conversationSideKey: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    lastReadAt: Attribute.DateTime;
    lastReadMessageId: Attribute.Integer;
    blockedAt: Attribute.DateTime;
    joinedAt: Attribute.DateTime & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conversation-participant.conversation-participant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::conversation-participant.conversation-participant',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConversationRequestConversationRequest
  extends Schema.CollectionType {
  collectionName: 'conversation_requests';
  info: {
    singularName: 'conversation-request';
    pluralName: 'conversation-requests';
    displayName: 'Conversation Request';
    description: 'Fan-initiated message request gate before a direct conversation.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    requesterUser: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    requesterFan: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'manyToOne',
      'api::fan.fan'
    > &
      Attribute.Required;
    recipientBand: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    requesterType: Attribute.Enumeration<['fan', 'band']> &
      Attribute.Required &
      Attribute.DefaultTo<'fan'>;
    initialMessage: Attribute.Text & Attribute.Required;
    status: Attribute.Enumeration<['pending', 'accepted', 'declined']> &
      Attribute.Required &
      Attribute.DefaultTo<'pending'>;
    pairKey: Attribute.String & Attribute.Required & Attribute.Private;
    pendingPairKey: Attribute.String & Attribute.Private & Attribute.Unique;
    conversation: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'manyToOne',
      'api::conversation.conversation'
    >;
    respondedAt: Attribute.DateTime;
    declinedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::conversation-request.conversation-request',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCreativeCreative extends Schema.CollectionType {
  collectionName: 'creatives';
  info: {
    singularName: 'creative';
    pluralName: 'creatives';
    displayName: 'Creative';
    description: 'Private Creative Studio records: one saved instance of a social template with its frozen artist snapshot.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    title: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    templateId: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    kind: Attribute.Enumeration<['post', 'ad']> &
      Attribute.Required &
      Attribute.DefaultTo<'post'>;
    status: Attribute.Enumeration<['draft', 'ready']> &
      Attribute.Required &
      Attribute.DefaultTo<'draft'>;
    formats: Attribute.JSON;
    primaryFormat: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 16;
      }>;
    variant: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    content: Attribute.JSON;
    snapshot: Attribute.JSON;
    rightsStatus: Attribute.Enumeration<['clear', 'needs_permission']> &
      Attribute.DefaultTo<'clear'>;
    sceneCount: Attribute.Integer & Attribute.DefaultTo<1>;
    bandId: Attribute.Integer;
    bandSlug: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
    artistName: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    ownerEmail: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        maxLength: 254;
      }>;
    owner: Attribute.Relation<
      'api::creative.creative',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::creative.creative',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::creative.creative',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEventEvent extends Schema.CollectionType {
  collectionName: 'events';
  info: {
    singularName: 'event';
    pluralName: 'events';
    displayName: 'Event';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    title: Attribute.String & Attribute.Unique;
    image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    date: Attribute.Date;
    time: Attribute.Time;
    doorsTime: Attribute.Time;
    link: Attribute.String;
    ticketLabel: Attribute.String;
    priceLine: Attribute.String;
    band: Attribute.Relation<'api::event.event', 'manyToOne', 'api::band.band'>;
    contactPhone: Attribute.String;
    contactEmail: Attribute.String;
    ageRestriction: Attribute.String;
    users_permissions_user: Attribute.Relation<
      'api::event.event',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    venue: Attribute.String;
    city: Attribute.String;
    state: Attribute.String;
    address: Attribute.String;
    facebook: Attribute.String;
    twitter: Attribute.String;
    instagram: Attribute.String;
    youtube: Attribute.String;
    tiktok: Attribute.String;
    website: Attribute.String;
    isApproved: Attribute.Boolean & Attribute.DefaultTo<true>;
    description: Attribute.JSON;
    slug: Attribute.String & Attribute.Unique;
    event_page_views: Attribute.Relation<
      'api::event.event',
      'oneToMany',
      'api::event-page-view.event-page-view'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::event.event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::event.event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEventPageViewEventPageView extends Schema.CollectionType {
  collectionName: 'event_page_views';
  info: {
    singularName: 'event-page-view';
    pluralName: 'event-page-views';
    displayName: 'Event Page View';
    description: 'Tracks page views for events with full analytics data';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    event: Attribute.Relation<
      'api::event-page-view.event-page-view',
      'manyToOne',
      'api::event.event'
    >;
    band: Attribute.Relation<
      'api::event-page-view.event-page-view',
      'manyToOne',
      'api::band.band'
    >;
    timestamp: Attribute.DateTime;
    title: Attribute.String;
    pageUrl: Attribute.String;
    landingPath: Attribute.String;
    landingQuery: Attribute.Text;
    referrer: Attribute.String;
    refUrl: Attribute.Text;
    refDomain: Attribute.String;
    refSource: Attribute.String;
    refMedium: Attribute.String;
    utmSource: Attribute.String;
    utmMedium: Attribute.String;
    utmCampaign: Attribute.String;
    utmTerm: Attribute.String;
    utmContent: Attribute.String;
    gclid: Attribute.String;
    fbclid: Attribute.String;
    ttclid: Attribute.String;
    twclid: Attribute.String;
    userAgent: Attribute.String;
    path: Attribute.String;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    lat: Attribute.Decimal;
    lon: Attribute.Decimal;
    geoSource: Attribute.Enumeration<
      ['override', 'cloudflare', 'geoip', 'external', 'none']
    >;
    deviceType: Attribute.Enumeration<
      ['desktop', 'mobile', 'tablet', 'bot', 'unknown']
    >;
    os: Attribute.String;
    browser: Attribute.String;
    host: Attribute.String;
    protocol: Attribute.String;
    sessionId: Attribute.String;
    visitorId: Attribute.String;
    pageLoadMs: Attribute.Integer;
    screenW: Attribute.Integer;
    screenH: Attribute.Integer;
    tzOffset: Attribute.Integer;
    lang: Attribute.String;
    botScore: Attribute.Decimal;
    sourceCategory: Attribute.Enumeration<
      [
        'direct',
        'search',
        'social',
        'referral',
        'email',
        'ads',
        'qr',
        'unknown'
      ]
    >;
    entryType: Attribute.Enumeration<['web', 'qr']> &
      Attribute.DefaultTo<'web'>;
    qrId: Attribute.Integer;
    qrScanId: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::event-page-view.event-page-view',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::event-page-view.event-page-view',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanFan extends Schema.CollectionType {
  collectionName: 'fans';
  info: {
    singularName: 'fan';
    pluralName: 'fans';
    displayName: 'Fan';
    description: 'Fan list entries for bands';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    email: Attribute.String & Attribute.Required;
    firstName: Attribute.String;
    lastName: Attribute.String;
    status: Attribute.Enumeration<['subscribed', 'unsubscribed', 'removed']> &
      Attribute.Required &
      Attribute.DefaultTo<'subscribed'>;
    source: Attribute.Enumeration<
      ['band_page', 'follow_modal', 'import', 'manual', 'show_mode', 'other']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'other'>;
    subscribedAt: Attribute.DateTime & Attribute.Required;
    band: Attribute.Relation<'api::fan.fan', 'manyToOne', 'api::band.band'>;
    visitor: Attribute.Relation<
      'api::fan.fan',
      'manyToOne',
      'api::fan-visitor.fan-visitor'
    >;
    accountUser: Attribute.Relation<
      'api::fan.fan',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    notes: Attribute.Text;
    importBatchId: Attribute.String;
    metadata: Attribute.JSON;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    timezone: Attribute.String;
    firstSeenAt: Attribute.DateTime;
    lastSeenAt: Attribute.DateTime;
    capturedDuringShowMode: Attribute.Boolean & Attribute.DefaultTo<false>;
    capturedAtEventId: Attribute.Integer;
    captureContext: Attribute.Enumeration<
      ['normal', 'show_mode', 'release_mode', 'merch_mode']
    > &
      Attribute.DefaultTo<'normal'>;
    captureSurface: Attribute.Enumeration<
      [
        'band_page',
        'follow_modal',
        'qr_poster',
        'qr_merch_table',
        'qr_stage_screen',
        'qr_flyer',
        'event_page',
        'direct_link',
        'unknown'
      ]
    > &
      Attribute.DefaultTo<'unknown'>;
    captureCampaignId: Attribute.String;
    captureBandPageVariant: Attribute.String;
    consentVersion: Attribute.String;
    consentTextSnapshot: Attribute.Text;
    sourceDetail: Attribute.String;
    checkedInShowCount: Attribute.Integer & Attribute.DefaultTo<0>;
    lastCheckedInAt: Attribute.DateTime;
    demo: Attribute.Boolean & Attribute.DefaultTo<false>;
    canonicalIdentityKey: Attribute.String &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    unsubscribeToken: Attribute.String & Attribute.Private;
    unsubscribedAt: Attribute.DateTime;
    followedAt: Attribute.DateTime;
    unfollowedAt: Attribute.DateTime;
    lastMessagedAt: Attribute.DateTime;
    lastInboxBroadcastAt: Attribute.DateTime;
    suppressionReason: Attribute.Enumeration<
      ['manual', 'bounced', 'complained']
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::fan.fan', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::fan.fan', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiFanAccountLinkFanAccountLink extends Schema.CollectionType {
  collectionName: 'fan_account_links';
  info: {
    singularName: 'fan-account-link';
    pluralName: 'fan-account-links';
    displayName: 'Fan Account Link';
    description: 'One-time hashed magic-link tokens for fan account verification (Lane 1 transactional).';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    email: Attribute.Email & Attribute.Required;
    tokenHash: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    visitorKeyHash: Attribute.String & Attribute.Private;
    status: Attribute.Enumeration<['pending', 'used', 'expired']> &
      Attribute.Required &
      Attribute.DefaultTo<'pending'>;
    expiresAt: Attribute.DateTime & Attribute.Required;
    usedAt: Attribute.DateTime;
    trigger: Attribute.String;
    requestFingerprint: Attribute.String & Attribute.Private;
    returnTo: Attribute.String & Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-account-link.fan-account-link',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-account-link.fan-account-link',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanInteractionFanInteraction extends Schema.CollectionType {
  collectionName: 'fan_interactions';
  info: {
    singularName: 'fan-interaction';
    pluralName: 'fan-interactions';
    displayName: 'Fan Interaction';
    description: 'Tracks fan interactions with bands for analytics and engagement scoring';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    fan: Attribute.Relation<
      'api::fan-interaction.fan-interaction',
      'manyToOne',
      'api::fan.fan'
    >;
    band: Attribute.Relation<
      'api::fan-interaction.fan-interaction',
      'manyToOne',
      'api::band.band'
    >;
    eventId: Attribute.Integer;
    interactionType: Attribute.Enumeration<
      [
        'joined_fan_list',
        'viewed_band_page',
        'viewed_show_mode_page',
        'clicked_spotify',
        'clicked_apple_music',
        'clicked_youtube',
        'clicked_ticket_link',
        'clicked_merch',
        'clicked_share',
        'clicked_follow',
        'clicked_save',
        'played_featured_song',
        'clicked_video',
        'checked_in_show',
        'opened_follow_modal'
      ]
    > &
      Attribute.Required;
    interactionContext: Attribute.Enumeration<
      ['normal', 'show_mode', 'release_mode', 'merch_mode']
    > &
      Attribute.DefaultTo<'normal'>;
    surface: Attribute.Enumeration<
      [
        'band_page',
        'follow_modal',
        'qr_poster',
        'qr_merch_table',
        'qr_stage_screen',
        'qr_flyer',
        'event_page',
        'direct_link',
        'unknown'
      ]
    > &
      Attribute.DefaultTo<'unknown'>;
    timestamp: Attribute.DateTime & Attribute.Required;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    timezone: Attribute.String;
    campaignId: Attribute.String;
    metadata: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-interaction.fan-interaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-interaction.fan-interaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanMomentFanMoment extends Schema.CollectionType {
  collectionName: 'fan_moments';
  info: {
    singularName: 'fan-moment';
    pluralName: 'fan-moments';
    displayName: 'Fan Moment';
    description: 'Shareable fan participation moments';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::fan-moment.fan-moment',
      'manyToOne',
      'api::band.band'
    >;
    visitorId: Attribute.String;
    sessionId: Attribute.String;
    momentType: Attribute.Enumeration<
      [
        'I_WAS_THERE',
        'FUELED_MOMENTUM',
        'PULSE_SURGE',
        'CITY_HEAT',
        'MOMENT_MATTERED',
        'AFTER_SHOW_RECAP'
      ]
    > &
      Attribute.Required;
    actionType: Attribute.Enumeration<
      ['qr_scan', 'follow', 'payment', 'link_click', 'event_view', 'AUTO']
    > &
      Attribute.Required;
    expiresAt: Attribute.DateTime & Attribute.Required;
    context: Attribute.JSON;
    triggerReason: Attribute.String;
    milestone: Attribute.JSON;
    fanPosition: Attribute.Integer;
    shareTitle: Attribute.String;
    shareText: Attribute.Text;
    shareSubtitle: Attribute.String;
    shareEmoji: Attribute.String;
    shareCallToAction: Attribute.String;
    shareImageUrl: Attribute.String;
    sharedAt: Attribute.DateTime;
    shareChannel: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-moment.fan-moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-moment.fan-moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanProfileFanProfile extends Schema.CollectionType {
  collectionName: 'fan_profiles';
  info: {
    singularName: 'fan-profile';
    pluralName: 'fan-profiles';
    displayName: 'Fan Profile';
    description: 'Lightweight global fan layer on a users-permissions identity. Artists may also have a fan profile.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::fan-profile.fan-profile',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    claimedArtistCount: Attribute.Integer & Attribute.DefaultTo<0>;
    lastClaimedAt: Attribute.DateTime;
    displayName: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    firstName: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    lastName: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    avatar: Attribute.Media<'images'>;
    profileCompletedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-profile.fan-profile',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-profile.fan-profile',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanShowAttendanceFanShowAttendance
  extends Schema.CollectionType {
  collectionName: 'fan_show_attendances';
  info: {
    singularName: 'fan-show-attendance';
    pluralName: 'fan-show-attendances';
    displayName: 'Fan Show Attendance';
    description: 'Verified fan attendance records for live shows - foundation for badges and fan passport';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    fan: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'manyToOne',
      'api::fan.fan'
    >;
    band: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'manyToOne',
      'api::band.band'
    >;
    event: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'manyToOne',
      'api::event.event'
    >;
    campaignId: Attribute.String;
    checkedInAt: Attribute.DateTime & Attribute.Required;
    venue: Attribute.String;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    timezone: Attribute.String;
    showTitle: Attribute.String;
    showDate: Attribute.Date;
    verificationLevel: Attribute.Enumeration<
      [
        'self_reported',
        'show_mode_live',
        'event_qr_scan',
        'geo_supported',
        'staff_verified'
      ]
    > &
      Attribute.DefaultTo<'self_reported'>;
    checkInSource: Attribute.Enumeration<
      [
        'show_banner',
        'fan_capture_followup',
        'direct_checkin_button',
        'qr_scan',
        'recap_link',
        'event_page'
      ]
    > &
      Attribute.DefaultTo<'direct_checkin_button'>;
    eventStatus: Attribute.Enumeration<
      ['before_show', 'during_show', 'after_show', 'unknown']
    > &
      Attribute.DefaultTo<'unknown'>;
    showModeSessionId: Attribute.String;
    confidenceScore: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
          max: 100;
        },
        number
      > &
      Attribute.DefaultTo<50>;
    isNewFanAtCheckIn: Attribute.Boolean & Attribute.DefaultTo<false>;
    fanInteraction: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'oneToOne',
      'api::fan-interaction.fan-interaction'
    >;
    campaignIdentityKey: Attribute.String &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    eventIdentityKey: Attribute.String &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    suppressedDuplicate: Attribute.Boolean & Attribute.DefaultTo<false>;
    badgeEligible: Attribute.Boolean & Attribute.DefaultTo<true>;
    badgeIssuedAt: Attribute.DateTime;
    timelineLabel: Attribute.String;
    metadata: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-show-attendance.fan-show-attendance',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFanVisitorFanVisitor extends Schema.CollectionType {
  collectionName: 'fan_visitors';
  info: {
    singularName: 'fan-visitor';
    pluralName: 'fan-visitors';
    displayName: 'Fan Visitor';
    description: 'Anonymous first-party browser identity for fan recognition (hashed opaque token).';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    visitorKeyHash: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    firstSeenAt: Attribute.DateTime & Attribute.Required;
    lastSeenAt: Attribute.DateTime & Attribute.Required;
    visitCount: Attribute.Integer & Attribute.DefaultTo<1>;
    lastPromptAt: Attribute.DateTime;
    lastPromptTrigger: Attribute.String;
    dismissCount: Attribute.Integer & Attribute.DefaultTo<0>;
    fans: Attribute.Relation<
      'api::fan-visitor.fan-visitor',
      'oneToMany',
      'api::fan.fan'
    >;
    accountUser: Attribute.Relation<
      'api::fan-visitor.fan-visitor',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::fan-visitor.fan-visitor',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::fan-visitor.fan-visitor',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFeatureEnrollmentFeatureEnrollment
  extends Schema.CollectionType {
  collectionName: 'feature_enrollments';
  info: {
    singularName: 'feature-enrollment';
    pluralName: 'feature-enrollments';
    displayName: 'Feature Enrollment';
    description: 'Default-deny Labs / Moments feature grants. Not a public API.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    featureKey: Attribute.String & Attribute.Required;
    subjectType: Attribute.Enumeration<['user', 'band', 'cohort', 'platform']> &
      Attribute.Required;
    subjectId: Attribute.String & Attribute.Required;
    status: Attribute.Enumeration<['enabled', 'disabled']> &
      Attribute.Required &
      Attribute.DefaultTo<'enabled'>;
    startsAt: Attribute.DateTime;
    endsAt: Attribute.DateTime;
    grantedBy: Attribute.String;
    cohort: Attribute.String;
    metadata: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::feature-enrollment.feature-enrollment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::feature-enrollment.feature-enrollment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFuntestFuntest extends Schema.CollectionType {
  collectionName: 'funtests';
  info: {
    singularName: 'funtest';
    pluralName: 'funtests';
    displayName: 'funtest';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    testingsomething: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::funtest.funtest',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::funtest.funtest',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiGalleryDraftGalleryDraft extends Schema.CollectionType {
  collectionName: 'gallery_drafts';
  info: {
    singularName: 'gallery-draft';
    pluralName: 'gallery-drafts';
    displayName: 'Gallery Draft';
    description: 'Server-side durable gallery upload session. Staging only \u2014 artist-update stays the published truth.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    sessionId: Attribute.String & Attribute.Required & Attribute.Unique;
    band: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    createdByUser: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    kind: Attribute.Enumeration<['show', 'general']> &
      Attribute.DefaultTo<'general'>;
    mode: Attribute.Enumeration<['create', 'edit']> &
      Attribute.DefaultTo<'create'>;
    editingUpdate: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'api::artist-update.artist-update'
    >;
    event: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'api::event.event'
    >;
    showRecap: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'api::show-recap.show-recap'
    >;
    visibility: Attribute.Enumeration<
      ['public', 'fan_list', 'show_attendees']
    > &
      Attribute.DefaultTo<'public'>;
    audienceLocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    title: Attribute.String;
    caption: Attribute.Text;
    mediaOrder: Attribute.JSON;
    mediaCaptions: Attribute.JSON;
    coverMediaId: Attribute.Integer;
    status: Attribute.Enumeration<['active', 'published', 'discarded']> &
      Attribute.DefaultTo<'active'>;
    publishedUpdate: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'manyToOne',
      'api::artist-update.artist-update'
    >;
    returnContext: Attribute.JSON;
    lastActivityAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::gallery-draft.gallery-draft',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiHowtovideoHowtovideo extends Schema.CollectionType {
  collectionName: 'howtovideos';
  info: {
    singularName: 'howtovideo';
    pluralName: 'howtovideos';
    displayName: 'HowToVideo';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    Title: Attribute.String;
    slug: Attribute.UID<'api::howtovideo.howtovideo', 'Title'>;
    YouTubeID: Attribute.String;
    Thumbnail: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    Description: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::howtovideo.howtovideo',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::howtovideo.howtovideo',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiImageProxyImageProxy extends Schema.SingleType {
  collectionName: 'image_proxies';
  info: {
    singularName: 'image-proxy';
    pluralName: 'image-proxies';
    displayName: 'Image Proxy';
    description: 'Virtual content type for image proxy endpoint';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::image-proxy.image-proxy',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::image-proxy.image-proxy',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLinkClickLinkClick extends Schema.CollectionType {
  collectionName: 'link_clicks';
  info: {
    singularName: 'link-click';
    pluralName: 'link-clicks';
    displayName: 'link-click';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    band: Attribute.Relation<
      'api::link-click.link-click',
      'manyToOne',
      'api::band.band'
    >;
    platform: Attribute.String;
    clickCount: Attribute.Integer & Attribute.DefaultTo<0>;
    timestamp: Attribute.DateTime;
    linkUrl: Attribute.String;
    linkLabel: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::link-click.link-click',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::link-click.link-click',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMarketerMarketer extends Schema.CollectionType {
  collectionName: 'marketers';
  info: {
    singularName: 'marketer';
    pluralName: 'marketers';
    displayName: 'Marketer';
    description: 'Marketing partners for referral attribution';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    slug: Attribute.UID<'api::marketer.marketer', 'name'>;
    email: Attribute.Email & Attribute.Required;
    commissionPercent: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
          max: 100;
        },
        number
      > &
      Attribute.DefaultTo<10>;
    isActive: Attribute.Boolean & Attribute.DefaultTo<true>;
    code: Attribute.String & Attribute.Required & Attribute.Unique;
    referredUsers: Attribute.Relation<
      'api::marketer.marketer',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    totalClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    clicksToday: Attribute.Integer & Attribute.DefaultTo<0>;
    lastClickDate: Attribute.Date;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::marketer.marketer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::marketer.marketer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMediaPlayMediaPlay extends Schema.CollectionType {
  collectionName: 'media_plays';
  info: {
    singularName: 'media-play';
    pluralName: 'media-plays';
    displayName: 'Media Play';
    description: 'Tracks each time a user plays the featured song or video';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::media-play.media-play',
      'manyToOne',
      'api::band.band'
    >;
    mediaType: Attribute.Enumeration<['song', 'video']> & Attribute.Required;
    title: Attribute.String & Attribute.Required;
    timestamp: Attribute.DateTime;
    mediaTitle: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::media-play.media-play',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::media-play.media-play',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMerchOrderMerchOrder extends Schema.CollectionType {
  collectionName: 'merch_orders';
  info: {
    singularName: 'merch-order';
    pluralName: 'merch-orders';
    displayName: 'Merch Order';
    description: 'Merch Concierge orders';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::merch-order.merch-order',
      'manyToOne',
      'api::band.band'
    >;
    orderCode: Attribute.String & Attribute.Required & Attribute.Unique;
    status: Attribute.Enumeration<
      ['pending', 'paid', 'refund_pending', 'refunded', 'failed']
    > &
      Attribute.DefaultTo<'pending'>;
    bandNameSnapshot: Attribute.String;
    bandSlugSnapshot: Attribute.String;
    itemSlotIndex: Attribute.Integer & Attribute.Required;
    itemTitleSnapshot: Attribute.String;
    selectedSize: Attribute.String;
    quantity: Attribute.Integer & Attribute.DefaultTo<1>;
    priceCentsSnapshot: Attribute.Integer;
    pickupInstructionsSnapshot: Attribute.Text;
    customerName: Attribute.String;
    customerEmail: Attribute.String;
    stripeCheckoutSessionId: Attribute.String;
    stripePaymentIntentId: Attribute.String;
    stripeChargeId: Attribute.String;
    paidAt: Attribute.DateTime;
    refundedAt: Attribute.DateTime;
    errorMessage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::merch-order.merch-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::merch-order.merch-order',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMessageCampaignMessageCampaign
  extends Schema.CollectionType {
  collectionName: 'message_campaigns';
  info: {
    singularName: 'message-campaign';
    pluralName: 'message-campaigns';
    displayName: 'Message Campaign';
    description: 'Faneqo broadcast/campaign foundation (Message the Room, Fan List, future announcements).';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'manyToOne',
      'api::band.band'
    >;
    createdByUser: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    showRecap: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'manyToOne',
      'api::show-recap.show-recap'
    >;
    artistUpdate: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'manyToOne',
      'api::artist-update.artist-update'
    >;
    name: Attribute.String;
    subject: Attribute.String & Attribute.Required;
    bodyHtml: Attribute.Text;
    bodyText: Attribute.Text & Attribute.Required;
    audienceType: Attribute.Enumeration<['show_attendees', 'all_fans']> &
      Attribute.Required;
    audienceReference: Attribute.String;
    audienceConfig: Attribute.JSON;
    channel: Attribute.Enumeration<['email', 'in_app']> &
      Attribute.Required &
      Attribute.DefaultTo<'email'>;
    status: Attribute.Enumeration<
      [
        'draft',
        'queued',
        'sending',
        'completed',
        'partially_failed',
        'failed',
        'canceled'
      ]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'draft'>;
    recipientCount: Attribute.Integer & Attribute.DefaultTo<0>;
    sentCount: Attribute.Integer & Attribute.DefaultTo<0>;
    deliveredCount: Attribute.Integer & Attribute.DefaultTo<0>;
    failedCount: Attribute.Integer & Attribute.DefaultTo<0>;
    suppressedCount: Attribute.Integer & Attribute.DefaultTo<0>;
    bouncedCount: Attribute.Integer & Attribute.DefaultTo<0>;
    skippedCount: Attribute.Integer & Attribute.DefaultTo<0>;
    replyTo: Attribute.Email;
    queuedAt: Attribute.DateTime;
    startedAt: Attribute.DateTime;
    completedAt: Attribute.DateTime;
    workerLockAt: Attribute.DateTime;
    workerLockToken: Attribute.String & Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::message-campaign.message-campaign',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMessageRecipientMessageRecipient
  extends Schema.CollectionType {
  collectionName: 'message_recipients';
  info: {
    singularName: 'message-recipient';
    pluralName: 'message-recipients';
    displayName: 'Message Recipient';
    description: 'Immutable audience snapshot row for a message campaign. Fan relation is identity; email is delivery snapshot.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    campaign: Attribute.Relation<
      'api::message-recipient.message-recipient',
      'manyToOne',
      'api::message-campaign.message-campaign'
    >;
    fan: Attribute.Relation<
      'api::message-recipient.message-recipient',
      'manyToOne',
      'api::fan.fan'
    >;
    band: Attribute.Relation<
      'api::message-recipient.message-recipient',
      'manyToOne',
      'api::band.band'
    >;
    email: Attribute.Email;
    firstName: Attribute.String;
    channel: Attribute.Enumeration<['email', 'in_app']> &
      Attribute.Required &
      Attribute.DefaultTo<'email'>;
    provider: Attribute.Enumeration<['resend', 'faneqo_inbox']> &
      Attribute.DefaultTo<'resend'>;
    status: Attribute.Enumeration<
      [
        'pending',
        'sending',
        'sent',
        'delivered',
        'failed',
        'suppressed',
        'bounced',
        'canceled'
      ]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'pending'>;
    queuedAt: Attribute.DateTime;
    sentAt: Attribute.DateTime;
    deliveredAt: Attribute.DateTime;
    failedAt: Attribute.DateTime;
    suppressedAt: Attribute.DateTime;
    bouncedAt: Attribute.DateTime;
    openedAt: Attribute.DateTime;
    clickedAt: Attribute.DateTime;
    failureReason: Attribute.String;
    failureCode: Attribute.String;
    providerMessageId: Attribute.String;
    attemptCount: Attribute.Integer & Attribute.DefaultTo<0>;
    idempotencyKey: Attribute.String & Attribute.Private;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::message-recipient.message-recipient',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::message-recipient.message-recipient',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMilestoneMilestone extends Schema.CollectionType {
  collectionName: 'milestones';
  info: {
    singularName: 'milestone';
    pluralName: 'milestones';
    displayName: 'Milestone';
    description: 'Durable semantic interpretation that a relationship crossed a meaningful threshold. Canonical domain rows remain truth. Do not store presentation copy.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    type: Attribute.String & Attribute.Required;
    value: Attribute.Integer;
    evidence: Attribute.JSON & Attribute.Required;
    occurredAt: Attribute.DateTime & Attribute.Required;
    version: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<1>;
    status: Attribute.Enumeration<['active', 'archived']> &
      Attribute.Required &
      Attribute.DefaultTo<'active'>;
    band: Attribute.Relation<
      'api::milestone.milestone',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    subjectFan: Attribute.Relation<
      'api::milestone.milestone',
      'manyToOne',
      'api::fan.fan'
    >;
    idempotencyKey: Attribute.String & Attribute.Required & Attribute.Unique;
    archivedAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::milestone.milestone',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::milestone.milestone',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMomentMoment extends Schema.CollectionType {
  collectionName: 'moments';
  info: {
    singularName: 'moment';
    pluralName: 'moments';
    displayName: 'Moment';
    description: 'Thin derived index of meaningful artist\u2013fan occurrences. Canonical domain rows remain truth. Do not store presentation copy or media.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    kind: Attribute.Enumeration<
      [
        'show',
        'artist_update',
        'milestone',
        'release',
        'artist_growth',
        'city_growth',
        'fan_relationship',
        'support',
        'tour',
        'period_recap',
        'manual',
        'fan_memory'
      ]
    > &
      Attribute.Required;
    status: Attribute.Enumeration<['candidate', 'published', 'archived']> &
      Attribute.Required &
      Attribute.DefaultTo<'candidate'>;
    visibility: Attribute.Enumeration<
      [
        'artist_fan',
        'artist_only',
        'fan_only',
        'show_attendees',
        'fan_list',
        'public'
      ]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'artist_fan'>;
    band: Attribute.Relation<
      'api::moment.moment',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    subjectFan: Attribute.Relation<
      'api::moment.moment',
      'manyToOne',
      'api::fan.fan'
    >;
    occurredAt: Attribute.DateTime & Attribute.Required;
    createdByType: Attribute.Enumeration<
      ['system', 'artist_user', 'fan_user']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'system'>;
    createdByUserId: Attribute.Integer;
    sourceType: Attribute.String & Attribute.Required;
    sourceId: Attribute.String & Attribute.Required;
    idempotencyKey: Attribute.String & Attribute.Required & Attribute.Unique;
    shareable: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    publishedAt: Attribute.DateTime;
    archivedAt: Attribute.DateTime;
    schemaVersion: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::moment.moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::moment.moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNightRecordingNightRecording extends Schema.CollectionType {
  collectionName: 'night_recordings';
  info: {
    singularName: 'night-recording';
    pluralName: 'night-recordings';
    displayName: 'Night Recording';
    description: 'Artist-authored audio/video belonging to one ShowRecap Night. Not Gallery media.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::night-recording.night-recording',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    showRecap: Attribute.Relation<
      'api::night-recording.night-recording',
      'manyToOne',
      'api::show-recap.show-recap'
    > &
      Attribute.Required;
    createdByUser: Attribute.Relation<
      'api::night-recording.night-recording',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    title: Attribute.String;
    caption: Attribute.Text;
    kind: Attribute.Enumeration<['audio', 'video']> & Attribute.Required;
    source: Attribute.Enumeration<
      ['upload', 'youtube', 'spotify', 'external']
    > &
      Attribute.Required;
    providerUrl: Attribute.String;
    providerType: Attribute.String;
    providerResourceType: Attribute.String;
    providerResourceId: Attribute.String;
    uploadedMedia: Attribute.Media<'audios' | 'videos'>;
    posterImage: Attribute.Media<'images'>;
    durationSeconds: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    sortOrder: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<0>;
    visibility: Attribute.Enumeration<
      ['public', 'fan_list', 'show_attendees']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'public'>;
    status: Attribute.Enumeration<['draft', 'published']> &
      Attribute.Required &
      Attribute.DefaultTo<'draft'>;
    publishedAt: Attribute.DateTime;
    createIdempotencyKey: Attribute.String &
      Attribute.Private &
      Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::night-recording.night-recording',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::night-recording.night-recording',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNotificationNotification extends Schema.CollectionType {
  collectionName: 'notifications';
  info: {
    singularName: 'notification';
    pluralName: 'notifications';
    displayName: 'Notification';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::notification.notification',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    band: Attribute.Relation<
      'api::notification.notification',
      'manyToOne',
      'api::band.band'
    >;
    type: Attribute.Enumeration<['pulse_surge']> & Attribute.Required;
    channel: Attribute.Enumeration<['in_app', 'push_candidate']> &
      Attribute.Required;
    title: Attribute.String & Attribute.Required;
    message: Attribute.Text & Attribute.Required;
    deepLink: Attribute.String & Attribute.DefaultTo<'/dashboard'>;
    severity: Attribute.Enumeration<['info']> & Attribute.DefaultTo<'info'>;
    readAt: Attribute.DateTime;
    meta: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::notification.notification',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::notification.notification',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPassportGallerySavePassportGallerySave
  extends Schema.CollectionType {
  collectionName: 'passport_gallery_saves';
  info: {
    singularName: 'passport-gallery-save';
    pluralName: 'passport-gallery-saves';
    displayName: 'Passport Gallery Save';
    description: 'A fan-owned reference to an accessible Artist Update gallery. Media is never copied.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accountUser: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
    artistUpdate: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'manyToOne',
      'api::artist-update.artist-update'
    > &
      Attribute.Required;
    band: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    event: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'manyToOne',
      'api::event.event'
    >;
    showRecap: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'manyToOne',
      'api::show-recap.show-recap'
    >;
    savedAt: Attribute.DateTime & Attribute.Required;
    saveKey: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::passport-gallery-save.passport-gallery-save',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPulseSnapshotPulseSnapshot extends Schema.CollectionType {
  collectionName: 'pulse_snapshots';
  info: {
    singularName: 'pulse-snapshot';
    pluralName: 'pulse-snapshots';
    displayName: 'Pulse Snapshot';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::pulse-snapshot.pulse-snapshot',
      'manyToOne',
      'api::band.band'
    >;
    rangeKey: Attribute.String & Attribute.Required;
    pulseScore: Attribute.Integer & Attribute.Required;
    momentumState: Attribute.String & Attribute.Required;
    totalActivity: Attribute.Integer & Attribute.DefaultTo<0>;
    growthPct: Attribute.Float & Attribute.DefaultTo<0>;
    absoluteIncrease: Attribute.Integer & Attribute.DefaultTo<0>;
    computedAt: Attribute.DateTime & Attribute.Required;
    drivers: Attribute.JSON;
    lastMomentumChangeAt: Attribute.DateTime;
    surgePushSent: Attribute.Boolean & Attribute.DefaultTo<false>;
    lastSurgePushAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pulse-snapshot.pulse-snapshot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::pulse-snapshot.pulse-snapshot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPushDevicePushDevice extends Schema.CollectionType {
  collectionName: 'push_devices';
  info: {
    singularName: 'push-device';
    pluralName: 'push-devices';
    displayName: 'Push Device';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    user: Attribute.Relation<
      'api::push-device.push-device',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    token: Attribute.String & Attribute.Required & Attribute.Unique;
    platform: Attribute.Enumeration<['web', 'ios', 'android']> &
      Attribute.Required;
    enabled: Attribute.Boolean & Attribute.DefaultTo<true>;
    lastSeenAt: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::push-device.push-device',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::push-device.push-device',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiQrQr extends Schema.CollectionType {
  collectionName: 'qrs';
  info: {
    singularName: 'qr';
    pluralName: 'qrs';
    displayName: 'Qr';
    description: '';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    q_image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    url: Attribute.String;
    q_type: Attribute.String;
    band: Attribute.Relation<'api::qr.qr', 'manyToOne', 'api::band.band'>;
    users_permissions_user: Attribute.Relation<
      'api::qr.qr',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    link: Attribute.String;
    name: Attribute.String;
    scanTime: Attribute.Component<'scan-time.scan-time', true>;
    options: Attribute.JSON;
    album: Attribute.Relation<'api::qr.qr', 'oneToOne', 'api::album.album'>;
    event: Attribute.Relation<'api::qr.qr', 'oneToOne', 'api::event.event'>;
    tour: Attribute.Relation<'api::qr.qr', 'oneToOne', 'api::tour.tour'>;
    scans: Attribute.Relation<'api::qr.qr', 'oneToMany', 'api::scan.scan'>;
    slugId: Attribute.String;
    arEnabled: Attribute.Boolean & Attribute.DefaultTo<false>;
    template: Attribute.Enumeration<['video', 'song', 'event', 'test']> &
      Attribute.DefaultTo<'video'>;
    videoId: Attribute.String;
    songUrl: Attribute.String;
    eventPosterUrl: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::qr.qr', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::qr.qr', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiRelationshipEventRelationshipEvent
  extends Schema.CollectionType {
  collectionName: 'relationship_events';
  info: {
    singularName: 'relationship-event';
    pluralName: 'relationship-events';
    displayName: 'Relationship Event';
    description: 'Thin durable ledger of meaningful artist\u2013fan facts. Canonical objects remain source of truth.';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    type: Attribute.String & Attribute.Required;
    band: Attribute.Relation<
      'api::relationship-event.relationship-event',
      'manyToOne',
      'api::band.band'
    > &
      Attribute.Required;
    fan: Attribute.Relation<
      'api::relationship-event.relationship-event',
      'manyToOne',
      'api::fan.fan'
    >;
    occurredAt: Attribute.DateTime & Attribute.Required;
    sourceType: Attribute.String & Attribute.Required;
    sourceId: Attribute.String & Attribute.Required;
    idempotencyKey: Attribute.String & Attribute.Required & Attribute.Unique;
    metadata: Attribute.JSON;
    visibility: Attribute.Enumeration<
      ['artist_fan', 'fan_only', 'artist_only', 'derived_from_source']
    > &
      Attribute.Required &
      Attribute.DefaultTo<'artist_fan'>;
    schemaVersion: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::relationship-event.relationship-event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::relationship-event.relationship-event',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiScanScan extends Schema.CollectionType {
  collectionName: 'scans';
  info: {
    singularName: 'scan';
    pluralName: 'scans';
    displayName: 'Scan';
    description: 'QR code scan tracking with full analytics context';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    date: Attribute.DateTime;
    custom: Attribute.JSON;
    qr: Attribute.Relation<'api::scan.scan', 'manyToOne', 'api::qr.qr'>;
    band: Attribute.Relation<'api::scan.scan', 'manyToOne', 'api::band.band'>;
    event: Attribute.Relation<
      'api::scan.scan',
      'manyToOne',
      'api::event.event'
    >;
    entryType: Attribute.Enumeration<['qr', 'web']> & Attribute.DefaultTo<'qr'>;
    country: Attribute.String;
    region: Attribute.String;
    city: Attribute.String;
    lat: Attribute.Float;
    lon: Attribute.Float;
    geoSource: Attribute.Enumeration<['cloudflare', 'none', 'other']> &
      Attribute.DefaultTo<'none'>;
    userAgent: Attribute.Text;
    deviceType: Attribute.Enumeration<
      ['desktop', 'mobile', 'tablet', 'unknown']
    > &
      Attribute.DefaultTo<'unknown'>;
    os: Attribute.String;
    browser: Attribute.String;
    screenW: Attribute.Integer;
    screenH: Attribute.Integer;
    lang: Attribute.String;
    tzOffset: Attribute.Integer;
    referrer: Attribute.Text;
    refDomain: Attribute.String;
    refSource: Attribute.String;
    refMedium: Attribute.String;
    utmSource: Attribute.String;
    utmMedium: Attribute.String;
    utmCampaign: Attribute.String;
    utmTerm: Attribute.String;
    utmContent: Attribute.String;
    gclid: Attribute.String;
    fbclid: Attribute.String;
    ttclid: Attribute.String;
    twclid: Attribute.String;
    sessionId: Attribute.String;
    visitorId: Attribute.String;
    isBot: Attribute.Boolean & Attribute.DefaultTo<false>;
    botScore: Attribute.Float;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::scan.scan', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::scan.scan', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiSeoPageSeoPage extends Schema.CollectionType {
  collectionName: 'seo_pages';
  info: {
    singularName: 'seo-page';
    pluralName: 'seo-pages';
    displayName: 'seo-page';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Attribute.String;
    slug: Attribute.UID<'api::seo-page.seo-page', 'title'>;
    metaTitle: Attribute.String;
    metaDescription: Attribute.String;
    ogImage: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    content: Attribute.RichText;
    featured: Attribute.Boolean;
    keywords: Attribute.String;
    category: Attribute.Enumeration<
      [
        'qr-code-strategy',
        'smart-links',
        'fan-funnels',
        'touring-events',
        'music-marketing',
        'merch-growth',
        'analytics',
        'case-studies'
      ]
    >;
    jsonLd: Attribute.JSON;
    isPillar: Attribute.Boolean;
    executiveSummary: Attribute.RichText;
    executiveSummaryTakeaways: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::seo-page.seo-page',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::seo-page.seo-page',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiShowRecapShowRecap extends Schema.CollectionType {
  collectionName: 'show_recaps';
  info: {
    singularName: 'show-recap';
    pluralName: 'show-recaps';
    displayName: 'Show Recap';
    description: 'Post-show recap of fan growth and engagement metrics';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    band: Attribute.Relation<
      'api::show-recap.show-recap',
      'manyToOne',
      'api::band.band'
    >;
    eventId: Attribute.Integer;
    campaignId: Attribute.String & Attribute.Required;
    showTitle: Attribute.String;
    venue: Attribute.String;
    city: Attribute.String;
    region: Attribute.String;
    country: Attribute.String;
    timezone: Attribute.String;
    showModeType: Attribute.Enumeration<['manual', 'event']> &
      Attribute.DefaultTo<'manual'>;
    showStartedAt: Attribute.DateTime;
    showEndedAt: Attribute.DateTime;
    performanceStartsAt: Attribute.DateTime;
    performanceEndsAt: Attribute.DateTime;
    recapGeneratedAt: Attribute.DateTime & Attribute.Required;
    fansCaptured: Attribute.Integer & Attribute.DefaultTo<0>;
    fansCapturedDuringShowMode: Attribute.Integer & Attribute.DefaultTo<0>;
    topCaptureSurface: Attribute.String;
    topCaptureSurfaceCount: Attribute.Integer & Attribute.DefaultTo<0>;
    topCity: Attribute.String;
    topCityCount: Attribute.Integer & Attribute.DefaultTo<0>;
    spotifyClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    appleMusicClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    youtubeClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    ticketClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    merchClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    shareClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    followClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    saveClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    featuredSongPlays: Attribute.Integer & Attribute.DefaultTo<0>;
    videoClicks: Attribute.Integer & Attribute.DefaultTo<0>;
    checkedInShowCount: Attribute.Integer & Attribute.DefaultTo<0>;
    averageEngagementScore: Attribute.Decimal & Attribute.DefaultTo<0>;
    superfanSignalCount: Attribute.Integer & Attribute.DefaultTo<0>;
    engagedFanCount: Attribute.Integer & Attribute.DefaultTo<0>;
    warmFanCount: Attribute.Integer & Attribute.DefaultTo<0>;
    newFanCount: Attribute.Integer & Attribute.DefaultTo<0>;
    interactionCount: Attribute.Integer & Attribute.DefaultTo<0>;
    captureSurfaceBreakdown: Attribute.JSON;
    cityBreakdown: Attribute.JSON;
    interactionBreakdown: Attribute.JSON;
    messagesSentCount: Attribute.Integer & Attribute.DefaultTo<0>;
    lastMessageSentAt: Attribute.DateTime;
    lastMessageRecipientCount: Attribute.Integer & Attribute.DefaultTo<0>;
    metadata: Attribute.JSON;
    publicStory: Attribute.Text;
    privateArtistNote: Attribute.Text;
    lineup: Attribute.JSON;
    nightSlug: Attribute.String;
    coverImage: Attribute.Media<'images'>;
    heroImage: Attribute.Media<'images'>;
    heroFocalX: Attribute.Decimal;
    heroFocalY: Attribute.Decimal;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::show-recap.show-recap',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::show-recap.show-recap',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSocialpageSocialpage extends Schema.CollectionType {
  collectionName: 'socialpages';
  info: {
    singularName: 'socialpage';
    pluralName: 'socialpages';
    displayName: 'socialpage';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    facebook: Attribute.String;
    snapchat: Attribute.String;
    whatsapp: Attribute.String;
    twitch: Attribute.String;
    tictok: Attribute.String;
    img: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Attribute.String;
    users_permissions_user: Attribute.Relation<
      'api::socialpage.socialpage',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    band: Attribute.Relation<
      'api::socialpage.socialpage',
      'oneToOne',
      'api::band.band'
    >;
    instagram: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::socialpage.socialpage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::socialpage.socialpage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiStreamStream extends Schema.CollectionType {
  collectionName: 'streams';
  info: {
    singularName: 'stream';
    pluralName: 'streams';
    displayName: 'stream';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    applemusic: Attribute.String;
    spotify: Attribute.String;
    soundcloud: Attribute.String;
    youtubemusic: Attribute.String;
    users_permissions_user: Attribute.Relation<
      'api::stream.stream',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    img: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    bandTitle: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::stream.stream',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::stream.stream',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSupportMomentSupportMoment extends Schema.CollectionType {
  collectionName: 'support_moments';
  info: {
    singularName: 'support-moment';
    pluralName: 'support-moments';
    displayName: 'Support Moment';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    band: Attribute.Relation<
      'api::support-moment.support-moment',
      'manyToOne',
      'api::band.band'
    >;
    bandNameSnapshot: Attribute.String;
    bandSlugSnapshot: Attribute.String;
    bandImageSnapshot: Attribute.String;
    buttonKey: Attribute.String;
    supportLabel: Attribute.String;
    badgeId: Attribute.String;
    amount: Attribute.Integer;
    currency: Attribute.String;
    status: Attribute.Enumeration<['pending', 'paid', 'failed', 'refunded']> &
      Attribute.DefaultTo<'pending'>;
    paidAt: Attribute.DateTime;
    stripeCheckoutSessionId: Attribute.String;
    stripePaymentIntentId: Attribute.String;
    stripeChargeId: Attribute.String;
    fanDisplayName: Attribute.String;
    fanHandle: Attribute.String;
    fanMessage: Attribute.String;
    fanEmail: Attribute.String;
    shareOptIn: Attribute.Boolean & Attribute.DefaultTo<false>;
    showAmountOnShare: Attribute.Boolean & Attribute.DefaultTo<false>;
    supporterWallOptIn: Attribute.Boolean & Attribute.DefaultTo<false>;
    source: Attribute.String & Attribute.DefaultTo<'band-profile'>;
    qrId: Attribute.String;
    eventId: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::support-moment.support-moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::support-moment.support-moment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSystemKvSystemKv extends Schema.CollectionType {
  collectionName: 'system_kvs';
  info: {
    singularName: 'system-kv';
    pluralName: 'system-kvs';
    displayName: 'System KV';
    description: 'Key-value store for system timestamps and metadata';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    key: Attribute.String & Attribute.Required & Attribute.Unique;
    value: Attribute.JSON;
    band: Attribute.Relation<
      'api::system-kv.system-kv',
      'manyToOne',
      'api::band.band'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::system-kv.system-kv',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::system-kv.system-kv',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTourTour extends Schema.CollectionType {
  collectionName: 'tours';
  info: {
    singularName: 'tour';
    pluralName: 'tours';
    displayName: 'tour';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Attribute.String;
    startDate: Attribute.Date;
    endDate: Attribute.Date;
    events: Attribute.Relation<
      'api::tour.tour',
      'oneToMany',
      'api::event.event'
    >;
    bands: Attribute.Relation<'api::tour.tour', 'manyToMany', 'api::band.band'>;
    users_permissions_user: Attribute.Relation<
      'api::tour.tour',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    image: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    description: Attribute.Text;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::tour.tour', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::tour.tour', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiVideoVideo extends Schema.CollectionType {
  collectionName: 'videos';
  info: {
    singularName: 'video';
    pluralName: 'videos';
    displayName: 'video';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    users_permissions_users: Attribute.Relation<
      'api::video.video',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    mediayoutube: Attribute.Component<'youtube.videoyoutube', true>;
    bandImg: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    bandlink: Attribute.String;
    bandname: Attribute.String;
    title: Attribute.String;
    bands: Attribute.Relation<
      'api::video.video',
      'manyToMany',
      'api::band.band'
    >;
    isApproved: Attribute.Boolean & Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::video.video',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::video.video',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'plugin::i18n.locale': PluginI18NLocale;
      'api::album.album': ApiAlbumAlbum;
      'api::artist-update.artist-update': ApiArtistUpdateArtistUpdate;
      'api::band.band': ApiBandBand;
      'api::band-external-account.band-external-account': ApiBandExternalAccountBandExternalAccount;
      'api::band-external-metric.band-external-metric': ApiBandExternalMetricBandExternalMetric;
      'api::band-insight-daily.band-insight-daily': ApiBandInsightDailyBandInsightDaily;
      'api::band-invite.band-invite': ApiBandInviteBandInvite;
      'api::band-member.band-member': ApiBandMemberBandMember;
      'api::band-page-view.band-page-view': ApiBandPageViewBandPageView;
      'api::band-share.band-share': ApiBandShareBandShare;
      'api::band-ui-event.band-ui-event': ApiBandUiEventBandUiEvent;
      'api::conversation.conversation': ApiConversationConversation;
      'api::conversation-message.conversation-message': ApiConversationMessageConversationMessage;
      'api::conversation-participant.conversation-participant': ApiConversationParticipantConversationParticipant;
      'api::conversation-request.conversation-request': ApiConversationRequestConversationRequest;
      'api::creative.creative': ApiCreativeCreative;
      'api::event.event': ApiEventEvent;
      'api::event-page-view.event-page-view': ApiEventPageViewEventPageView;
      'api::fan.fan': ApiFanFan;
      'api::fan-account-link.fan-account-link': ApiFanAccountLinkFanAccountLink;
      'api::fan-interaction.fan-interaction': ApiFanInteractionFanInteraction;
      'api::fan-moment.fan-moment': ApiFanMomentFanMoment;
      'api::fan-profile.fan-profile': ApiFanProfileFanProfile;
      'api::fan-show-attendance.fan-show-attendance': ApiFanShowAttendanceFanShowAttendance;
      'api::fan-visitor.fan-visitor': ApiFanVisitorFanVisitor;
      'api::feature-enrollment.feature-enrollment': ApiFeatureEnrollmentFeatureEnrollment;
      'api::funtest.funtest': ApiFuntestFuntest;
      'api::gallery-draft.gallery-draft': ApiGalleryDraftGalleryDraft;
      'api::howtovideo.howtovideo': ApiHowtovideoHowtovideo;
      'api::image-proxy.image-proxy': ApiImageProxyImageProxy;
      'api::link-click.link-click': ApiLinkClickLinkClick;
      'api::marketer.marketer': ApiMarketerMarketer;
      'api::media-play.media-play': ApiMediaPlayMediaPlay;
      'api::merch-order.merch-order': ApiMerchOrderMerchOrder;
      'api::message-campaign.message-campaign': ApiMessageCampaignMessageCampaign;
      'api::message-recipient.message-recipient': ApiMessageRecipientMessageRecipient;
      'api::milestone.milestone': ApiMilestoneMilestone;
      'api::moment.moment': ApiMomentMoment;
      'api::night-recording.night-recording': ApiNightRecordingNightRecording;
      'api::notification.notification': ApiNotificationNotification;
      'api::passport-gallery-save.passport-gallery-save': ApiPassportGallerySavePassportGallerySave;
      'api::pulse-snapshot.pulse-snapshot': ApiPulseSnapshotPulseSnapshot;
      'api::push-device.push-device': ApiPushDevicePushDevice;
      'api::qr.qr': ApiQrQr;
      'api::relationship-event.relationship-event': ApiRelationshipEventRelationshipEvent;
      'api::scan.scan': ApiScanScan;
      'api::seo-page.seo-page': ApiSeoPageSeoPage;
      'api::show-recap.show-recap': ApiShowRecapShowRecap;
      'api::socialpage.socialpage': ApiSocialpageSocialpage;
      'api::stream.stream': ApiStreamStream;
      'api::support-moment.support-moment': ApiSupportMomentSupportMoment;
      'api::system-kv.system-kv': ApiSystemKvSystemKv;
      'api::tour.tour': ApiTourTour;
      'api::video.video': ApiVideoVideo;
    }
  }
}
