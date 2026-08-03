import { createHash } from 'node:crypto';

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AuthGuard } from '../session/auth.guard';
import { getAuthenticatedUser } from '../session/get-authenticated-user';
import type { AuthenticatedRequest } from '../session/session.types';
import { PuzzleImageService } from './puzzle-image.service';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

@Controller('puzzle-images')
@UseGuards(AuthGuard)
export class PuzzleImageController {
  constructor(private readonly puzzleImages: PuzzleImageService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const images = await this.puzzleImages.listForUser(getAuthenticatedUser(request).id);
    return { images };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Req() request: AuthenticatedRequest & { body: Record<string, string> },
  ) {
    const { contentHash, height, name, width } = request.body;
    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (!file || !file.mimetype.startsWith('image/')) throw new BadRequestException('A valid image file is required.');
    if (!HASH_PATTERN.test(contentHash) || createHash('sha256').update(file.buffer).digest('hex') !== contentHash) {
      throw new BadRequestException('The image content hash is invalid.');
    }
    if (!Number.isInteger(parsedWidth) || !Number.isInteger(parsedHeight) || parsedWidth < 1 || parsedHeight < 1) {
      throw new BadRequestException('Valid image dimensions are required.');
    }
    return this.puzzleImages.saveForUser(getAuthenticatedUser(request).id, file, {
      contentHash,
      height: parsedHeight,
      name,
      width: parsedWidth,
    });
  }

  @Get(':id/content')
  async content(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { image, stream } = await this.puzzleImages.openForUser(getAuthenticatedUser(request).id, id);
    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Content-Length', image.size);
    response.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    stream.pipe(response);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.puzzleImages.deleteForUser(getAuthenticatedUser(request).id, id);
  }
}
