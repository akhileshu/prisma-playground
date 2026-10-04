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
    select: { path: true, name: true },
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

  // Update the node's path
  let updatedNode;
  if (nodeType === "folder") {
    updatedNode = await db.folder.update({
      where: { id: nodeId },
      data: { path: newPath },
    });
  } else {
    updatedNode = await db.document.update({
      where: { id: nodeId },
      data: { path: newPath },
    });
  }

  return updatedNode;
}