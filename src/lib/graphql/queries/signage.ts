import { gql } from '@apollo/client';

export const LIST_DEVICES = gql`
  query ListDevices($organizationId: ID!) {
    listDevices(organizationId: $organizationId) {
      id
      name
      status
      lastSeenAt
      organizationId
      currentPlaylistId
      deviceToken
      ipAddress
      userAgent
      createdAt
      updatedAt
      currentPlaylist {
        id
        name
        description
        totalDuration
      }
    }
  }
`;

export const GET_DEVICE = gql`
  query GetDevice($id: ID!) {
    getDevice(id: $id) {
      id
      name
      status
      lastSeenAt
      organizationId
      currentPlaylistId
      deviceToken
      ipAddress
      userAgent
      createdAt
      updatedAt
      currentPlaylist {
        id
        name
        description
        totalDuration
        items {
          id
          order
          durationSeconds
          media {
            id
            name
            type
            url
            thumbnailUrl
          }
        }
      }
    }
  }
`;

export const LIST_SIGNAGE_MEDIA = gql`
  query ListSignageMedia($organizationId: ID!) {
    listSignageMedia(organizationId: $organizationId) {
      id
      name
      type
      mimeType
      url
      thumbnailUrl
      sizeBytes
      durationSeconds
      width
      height
      organizationId
      uploadedByUserId
      createdAt
      updatedAt
      uploadedBy {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const GET_SIGNAGE_MEDIA = gql`
  query GetSignageMedia($id: ID!, $organizationId: ID!) {
    getSignageMedia(id: $id, organizationId: $organizationId) {
      id
      name
      type
      mimeType
      url
      thumbnailUrl
      sizeBytes
      durationSeconds
      width
      height
      organizationId
      uploadedByUserId
      createdAt
      updatedAt
      uploadedBy {
        id
        firstName
        lastName
        email
      }
      playlistItems {
        id
        playlistId
        order
        durationSeconds
        playlist {
          id
          name
        }
      }
    }
  }
`;

export const LIST_PLAYLISTS = gql`
  query ListPlaylists($organizationId: ID!) {
    listPlaylists(organizationId: $organizationId) {
      id
      name
      description
      organizationId
      createdByUserId
      isActive
      totalDuration
      createdAt
      updatedAt
      createdBy {
        id
        firstName
        lastName
        email
      }
      items {
        id
        order
        durationSeconds
        media {
          id
          name
          type
          url
          thumbnailUrl
          durationSeconds
        }
      }
      assignedDevices {
        id
        name
        status
      }
    }
  }
`;

export const GET_PLAYLIST = gql`
  query GetPlaylist($id: ID!, $organizationId: ID!) {
    getPlaylist(id: $id, organizationId: $organizationId) {
      id
      name
      description
      organizationId
      createdByUserId
      isActive
      totalDuration
      createdAt
      updatedAt
      createdBy {
        id
        firstName
        lastName
        email
      }
      items {
        id
        order
        durationSeconds
        media {
          id
          name
          type
          url
          thumbnailUrl
          durationSeconds
          width
          height
          sizeBytes
        }
      }
      assignedDevices {
        id
        name
        status
        lastSeenAt
      }
    }
  }
`;

export const GET_PLAYLIST_FOR_DEVICE = gql`
  query GetPlaylistForDevice($deviceId: ID!) {
    getPlaylistForDevice(deviceId: $deviceId) {
      id
      name
      description
      totalDuration
      items {
        id
        order
        durationSeconds
        media {
          id
          name
          type
          url
          thumbnailUrl
          durationSeconds
          width
          height
        }
      }
    }
  }
`;

export const GET_SIGNAGE_OVERVIEW = gql`
  query GetSignageOverview($organizationId: ID!) {
    listDevices(organizationId: $organizationId) {
      id
      status
    }
    listSignageMedia(organizationId: $organizationId) {
      id
      type
    }
    listPlaylists(organizationId: $organizationId) {
      id
      isActive
    }
  }
`; 