# Security Policy

Milk handles credentials, dairy operations and live vehicle-location information. Do not publish exploitable vulnerabilities or real personal data in public issues.

## Reporting

Use GitHub's private vulnerability reporting / Report a vulnerability flow when available. Include affected commit, reproduction steps, impact and a minimal proof of concept. Do not include production credentials, live tokens or seller/driver coordinates.

If private reporting is unavailable, contact the maintainer privately through https://github.com/jayDevCodes. Do not publish exploit details in a public issue.

## Data handling

- Treat driver GPS, seller home coordinates, phone numbers and credentials as sensitive.
- Collect driver GPS only during a visibly active trip.
- Never expose other sellers' identities or exact home addresses to seller accounts.
- Scope business records to a dairy and authorize every server-side resource access.
- Rotate any exposed credential; removing it in a later commit does not make it safe.
