// src/app/[locale]/signage/frontend/components/playlist/PlaylistEditor.tsx

import React, { useState } from 'react';
// import { GraphQLPlaylist, GraphQLPlaylistItem, GraphQLMedia } from '../types';

interface PlaylistEditorProps {
  // playlist?: GraphQLPlaylist; // Existing playlist to edit, or undefined for new
  // availableMedia: GraphQLMedia[];
  // onSave: (playlistData: any) => Promise<void>;
  organizationId: string;
  userId: string;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({ organizationId, userId }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  // const [items, setItems] = useState<GraphQLPlaylistItem[]>([]);

  const handleSave = async () => {
    // Logic to call createPlaylist or updatePlaylist GraphQL mutation
    // This would involve collecting playlistName, description, and item details.
    console.log('Simulating save playlist:', { name: playlistName, description: playlistDescription, items: [] });
    alert('Playlist saved (simulated)!');
  };

  return (
    <div>
      <h3>Playlist Editor</h3>
      <div>
        <label htmlFor="playlistName">Name:</label>
        <input
          id="playlistName"
          type="text"
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="playlistDescription">Description:</label>
        <textarea
          id="playlistDescription"
          value={playlistDescription}
          onChange={e => setPlaylistDescription(e.target.value)}
        />
      </div>
      {/*
        Further UI would be needed here to:
        - Display current playlist items (GraphQLPlaylistItem[])
        - Allow adding media from MediaLibrary (availableMedia)
        - Allow reordering items, setting duration for each item
        - Allow removing items
      */}
      <h4>Items</h4>
      <p>(Item management UI placeholder)</p>
      <button onClick={handleSave}>Save Playlist</button>
    </div>
  );
};

export default PlaylistEditor;
