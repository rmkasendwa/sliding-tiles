import { Module } from '@nestjs/common';

import { PuzzleImageController } from './puzzle-image.controller';
import { PuzzleImageService } from './puzzle-image.service';

@Module({ controllers: [PuzzleImageController], providers: [PuzzleImageService] })
export class PuzzleImageModule {}
