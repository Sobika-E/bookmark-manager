import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { prisma } from '../src/lib/prisma.js';

describe('PostgreSQL Integration Test', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.bookmark.deleteMany();
    await prisma.folder.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to PostgreSQL and perform database operations', async () => {
    // Create a folder
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
      },
    });

    expect(folder).toBeDefined();
    expect(folder.id).toBeDefined();
    expect(folder.name).toBe('Test Folder');
    expect(folder.createdAt).toBeInstanceOf(Date);

    // Create a bookmark linked to the folder
    const bookmark = await prisma.bookmark.create({
      data: {
        title: 'Test Bookmark',
        url: 'https://example.com',
        tags: ['test', 'integration'],
        folderId: folder.id,
      },
    });

    expect(bookmark).toBeDefined();
    expect(bookmark.id).toBeDefined();
    expect(bookmark.title).toBe('Test Bookmark');
    expect(bookmark.url).toBe('https://example.com');
    expect(bookmark.tags).toEqual(['test', 'integration']);
    expect(bookmark.folderId).toBe(folder.id);

    // Query the bookmark
    const retrievedBookmark = await prisma.bookmark.findUnique({
      where: { id: bookmark.id },
      include: { folder: true },
    });

    expect(retrievedBookmark).toBeDefined();
    expect(retrievedBookmark?.title).toBe('Test Bookmark');
    expect(retrievedBookmark?.folder.name).toBe('Test Folder');

    // Query folder with bookmarks
    const folderWithBookmarks = await prisma.folder.findUnique({
      where: { id: folder.id },
      include: { bookmarks: true },
    });

    expect(folderWithBookmarks).toBeDefined();
    expect(folderWithBookmarks?.bookmarks).toHaveLength(1);
    expect(folderWithBookmarks?.bookmarks[0].title).toBe('Test Bookmark');

    // Clean up
    await prisma.bookmark.delete({ where: { id: bookmark.id } });
    await prisma.folder.delete({ where: { id: folder.id } });
  });

  it('should handle foreign key constraints', async () => {
    const folder = await prisma.folder.create({
      data: { name: 'Test Folder 2' },
    });

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        title: 'Test Bookmark 2',
        url: 'https://example2.com',
        tags: [],
        folderId: folder.id,
      },
    });

    // Delete folder should cascade delete bookmarks
    await prisma.folder.delete({ where: { id: folder.id } });

    const deletedBookmark = await prisma.bookmark.findUnique({
      where: { id: bookmark.id },
    });

    expect(deletedBookmark).toBeNull();
  });
});
