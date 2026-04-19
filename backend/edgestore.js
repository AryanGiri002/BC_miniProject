import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreExpressHandler } from '@edgestore/server/adapters/express';

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
  nftImages: es.imageBucket({ maxSize: 1024 * 1024 * 10 }),    // 10MB
  nftDocuments: es.fileBucket({ maxSize: 1024 * 1024 * 50 }),  // 50MB
});

const handler = createEdgeStoreExpressHandler({ router: edgeStoreRouter });

export { handler, edgeStoreRouter };
