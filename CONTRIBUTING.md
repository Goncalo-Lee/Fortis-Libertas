# Contributing Guide

This document explains how to work on **Fortis Libertas**: branches, commits,
versions and how to fix common Git mistakes.

## Table of Contents

1. [Branches](#branches)
2. [Commit Convention](#commit-convention)
3. [Versioning](#versioning)
4. [Workflow](#workflow)
5. [Troubleshooting](#troubleshooting)

---

## Branches

| Branch        | Purpose                                |
|---------------|----------------------------------------|
| `main`        | Stable code, always working            |
| `feat/<name>` | New feature (e.g. `feat/google-login`) |
| `fix/<name>`  | Bug fix (e.g. `fix/empty-password`)    |
| `docs/<name>` | Documentation only                     |

## Commit Convention

Format: `type(scope): short description`

| Type       | Use for                                     |
|------------|---------------------------------------------|
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation changes                       |
| `style`    | Formatting, spacing (no logic change)       |
| `refactor` | Code restructuring (no new feature, no fix) |
| `chore`    | Dependencies, configs, tooling              |

### Rules

- Use the imperative mood: `add`, not `added`.
- Keep the first line under ~50 characters.
- One commit = one logical change.

### Examples

```text
feat(auth): add Google sign-in button
fix(login): validate empty password field
docs(readme): add tech stack table
```

## Versioning

We follow [SemVer](https://semver.org/): `MAJOR.MINOR.PATCH`.

- `PATCH` (0.1.0 → 0.1.1): bug fix
- `MINOR` (0.1.0 → 0.2.0): new feature, nothing breaks
- `MAJOR` (0.2.0 → 1.0.0): breaking change

Creating a release tag:

```bash
git tag -a v0.1.0 -m "Login page first version"
git push origin v0.1.0
```

After tagging, move the `[Unreleased]` block in `CHANGELOG.md` to the new version.

## Workflow

1. Update `main`: `git switch main && git pull`
2. Create a branch: `git switch -c feat/my-feature`
3. Commit in small steps
4. Push and open a Pull Request
5. Merge, then update the `CHANGELOG.md`

## Troubleshooting

### I made a typo in my last commit message

```bash
git commit --amend -m "feat(auth): add Google sign-in button"
```

> Only do this **before** pushing.

### I forgot to add a file to my last commit

```bash
git add forgotten-file.html
git commit --amend --no-edit
```

### I want to undo my last commit but keep my changes

```bash
git reset --soft HEAD~1
```

The commit disappears, the changes stay staged and ready to be committed again.

### I committed on `main` by mistake

```bash
git branch feat/my-feature      # save the work in a new branch
git reset --hard origin/main    # reset main to the remote state
git switch feat/my-feature      # continue working there
```

> `--hard` discards local changes on `main`. Make sure the work is safe in the
new branch first.

### I already pushed a commit and want to undo it

Do **not** rewrite history on shared branches. Create a new commit that reverses
it:

```bash
git revert <commit-hash>
```

### I have a merge conflict

1. Run `git status` to see the conflicting files.
2. Open each file and look for the markers:

```text
   <<<<<<< HEAD
   your version
   =======
   incoming version
   >>>>>>> feat/other-branch
```

3. Keep the correct code and delete the markers.
4. Finish:

```bash
   git add .
   git commit
```

To cancel the merge: `git merge --abort`.

### I need to switch branches but have unfinished work

```bash
git stash          # saves the work temporarily
git switch other-branch
# ...
git switch -       # back to the previous branch
git stash pop      # restores the work
```

### I want to see what I changed before committing

```bash
git status
git diff            # unstaged changes
git diff --staged   # staged changes
```
