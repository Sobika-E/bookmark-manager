import { prisma } from '../../lib/prisma.js';
import { ValidationError, validateBookmarkTitle, validateBookmarkUrl } from '../../validation/bookmarkValidation.js';

const TAKE_DEFAULT = 10;
const TAKE_MAX = 100;

export const bookmarkResolvers = {
  Query: {
    bookmarks: async (_parent: unknown, args: {
      folderId?: string;
      search?: string;
      take?: number;
      cursor?: string;
    }) => {
      const take = Math.min(args.take || TAKE_DEFAULT, TAKE_MAX);
      
      const where: {
        folderId?: string;
        title?: { contains: string; mode: 'insensitive' };
      } = {};

      if (args.folderId) {
        where.folderId = args.folderId;
      }

      if (args.search) {
        where.title = { contains: args.search, mode: 'insensitive' };
      }

      let cursor = undefined;
      if (args.cursor) {
        try {
          cursor = { id: args.cursor };
        } catch {
          throw new ValidationError('Invalid cursor');
        }
      }

      const bookmarks = await prisma.bookmark.findMany({
        where,
        take: take + 1,
        cursor,
        orderBy: { createdAt: 'asc' },
        include: { folder: true },
      });

      const hasNextPage = bookmarks.length > take;
      const items = hasNextPage ? bookmarks.slice(0, take) : bookmarks;
      const nextCursor = hasNextPage ? items[items.length - 1].id : null;

      return {
        items,
        nextCursor,
        hasNextPage,
      };
    },
  },

  Mutation: {
    createFolder: async (_parent: unknown, args: { name: string }) => {
      return prisma.folder.create({
        data: { name: args.name },
      });
    },

    createBookmark: async (_parent: unknown, args: {
      title: string;
      url: string;
      tags: string[];
      folderId: string;
    }) => {
      validateBookmarkTitle(args.title);
      validateBookmarkUrl(args.url);

      const folder = await prisma.folder.findUnique({
        where: { id: args.folderId },
      });

      if (!folder) {
        throw new ValidationError('Folder not found');
      }

      return prisma.bookmark.create({
        data: {
          title: args.title.trim(),
          url: args.url,
          tags: args.tags,
          folderId: args.folderId,
        },
        include: { folder: true },
      });
    },

    updateBookmark: async (_parent: unknown, args: {
      id: string;
      title?: string;
      url?: string;
      tags?: string[];
      folderId?: string;
    }) => {
      const existing = await prisma.bookmark.findUnique({
        where: { id: args.id },
      });

      if (!existing) {
        throw new ValidationError('Bookmark not found');
      }

      const data: {
        title?: string;
        url?: string;
        tags?: string[];
        folderId?: string;
      } = {};

      if (args.title !== undefined) {
        validateBookmarkTitle(args.title);
        data.title = args.title.trim();
      }

      if (args.url !== undefined) {
        validateBookmarkUrl(args.url);
        data.url = args.url;
      }

      if (args.tags !== undefined) {
        data.tags = args.tags;
      }

      if (args.folderId !== undefined) {
        const folder = await prisma.folder.findUnique({
          where: { id: args.folderId },
        });

        if (!folder) {
          throw new ValidationError('Folder not found');
        }

        data.folderId = args.folderId;
      }

      return prisma.bookmark.update({
        where: { id: args.id },
        data,
        include: { folder: true },
      });
    },

    deleteBookmark: async (_parent: unknown, args: { id: string }) => {
      const existing = await prisma.bookmark.findUnique({
        where: { id: args.id },
      });

      if (!existing) {
        throw new ValidationError('Bookmark not found');
      }

      await prisma.bookmark.delete({
        where: { id: args.id },
      });

      return existing;
    },

    moveBookmark: async (_parent: unknown, args: { id: string; folderId: string }) => {
      const bookmark = await prisma.bookmark.findUnique({
        where: { id: args.id },
      });

      if (!bookmark) {
        throw new ValidationError('Bookmark not found');
      }

      const folder = await prisma.folder.findUnique({
        where: { id: args.folderId },
      });

      if (!folder) {
        throw new ValidationError('Folder not found');
      }

      return prisma.bookmark.update({
        where: { id: args.id },
        data: { folderId: args.folderId },
        include: { folder: true },
      });
    },
  },
};
