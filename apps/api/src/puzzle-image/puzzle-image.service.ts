import { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PuzzleImageService {
  private readonly bucket = process.env.S3_BUCKET ?? 'sliding-tiles';
  private readonly storage = new S3Client({
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const [images, user] = await Promise.all([
      this.prisma.puzzleImage.findMany({
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
      }),
      this.prisma.user.findUnique({
        select: { selectedPuzzleImage: { select: { contentHash: true } } },
        where: { id: userId },
      }),
    ]);
    return {
      images,
      selectedContentHash: user?.selectedPuzzleImage?.contentHash ?? null,
    };
  }

  async selectForUser(userId: string, contentHash: string) {
    const image = await this.prisma.puzzleImage.findFirst({
      select: { id: true },
      where: { contentHash, userId },
    });
    if (!image) throw new NotFoundException('Puzzle image not found.');
    await this.prisma.user.update({
      data: { selectedPuzzleImageId: image.id },
      where: { id: userId },
    });
    return { selectedContentHash: contentHash };
  }

  async saveForUser(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    metadata: { contentHash: string; height: number; name?: string; width: number },
  ) {
    const objectKey = `users/${userId}/puzzle-images/${metadata.contentHash}`;
    await this.storage.send(
      new PutObjectCommand({
        Body: file.buffer,
        Bucket: this.bucket,
        ContentLength: file.size,
        ContentType: file.mimetype,
        Key: objectKey,
        Metadata: { sha256: metadata.contentHash },
      }),
    );

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
    const object = await this.storage.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: image.objectKey }),
    );
    if (!(object.Body instanceof Readable)) {
      throw new NotFoundException('Puzzle image content not found.');
    }
    return { image, stream: object.Body };
  }

  async deleteForUser(userId: string, id: string) {
    const image = await this.prisma.puzzleImage.findFirst({ where: { id, userId } });
    if (!image) throw new NotFoundException('Puzzle image not found.');
    await this.storage.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: image.objectKey }),
    );
    await this.prisma.puzzleImage.delete({ where: { id } });
    return { deleted: true };
  }
}
