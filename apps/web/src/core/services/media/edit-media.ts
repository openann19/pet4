import type {
    EditOptions,
    EditedMedia,
    ImageOperation,
    MediaInput,
    VideoOperation,
} from '@/core/types/media-types'
import { applyImagePipeline } from './image-engine'
import { editVideo } from './video-engine'

/**
 * Unified media editing entry point
 * Routes to appropriate engine based on media type
 */
export async function editMedia(
  input: MediaInput,
  ops: ImageOperation[] | VideoOperation[],
  opts: EditOptions = {}
): Promise<EditedMedia> {
  if (input.type === 'image') {
    return applyImagePipeline(input, ops as ImageOperation[], opts)
  }
  return editVideo(input, ops as VideoOperation[], opts)
}

