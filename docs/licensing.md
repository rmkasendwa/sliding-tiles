# Licensing

Sliding Tiles is a multiplayer web application with authentication,
leaderboards, profiles, API services, deployable Docker images, and future
mobile-client ambitions. Its licensing needs are different from a small utility
library because most meaningful use happens over a network.

## Recommendation

Project-owned application code is licensed under **AGPL-3.0-only**.

This means you may run, study, share, and modify the code under the terms of
the GNU Affero General Public License version 3. If you modify Sliding Tiles
and make that modified version available to users over a network, those users
must be offered the corresponding source code for your modified version.

## Why AGPL-3.0

### AGPL-3.0

AGPL-3.0 is a copyleft open-source license designed for network server
software. It fits Sliding Tiles because the web client and shared API work
together as an online game platform. A hosted fork that changes the auth,
leaderboard, profile, gameplay, or deployment code must keep its modifications
available to the users of that hosted service.

Tradeoff: AGPL can make some commercial users cautious, and future relicensing
is harder once outside contributors own copyright in their contributions.

### MIT

MIT would be easier for broad reuse, commercial adoption, and embedding code in
other projects. It would also allow anyone to operate a closed hosted fork of
Sliding Tiles without publishing their modifications.

Tradeoff: MIT is excellent for libraries, but it gives up too much leverage for
a multiplayer web application where the server and network service are central
to the product.

### Source-available

A source-available license could restrict commercial hosting, resale, or
competition more directly while still letting people read the code.

Tradeoff: source-available terms are not generally considered open source, can
discourage community contribution, and require custom legal language. That is
more control than this repository currently needs.

## Scope

Unless another notice says otherwise:

- Project-owned source code is licensed under AGPL-3.0-only.
- Project documentation is shared under the same repository license for
  simplicity.
- Third-party packages remain under their own licenses.
- Third-party sounds, images, icons, and other assets remain under their own
  licenses.
- The Sliding Tiles name, branding, and project identity are not a trademark
  license. Do not use them to imply that an unofficial deployment is the
  official Sliding Tiles service.

Repository-level copyright and attribution notices live in `NOTICE`.

## Contributions

By contributing to this repository, you agree that your contribution is
licensed under AGPL-3.0-only, the same license as the project-owned code. You
retain copyright in your contribution unless a separate written agreement says
otherwise.

The project does not currently require a Contributor License Agreement. That
keeps contribution lightweight, but it also means a future license change may
require consent from affected contributors.

## Deployment Notes

If you deploy a modified version of Sliding Tiles, make source access clear to
users of that service. A footer link, about page, or repository link is a
practical way to satisfy the network-service spirit of AGPL-3.0 section 13.

The official footer surfaces the repository and license to keep this visible.

## SPDX

Use this SPDX identifier for project-owned source files when a file-level notice
is useful:

```text
AGPL-3.0-only
```
