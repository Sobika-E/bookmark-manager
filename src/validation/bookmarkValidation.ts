export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateBookmarkTitle(title: string): void {
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length === 0) {
    throw new ValidationError('Bookmark title cannot be empty');
  }
}

export function validateBookmarkUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid bookmark URL');
  }
}
