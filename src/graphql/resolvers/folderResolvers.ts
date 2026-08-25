import { prisma } from '../../lib/prisma.js';

export const folderResolvers = {
  Query: {
    folders: () => {
      return prisma.folder.findMany({
        orderBy: { createdAt: 'asc' },
      });
    },

    folder: (_parent: unknown, args: { id: string }) => {
      return prisma.folder.findUnique({
        where: { id: args.id },
        include: { bookmarks: true },
      });
    },
  },

  Folder: {
    bookmarks: (parent: { id: string }) => {
      return prisma.bookmark.findMany({
        where: { folderId: parent.id },
        orderBy: { createdAt: 'asc' },
      });
    },
  },
};
