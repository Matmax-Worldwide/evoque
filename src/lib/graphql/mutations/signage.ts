import { gql } from '@apollo/client';

export const GENERATE_DEVICE_PAIRING_CODE = gql`
  mutation GenerateDevicePairingCode($input: GenerateDevicePairingCodeInput!) {
    generateDevicePairingCode(input: $input) {
      code
      expiresAt
      qrCodeValue
    }
  }
`;

export const PAIR_SIGNAGE_DEVICE = gql`
  mutation PairSignageDevice($input: PairSignageDeviceInput!) {
    pairSignageDevice(input: $input) {
      success
      message
      device {
        id
        name
        status
        organizationId
        deviceToken
        createdAt
      }
      token
    }
  }
`;

export const ASSIGN_PLAYLIST_TO_DEVICE = gql`
  mutation AssignPlaylistToDevice($input: AssignPlaylistToDeviceInput!) {
    assignPlaylistToDevice(input: $input) {
      id
      name
      status
      currentPlaylistId
      currentPlaylist {
        id
        name
        description
        totalDuration
      }
    }
  }
`;

export const UPLOAD_SIGNAGE_MEDIA = gql`
  mutation UploadSignageMedia($input: UploadSignageMediaInput!) {
    uploadSignageMedia(input: $input) {
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
      uploadedBy {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const DELETE_SIGNAGE_MEDIA = gql`
  mutation DeleteSignageMedia($id: ID!) {
    deleteSignageMedia(id: $id) {
      success
      message
      media
    }
  }
`;

export const CREATE_PLAYLIST = gql`
  mutation CreatePlaylist($input: CreatePlaylistInput!) {
    createPlaylist(input: $input) {
      id
      name
      description
      organizationId
      createdByUserId
      isActive
      totalDuration
      createdAt
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
        }
      }
    }
  }
`;

export const UPDATE_PLAYLIST = gql`
  mutation UpdatePlaylist($id: ID!, $input: UpdatePlaylistInput!) {
    updatePlaylist(id: $id, input: $input) {
      success
      message
      playlist {
        id
        name
        description
        isActive
        totalDuration
        updatedAt
      }
    }
  }
`;

export const DELETE_PLAYLIST = gql`
  mutation DeletePlaylist($id: ID!) {
    deletePlaylist(id: $id) {
      success
      message
      playlist
    }
  }
`;

export const ADD_MEDIA_TO_PLAYLIST = gql`
  mutation AddMediaToPlaylist($input: AddMediaToPlaylistInput!) {
    addMediaToPlaylist(input: $input) {
      id
      name
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
        }
      }
    }
  }
`;

export const REMOVE_MEDIA_FROM_PLAYLIST = gql`
  mutation RemoveMediaFromPlaylist($playlistId: ID!, $mediaId: ID!) {
    removeMediaFromPlaylist(playlistId: $playlistId, mediaId: $mediaId) {
      success
      message
      playlist {
        id
        name
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

export const UPDATE_DEVICE_STATUS = gql`
  mutation UpdateDeviceStatus($deviceId: ID!, $status: DeviceStatus!) {
    updateDeviceStatus(deviceId: $deviceId, status: $status) {
      success
      message
      device {
        id
        name
        status
        lastSeenAt
        currentPlaylist {
          id
          name
        }
      }
    }
  }
`; 