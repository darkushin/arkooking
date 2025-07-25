# Supabase CLI

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

To install the beta release channel:

```bash
npm i supabase@beta --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```


## Building a new supabase
1. You need to create new tables with the required fields. Pay attention to each field type.
2. Add the RLS policies to each table.
  - For the 'recipes' table, run the following SQL query:
  ```
  CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
  DECLARE
      user_role_value TEXT;
  BEGIN
      SELECT role::TEXT INTO user_role_value
      FROM public.profiles
      WHERE id = user_id;

      RETURN user_role_value;
  END;
  $function$;
  ```

  And then the following query to add all policies:
  ```
  -- Enable RLS if not already enabled
  ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

  -- 1️⃣ Editors and Admins can create recipes
  CREATE POLICY "Editors and Admins can create recipes"
  ON recipes
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    (auth.uid() IS NOT NULL)
    AND (get_user_role(auth.uid()) = ANY (ARRAY['Editor'::text, 'Admin'::text]))
  );

  -- 2️⃣ Users can create their own recipes
  CREATE POLICY "Users can create their own recipes"
  ON recipes
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    auth.uid() = user_id
  );

  -- 3️⃣ Users can delete their own recipes
  CREATE POLICY "Users can delete their own recipes"
  ON recipes
  FOR DELETE
  TO PUBLIC
  USING (
    auth.uid() = user_id
  );

  -- 4️⃣ Users can delete their own recipes or admins can delete any
  CREATE POLICY "Users can delete their own recipes or admins can delete any"
  ON recipes
  FOR DELETE
  TO PUBLIC
  USING (
    (
      (auth.uid() IS NOT NULL)
      AND (get_user_role(auth.uid()) = 'Editor'::text)
      AND (user_id = auth.uid())
    )
    OR (
      (auth.uid() IS NOT NULL)
      AND (get_user_role(auth.uid()) = 'Admin'::text)
      AND (visibility = 'public'::text)
    )
  );

  -- 5️⃣ Users can see public or their own private recipes
  CREATE POLICY "Users can see public or their own private recipes"
  ON recipes
  FOR SELECT
  TO PUBLIC
  USING (
    (visibility = 'public'::text)
    OR (
      (auth.uid() IS NOT NULL)
      AND (user_id = auth.uid())
    )
  );

  -- 6️⃣ Users can update their own recipes
  CREATE POLICY "Users can update their own recipes"
  ON recipes
  FOR UPDATE
  TO PUBLIC
  USING (
    auth.uid() = user_id
  );

  -- 7️⃣ Users can update their own recipes or admins can update any
  CREATE POLICY "Users can update their own recipes or admins can update any"
  ON recipes
  FOR UPDATE
  TO PUBLIC
  USING (
    (
      (auth.uid() IS NOT NULL)
      AND (get_user_role(auth.uid()) = 'Editor'::text)
      AND (user_id = auth.uid())
    )
    OR (
      (auth.uid() IS NOT NULL)
      AND (get_user_role(auth.uid()) = 'Admin'::text)
      AND (visibility = 'public'::text)
    )
  );

  -- 8️⃣ Users can view their own recipes
  CREATE POLICY "Users can view their own recipes"
  ON recipes
  FOR SELECT
  TO PUBLIC
  USING (
    auth.uid() = user_id
  );
  ```

2. Add the required Foreign Key Relations between the required table keys.