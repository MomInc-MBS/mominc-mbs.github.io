# Coach activation

The printed QR addresses remain `/tv/?ch=<character>`. SAG is intentionally unchanged. Dr. Girlfriend uses `/tv/?ch=girlfriend`.

At the end of Armie, the creature television offers **Finish coach setup**. That requires Armie's recorded three-hall result and a valid creature recipe. The final form imports the site's saved draft answers, Armie intake, creature appearance, motion settings, Gala avatar and prior submissions. Every coach question must be answered before the activation button enables.

`onboarding-domain.mjs`, `onboarding-questions.mjs` and `onboarding-form.mjs` are shared with the Coach app. Keep those copies identical when changing the schema. The question IDs match the landing pages' q1/q2/q3 keys.

The activation button opens the existing Coach Site and transfers choices using a source-checked, origin-checked postMessage exchange. Personal answers never enter the transfer URL. Coach stores the transfer in session storage before sign-in, then validates and saves it to the authenticated account. If popups or storage are blocked, the draft stays on the website and the visitor gets a retry message.

Armie's game runs on a static public site. Its completion record is a local workflow attestation, not cryptographic proof of a played game or a paid entitlement. The app independently requires a complete, valid profile and owns its saved activation date, workout tickets and progress.

Public release requires the Coach Site to allow visitors as well as the website update. Account data still requires sign-in and stays isolated by user ID. The source repository remains the existing GitHub Pages site, so printed codes keep their origin and browser storage.
