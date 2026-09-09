export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

const APP_FOLDER_NAME = "IADÉBAT - Débats & Traités";

async function checkDriveResponse(res: Response, actionContext: string): Promise<void> {
  if (res.ok) return;

  const rawText = await res.text();
  let errorMsg = rawText;
  let isInsufficientScope = false;

  try {
    const parsed = JSON.parse(rawText);
    if (parsed?.error?.message) {
      errorMsg = parsed.error.message;
    }
    if (
      parsed?.error?.code === 403 ||
      parsed?.error?.status === 'PERMISSION_DENIED' ||
      parsed?.error?.details?.some((d: any) => d.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
      rawText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
      rawText.includes('insufficient authentication scopes') ||
      rawText.includes('insufficientPermissions')
    ) {
      isInsufficientScope = true;
    }
  } catch {
    if (rawText.includes('insufficient authentication scopes') || rawText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
      isInsufficientScope = true;
    }
  }

  if (isInsufficientScope) {
    const error: any = new Error(
      "Permissions Google Drive insuffisantes : Votre session n'a pas encore validé l'accès aux fichiers Google Drive. Cliquez sur 'Renouveler l'accès' pour accorder la permission."
    );
    error.code = 'ACCESS_TOKEN_SCOPE_INSUFFICIENT';
    throw error;
  }

  throw new Error(`${actionContext} : ${errorMsg}`);
}

/**
 * Finds or creates the default folder in Google Drive.
 */
export async function getOrCreateIadebatFolder(accessToken: string): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  await checkDriveResponse(searchRes, "Recherche du dossier Drive");

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      description: "Dossier contenant les archives, transcriptions, traités et verdicts de l'Agora IADÉBAT.",
    }),
  });

  await checkDriveResponse(createRes, "Création du dossier dans Google Drive");

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Uploads a text/markdown file to Google Drive using multipart upload.
 */
export async function uploadTextFileToDrive({
  fileName,
  content,
  mimeType = "text/markdown",
  accessToken,
  folderId,
}: {
  fileName: string;
  content: string;
  mimeType?: string;
  accessToken: string;
  folderId?: string;
}): Promise<DriveFileItem> {
  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,modifiedTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  await checkDriveResponse(res, "Téléversement sur Google Drive");

  return await res.json();
}

/**
 * Lists files inside the IADÉBAT folder or root.
 */
export async function listIadebatFiles(accessToken: string, folderId?: string): Promise<DriveFileItem[]> {
  let query = "trashed=false";
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const fields = "files(id,name,mimeType,webViewLink,iconLink,createdTime,modifiedTime,size)";
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&fields=${encodeURIComponent(fields)}&pageSize=30`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  await checkDriveResponse(res, "Récupération des fichiers Drive");

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads text content of a file.
 */
export async function downloadFileContent(fileId: string, accessToken: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  await checkDriveResponse(res, "Téléchargement du fichier");

  return await res.text();
}

/**
 * Deletes a file in Google Drive.
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 204) return;
  await checkDriveResponse(res, "Suppression du fichier dans Google Drive");
}
