pnpm build
cd dist
cat ../denoServer.txt > mod.ts
deployctl deploy ./mod.ts --prod --project surfaceapl
cd ../
