# [surfaceAPL](https://surfaceapl.deno.dev)

surfaceAPL is a level editor for [@griffpatch](https://scratch.mit.edu/users/griffpatch)'s [Appel](https://scratch.mit.edu/projects/60917032/)

## Installation

To setup your development enviornment, open up your terminal, and do

```powershell
gh repo clone jessiejs/surfaceAPL
cd surfaceAPL
pnpm install
pnpm dev
```

## Build

If you have access to the Deno Deploy surfaceAPL project, run one of the following:

```powershell
./updateMajor.ps1 # for major updates
./updateMinor.ps1 # for feature additions
./updatePatch.ps1 # for bugfixes and other stuff
```

Otherwise just do

```powershell
pnpm build
```

## License

At the moment, surfaceAPL is closed source software, you shouldn't really be able to access this without jessie's permission. 😉
