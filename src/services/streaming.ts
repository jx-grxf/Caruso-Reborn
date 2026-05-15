import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { FastifyReply } from "fastify";
import ffmpegPath from "ffmpeg-static";

export const STREAM_REQUEST_HEADERS = {
  "user-agent": "CarusoReborn/0.2.1",
  "accept": "audio/mpeg,audio/aac,audio/*,*/*;q=0.8"
};

export function dlnaContentFeaturesForMimeType(mimeType: string): string {
  if (mimeType === "audio/mpeg") {
    return "DLNA.ORG_PN=MP3;DLNA.ORG_OP=01;DLNA.ORG_FLAGS=01700000000000000000000000000000";
  }

  if (mimeType === "audio/aac") {
    return "DLNA.ORG_OP=01;DLNA.ORG_FLAGS=01700000000000000000000000000000";
  }

  return "DLNA.ORG_OP=01;DLNA.ORG_FLAGS=01700000000000000000000000000000";
}

export function isSupportedStreamMimeType(mimeType: string): boolean {
  return ["audio/mpeg", "audio/aac", "audio/flac"].includes(mimeType);
}

export function shouldTranscodeForCaruso(mimeType: string): boolean {
  return mimeType.toLowerCase().includes("aac");
}

export function applyStreamHeaders(reply: FastifyReply, mimeType: string) {
  reply.header("content-type", mimeType);
  reply.header("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  reply.header("pragma", "no-cache");
  reply.header("expires", "0");
  reply.header("transferMode.dlna.org", "Streaming");
  reply.header("contentFeatures.dlna.org", dlnaContentFeaturesForMimeType(mimeType));
  reply.header("accept-ranges", "none");
  reply.header("icy-metadata", "0");
}

export async function sendTranscodedMp3Stream(reply: FastifyReply, upstream: Response) {
  const resolvedFfmpegPath = ffmpegPath as unknown as string | null;
  if (!resolvedFfmpegPath) {
    throw new Error("ffmpeg is not available for AAC transcoding.");
  }

  const sourceStream = upstream.body ? Readable.fromWeb(upstream.body as unknown as WebReadableStream) : undefined;
  if (!sourceStream) {
    throw new Error("Upstream stream body is missing.");
  }

  const ffmpeg: ChildProcessWithoutNullStreams = spawn(resolvedFfmpegPath, [
    "-loglevel", "error",
    "-i", "pipe:0",
    "-vn",
    "-acodec", "libmp3lame",
    "-b:a", "192k",
    "-f", "mp3",
    "pipe:1"
  ], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  sourceStream.on("error", () => {
    ffmpeg.kill("SIGKILL");
  });

  ffmpeg.stdin.on("error", () => undefined);
  ffmpeg.stderr.on("data", () => undefined);
  sourceStream.pipe(ffmpeg.stdin);

  applyStreamHeaders(reply, "audio/mpeg");
  return reply.send(ffmpeg.stdout);
}
