# Contributing

```sh
pnpm install        # also installs the git hooks
pnpm play           # the playground, with the plugin from src/
pnpm play:devtools  # the same, inside Vite DevTools
pnpm check          # lint, types, tests, build: what CI runs
```

`AGENTS.md` holds the rules of the code base, for people and agents alike. Commits follow
[Conventional Commits](https://www.conventionalcommits.org): the release notes are built from them.

## Try a change in a real project

Every pull request, and every push to `main`, publishes a build on [pkg.pr.new](https://pkg.pr.new).
The bot comments the install command on the pull request:

```sh
pnpm add -D https://pkg.pr.new/vite-annotate@<sha>
```

It needs the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new) installed on the repository,
once.

## Release

```sh
pnpm release
```

[bumpp](https://github.com/antfu-collective/bumpp) asks for the version, commits, tags `vX.Y.Z` and
pushes. The tag runs `.github/workflows/release.yml`, which runs the checks, publishes to npm with
provenance, then writes the GitHub release from the commits.

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): no token is
stored. The workflow can only publish a package that trusts it, and npm only lets a package that
already exists trust a workflow.

### First release

Once, before the first `pnpm release`, with npm 11.15+ and two-factor authentication on the npm
account:

1. Create the package without publishing a version: `npm stage publish` from the repository root
   (the build runs first). npm creates `vite-annotate` with a placeholder version, `0.0.0-stage`,
   and holds the staged version for review. Don't approve it.
2. Trust the release workflow, with the 2FA code:

   ```sh
   npm trust github vite-annotate --file release.yml --repo messenjer/vite-annotate --allow-publish
   ```

3. Within 48 hours, or the trust expires unused: `pnpm release`, version `0.1.0`. The workflow
   publishes it from GitHub Actions, with provenance.
4. On npmjs.com, in the package settings: require two-factor authentication and disallow tokens.
   Trusted publishing keeps working.
