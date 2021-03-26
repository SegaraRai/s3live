import { gzip } from 'zlib';

export function gzipAsync(content: Buffer, level = 9): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    gzip(
      content,
      {
        level,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
  });
}
