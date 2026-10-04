import { db } from "../../db/client";

type MoveNodeInput = {
  nodeId: number;
  nodeType: "folder" | "document";

  destinationFolderId: number;
};

/*
for node when moving , need to update its path , we can get new path from concatPath(destinationFolderPath , destinationFolderName)
return new path
*/
export async function moveNode(
  input: MoveNodeInput,
) {
  const { nodeId, nodeType, destinationFolderId } = input;

  // Get the destination folder to build the new path
  const destinationFolder = await db.folder.findUnique({
    where: { id: destinationFolderId },
    select: { path: true, name: true, id: true },
  });

  if (!destinationFolder) {
    throw new Error(`Destination folder with id ${destinationFolderId} not found`);
  }

  // Get the node to move
  let node;
  if (nodeType === "folder") {
    node = await db.folder.findUnique({
      where: { id: nodeId },
      select: { id: true, name: true, path: true },
    });
  } else {
    node = await db.document.findUnique({
      where: { id: nodeId },
      select: { id: true, name: true, path: true },
    });
  }

  if (!node) {
    throw new Error(`${nodeType} with id ${nodeId} not found`);
  }

  // Build new path: destinationFolder.path + "/" + node.name
  // But we need to avoid double slashes
  const destPath = destinationFolder.path.endsWith("/")
    ? destinationFolder.path.slice(0, -1)
    : destinationFolder.path;
  const newPath = `${destPath}/${node.name}`;

  // Update the node's path AND structural relationship
  let updatedNode;
  if (nodeType === "folder") {
    updatedNode = await db.folder.update({
      where: { id: nodeId },
      data: {
        path: newPath,
        parentId: destinationFolder.id,
      },
    });

    // Recursively update all descendants' paths
    await updateDescendantPaths(nodeId, newPath);
  } else {
    updatedNode = await db.document.update({
      where: { id: nodeId },
      data: {
        path: newPath,
        folderId: destinationFolder.id,
      },
    });
  }

  return updatedNode;
}

// Helper function to recursively update paths of all descendants of a folder
async function updateDescendantPaths(folderId: number, newParentPath: string) {
  // Get all direct children folders and documents
  const [childFolders, childDocuments] = await Promise.all([
    db.folder.findMany({
      where: { parentId: folderId },
      select: { id: true, name: true, path: true },
    }),
    db.document.findMany({
      where: { folderId: folderId },
      select: { id: true, name: true, path: true },
    }),
  ]);

  // Update child folders
  for (const folder of childFolders) {
    const newPath = `${newParentPath}/${folder.name}`;
    await db.folder.update({
      where: { id: folder.id },
      data: { path: newPath },
    });
    // Recursively update this folder's descendants
    await updateDescendantPaths(folder.id, newPath);
  }

  // Update child documents
  for (const document of childDocuments) {
    const newPath = `${newParentPath}/${document.name}`;
    await db.document.update({
      where: { id: document.id },
      data: { path: newPath },
    });
  }
}