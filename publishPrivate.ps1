pnpm build
cd dist
echo "import { serveDir } from 'https://deno.land/std@0.199.0/http/file_server.ts';Deno.serve((req) => { return serveDir(req, {fsRoot: './',});});" > mod.ts
deployctl deploy ./mod.ts --prod --project surfaceapl
cd ../
