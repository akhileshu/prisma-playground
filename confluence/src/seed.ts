import { TeamRole } from "generated/prisma/enums";
import { db } from "./db/client";


/**
 * Converts a string to kebab-case for folder/document names
 */
function toKebabCase(str: string): string {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/**
 * Validates a path contains only kebab-case segments
 */
function validatePath(path: string): string {
  if (!path || path.trim() === "") {
    throw new Error("Path cannot be empty");
  }

  const cleanPath = path.replace(/^\/+|\/+$/g, "");

  if (cleanPath === "") {
    throw new Error("Path must have at least one segment");
  }

  const segments = cleanPath.split("/");

  for (const segment of segments) {
    if (segment === "") {
      throw new Error("Path segments cannot be empty");
    }

    // Each segment must be kebab-case alphanumeric
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) {
      throw new Error(
        `Path segment "${segment}" is not kebab-case alphanumeric`
      );
    }
  }

  return "/" + cleanPath;
}

async function main() {
  // Clean existing data
  await db.comment.deleteMany();
  await db.document.deleteMany();
  await db.folder.deleteMany();
  await db.teamMember.deleteMany();
  await db.teamSpace.deleteMany();
  await db.organization.deleteMany();
  await db.user.deleteMany();

  // -------------------------
  // Users
  // -------------------------

  const alice = await db.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      age: 28,
    },
  });

  const bob = await db.user.create({
    data: {
      name: "Bob",
      email: "bob@example.com",
      age: 30,
    },
  });

  // ==========================
  // FACEBOOK ORG
  // ==========================

  // Create Facebook organization
  const facebookOrg = await db.organization.create({
    data: {
      id: "facebook",
      name: "Facebook",
    },
  });

  // Connect users to Facebook organization
  await db.user.updateMany({
    where: {
      id: {
        in: [alice.id, bob.id],
      },
    },
    data: {
      organizationId: facebookOrg.id,
    },
  });

  // Create Facebook root folder (/facebook)
  const facebookRootFolder = await db.folder.create({
    data: {
      id: 1, // Fixed ID for predictable path
      name: "facebook",
      authorId: alice.id,
      path: "/facebook",
    },
  });

// Create Facebook teams folder (/facebook/teams)
  const facebookTeamsFolder = await db.folder.create({
    data: {
      id: 7,
      name: "teams",
      parentId: facebookRootFolder.id,
      authorId: alice.id,
      path: "/facebook/teams",
    },
  });

  // Create teams for Facebook (kebab-case ids)
  const reactTeam = await db.teamSpace.create({
    data: {
      id: "react",
      name: "React",
      organizationId: facebookOrg.id,
    },
  });

  const whatsappTeam = await db.teamSpace.create({
    data: {
      id: "whatsapp",
      name: "WhatsApp",
      organizationId: facebookOrg.id,
    },
  });

  // Add team members
  await db.teamMember.createMany({
    data: [
      {
        teamId: reactTeam.id,
        userId: alice.id,
        role: TeamRole.LEAD,
      },
      {
        teamId: reactTeam.id,
        userId: bob.id,
        role: TeamRole.MEMBER,
      },
      {
        teamId: whatsappTeam.id,
        userId: alice.id,
        role: TeamRole.LEAD,
      },
      {
        teamId: whatsappTeam.id,
        userId: bob.id,
        role: TeamRole.MEMBER,
      },
    ],
  });

  // Create team folders with kebab-case names and paths
  const reactFolder = await db.folder.create({
    data: {
      id: 2,
      name: "react",
      parentId: facebookTeamsFolder.id,
      authorId: alice.id,
      path: "/facebook/teams/react",
    },
  });

  const whatsappFolder = await db.folder.create({
    data: {
      id: 3,
      name: "whatsapp",
      parentId: facebookTeamsFolder.id,
      authorId: alice.id,
      path: "/facebook/teams/whatsapp",
    },
  });

  // Create documents with kebab-case names and paths
  const facebookWelcomeDoc = await db.document.create({
    data: {
      name: "facebook-welcome",
      content: "Welcome to Facebook organization documentation",
      folderId: facebookRootFolder.id,
      authorId: alice.id,
      published: true,
      path: "/facebook/facebook-welcome",
    },
  });

  const reactGuidelinesDoc = await db.document.create({
    data: {
      name: "react-guidelines",
      content: "Guidelines for React development at Facebook",
      folderId: reactFolder.id,
      authorId: alice.id,
      published: true,
      path: "/facebook/teams/react/react-guidelines",
    },
  });

  const whatsappArchitectureDoc = await db.document.create({
    data: {
      name: "whatsapp-architecture",
      content: "WhatsApp system architecture overview",
      folderId: whatsappFolder.id,
      authorId: bob.id,
      published: true,
      path: "/facebook/teams/whatsapp/whatsapp-architecture",
    },
  });

  // ==========================
  // GOOGLE ORG
  // ==========================

  // Create Google organization
  const googleOrg = await db.organization.create({
    data: {
      id: "google",
      name: "Google",
    },
  });

  // Connect users to Google organization
  await db.user.updateMany({
    where: {
      id: {
        in: [alice.id, bob.id],
      },
    },
    data: {
      organizationId: googleOrg.id,
    },
  });

  // Create Google root folder (/google)
  const googleRootFolder = await db.folder.create({
    data: {
      id: 4,
      name: "google",
      authorId: alice.id,
      path: "/google",
    },
  });

// Create Google teams folder (/google/teams)
  const googleTeamsFolder = await db.folder.create({
    data: {
      id: 9,
      name: "teams",
      parentId: googleRootFolder.id,
      authorId: alice.id,
      path: "/google/teams",
    },
  });

  // Create teams for Google (kebab-case ids)
  const searchTeam = await db.teamSpace.create({
    data: {
      id: "search",
      name: "Search",
      organizationId: googleOrg.id,
    },
  });

  const adsTeam = await db.teamSpace.create({
    data: {
      id: "ads",
      name: "Ads",
      organizationId: googleOrg.id,
    },
  });

  // Add team members
  await db.teamMember.createMany({
    data: [
      {
        teamId: searchTeam.id,
        userId: alice.id,
        role: TeamRole.LEAD,
      },
      {
        teamId: searchTeam.id,
        userId: bob.id,
        role: TeamRole.MEMBER,
      },
      {
        teamId: adsTeam.id,
        userId: alice.id,
        role: TeamRole.LEAD,
      },
      {
        teamId: adsTeam.id,
        userId: bob.id,
        role: TeamRole.MEMBER,
      },
    ],
  });

  // Create team folders with kebab-case names and paths
  const searchFolder = await db.folder.create({
    data: {
      id: 5,
      name: "search",
      parentId: googleTeamsFolder.id,
      authorId: alice.id,
      path: "/google/teams/search",
    },
  });

  const adsFolder = await db.folder.create({
    data: {
      id: 6,
      name: "ads",
      parentId: googleTeamsFolder.id,
      authorId: alice.id,
      path: "/google/teams/ads",
    },
  });

  // Create documents with kebab-case names and paths
  const googleWelcomeDoc = await db.document.create({
    data: {
      name: "google-welcome",
      content: "Welcome to Google organization documentation",
      folderId: googleRootFolder.id,
      authorId: alice.id,
      published: true,
      path: "/google/google-welcome",
    },
  });

  const searchFundamentalsDoc = await db.document.create({
    data: {
      name: "search-fundamentals",
      content: "Fundamentals of Google Search technology",
      folderId: searchFolder.id,
      authorId: alice.id,
      published: true,
      path: "/google/teams/search/search-fundamentals",
    },
  });

  const adsPlatformDoc = await db.document.create({
    data: {
      name: "ads-platform",
      content: "Overview of Google Ads platform",
      folderId: adsFolder.id,
      authorId: bob.id,
      published: true,
      path: "/google/teams/ads/ads-platform",
    },
  });

  console.log("Seed completed.");
  console.log({
    facebookOrg: facebookOrg.name,
    googleOrg: googleOrg.name,
    users: [alice.email, bob.email],
    facebookTeams: [reactTeam.name, whatsappTeam.name],
    googleTeams: [searchTeam.name, adsTeam.name],
    facebookDocs: [
      facebookWelcomeDoc.path,
      reactGuidelinesDoc.path,
      whatsappArchitectureDoc.path,
    ],
    googleDocs: [
      googleWelcomeDoc.path,
      searchFundamentalsDoc.path,
      adsPlatformDoc.path,
    ],
  });
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
