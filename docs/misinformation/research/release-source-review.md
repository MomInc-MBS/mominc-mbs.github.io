# Release source review

Reviewed 2026-10-14. Scope: `data/release-expansion-content.json` (21 records) and `data/release-expansion-history.json` (16 records). This is a source and proposition review, not a claim that every linked archive has been independently reproduced or that the game has an exhaustive conspiracy database.

The bounded statements reviewed are suitable for their proposed two-button mapping: **Documented** describes the exact event/program/prosecution; **Unsupported claim** covers both unsupported and contradicted propositions, with the more precise evidence status retained in the reveal. Lack of support was not treated as proof that every imaginable related claim is false. Government research into an idea was not treated as proof that the idea worked.

## Corrections made

- **Roswell:** replaced the failing `media.defense.gov` link in the content JSON with the [official Air Force report hosted by NSA](https://www.nsa.gov/portals/75/documents/news-features/declassified-documents/ufo/report_af_roswell.pdf). The 22-page report is readable through the web tool and discusses Project MOGUL. The alien-spacecraft proposition remains **unsupported**, not a claim that all unidentified aerial reports are explained.
- **Idi Amin:** the individual National Archives lesson page returned **410 Gone**. Replaced it in the history JSON with the [official lesson PDF, page 10](https://cdn.nationalarchives.gov.uk/documents/education/ugandan-asians.pdf#page=10), which returns HTTP 200. Page 10 reproduces Cabinet record CAB 128/50, 8 August 1972, describing the order affecting Asian British-passport holders. Added this locator to the explanation. The statement remains about forced expulsion, not a speculative murder total.

No other factual or classification changes were required. No app files were edited.

## Focused checks

| Subject | Result and boundary |
| --- | --- |
| Philadelphia Experiment | [Navy archive account](https://www.history.navy.mil/research/library/online-reading-room/title-list-alphabetically/p/philadelphia-experiment.html) reports no confirming records and an itinerary inconsistent with the story. Retain unsupported optical invisibility/teleportation; do not conflate magnetic degaussing with either. Direct fetch had gateway/certificate limits; primary-site search returned the relevant account. |
| Hollow Moon / Earth | [NASA lunar composition](https://science.nasa.gov/moon/composition/) and [USGS Earth interior](https://www.usgs.gov/media/audio/what-do-we-know-about-interior-earth) describe internal layers. The literal empty-shell/no-core propositions are contradicted. Lunar seismic ringing and ordinary underground caverns are separate facts. |
| CERN | The old FAQ URL redirects to the [current LHC page](https://home.cern/science/accelerators/large-hadron-collider/), which retains the black-hole and collision-safety answers. The planet-consuming scenario is contradicted; do not claim that speculative microscopic objects are established experimental products. |
| Acoustikitty | [CIA's account](https://www.cia.gov/stories/story/natural-spies-animals-in-espionage/) explicitly records the fitted microphone/transmitter, limited tests, and no operational deployment. The program existed; successful operational cat surveillance is not asserted. |
| Project X-Ray | [Participant Jack Couffer's book description](https://utpress.utexas.edu/9780292718722/) supports testing bat-carried incendiaries. The [Smithsonian archival finding aid](https://www.si.edu/object/archives/components/sova-nasm-xxxx-1183-s-ref1764) independently lists the project documents. The full book/archival file was not inspected. No wartime deployment is asserted. |
| Strasbourg 1518 | [City museums' historical publication](https://www.musees.strasbourg.eu/edition/-/entity/id/3113559/1518%2BLa%2Bfi%25C3%25A8vre%2Bde%2Bla%2Bdanse) describes the episode and distinguishes original evidence from later exaggeration. Only the recorded dancing episode is graded; medical cause and death-count stories are excluded. |
| Pol Pot / leaders | ECCC's Pol Pot profile explicitly distinguishes historical findings from a conviction of him. Kambanda's plea and Taylor's planning/assistance convictions are identified proceedings. Stalin's repression and Amin's expulsion are defined acts, not personal death totals. |
| Zodiac / other criminal cases | Zodiac card describes documented FBI assistance without naming a suspect. Gacy identification, Rader disk forensics, Ridgway DNA arrest, and Franklin sentences match the cited investigative accounts. |

The remaining science, weather-research, archival-program, and disaster propositions were checked against their named institutional sources. STARGATE means funded research, AZORIAN an attempted/partial submarine recovery, Northwoods a proposal, and STORMFURY research rather than successful hurricane control.

## Availability, duplication, and limits

An HTTP GET sweep covered **36 unique source URLs**: 23 initially returned 200/206. The broken Idi Amin link was then replaced with a verified 200 PDF. Other failures were predominantly 403 filtering, plus a Navy certificate/gateway limitation and a Canada timeout; these were not automatically declared dead links. Several filtered URLs remained readable through primary-site search or web extraction. The raw snapshot is `data/release-links-check.json`; it predates the Idi Amin replacement and records that limitation explicitly here. Link availability may differ by browser and network.

The two inputs contain **37 records but 35 distinct additional topics**: `lake-nyos` repeats an ID, and `boston-molasses` / `molasses-flood` describe the same disaster with overlapping aliases. Deduplicate both when integrating. Editorial depth remains a proposed familiarity measure, independent of severity and truth. This review does not establish reuse rights for linked media or calibrate player rarity.
