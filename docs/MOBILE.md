# Web and mobile product direction

## Shared product

Web, iOS, and Android should use the same authenticated server API, project permissions, document records, and pickup appointments. Payment and approval rules belong on the server and must not be duplicated as independent mobile authority.

## Delivery sequence

1. Stabilize the existing web workflow and complete authenticated browser acceptance testing.
2. Define a versioned API and authentication method usable by both browser and mobile clients.
3. Build the mobile client with project selection, camera document capture, extraction review, vendor records, and pickup scheduling.
4. Validate secure login, expired sessions, upload interruptions, permissions, and persistence on physical iOS and Android devices.
5. Configure signed mobile release builds and store submission using the owner's developer accounts.

The mobile client framework and hosting provider are not yet selected. A responsive website or installable web app must not be described as an App Store or Google Play application. Native mobile delivery is a separate build and verification milestone.

## Proposed repository evolution

Keep the current web source at the repository root for the first import so its existing build remains intact. Introduce a mobile directory and shared API contracts after selecting the mobile framework. Only move the web source into a monorepo layout when its CI and deployment paths have been updated and verified.

## Clarity requirements

Vendor payments should be directly discoverable from the project workspace. A signed out state should offer sign in. A project without eligible documents should offer upload. A populated project should offer scheduling. No screen should leave the user at a disabled action without a usable next step.
