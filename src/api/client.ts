import Constants from 'expo-constants';

const { server } = Constants.expoConfig?.extra || {};

if (!server?.url) {
  throw new Error('Missing server URL in app.config.js');
}

export const API_URL = server.url;

export async function uploadFile(file: {
  uri: string;
  name: string;
  type: string;
}) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const response = await fetch(`${API_URL}/api/file`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return response.json();
} 