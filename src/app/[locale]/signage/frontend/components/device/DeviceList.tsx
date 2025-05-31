// src/app/[locale]/signage/frontend/components/device/DeviceList.tsx

import React from 'react';

// Placeholder for GraphQLDevice type, assuming it's imported from a types file
// import { GraphQLDevice } from '../../../backend/graphql/types/device.types';

interface GraphQLDevice { // Simplified inline for stub
    id: string;
    name?: string | null;
    status: string;
    lastSeenAt?: string | null;
    currentPlaylistId?: string | null;
}

interface DeviceListProps {
  devices: GraphQLDevice[];
  onSelectDevice: (deviceId: string) => void;
  // onAssignPlaylist: (deviceId: string, playlistId: string) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelectDevice }) => {
  if (!devices.length) {
    return <p>No devices found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Last Seen</th>
          <th>Playlist ID</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {devices.map(device => (
          <tr key={device.id}>
            <td>{device.name || device.id}</td>
            <td>{device.status}</td>
            <td>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</td>
            <td>{device.currentPlaylistId || 'None'}</td>
            <td>
              <button onClick={() => onSelectDevice(device.id)}>View Details</button>
              {/* Add buttons for assign playlist, restart, etc. */}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DeviceList;
