import { createReadStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PuzzleImageService {
  private readonly storageRoot = resolve(
    process.env.PUZZLE_IMAGE_STORAGE_PATH ?? join(process.cwd(), 'data', 'puzzle-images'),
  );

  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.puzzleImage.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        contentHash: true,
        contentType: true,
        height: true,
        id: true,
        name: true,
        size: true,
        updatedAt: true,
        width: true,
      },
      where: { userId },
    });
  }

  async saveForUser(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    metadata: { contentHash: string; height: number; name?: string; width: number },
  ) {
    const objectKey = `${userId}/${metadata.contentHash}`;
    const objectPath = this.objectPath(objectKey);
    await mkdir(dirname(objectPath), { recursive: true });
    await writeFile(objectPath, file.buffer, { flag: 'wx' }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error;
    });

    const image = await this.prisma.puzzleImage.upsert({
      create: {
        contentHash: metadata.contentHash,
        contentType: file.mimetype,
        height: metadata.height,
        name: (metadata.name || file.originalname).slice(0, 255),
        objectKey,
        size: file.size,
        userId,
        width: metadata.width,
      },
      update: {
        contentType: file.mimetype,
        height: metadata.height,
        name: (metadata.name || file.originalname).slice(0, 255),
        size: file.size,
        width: metadata.width,
      },
      where: { userId_contentHash: { contentHash: metadata.contentHash, userId } },
    });
    return { image };
  }

  async openForUser(userId: string, id: string) {
    const image = await this.prisma.puzzleImage.findFirst({ where: { id, userId } });
    if (!image) throw new NotFoundException('Puzzle image not found.');
    return { image, stream: createReadStream(this.objectPath(image.objectKey)) };
  }

  async deleteForUser(userId: string, id: string) {
    const image = await this.prisma.puzzleImage.findFirst({ where: { id, userId } });
    if (!image) throw new NotFoundException('Puzzle image not found.');
    await this.prisma.puzzleImage.delete({ where: { id } });
    await unlink(this.objectPath(image.objectKey)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
    return { deleted: true };
  }

  private objectPath(objectKey: string) {
    const path = resolve(this.storageRoot, objectKey);
    if (!path.startsWith(`${this.storageRoot}${process.platform === 'win32' ? '\\' : '/'}`)) {
      throw new Error('Invalid object key.');
    }
    return path;
  }
}
