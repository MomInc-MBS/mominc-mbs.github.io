// Original wording; exact propositions are source-backed. Altitude bands (0..7)
// and relative editorial answer-familiarity tiers (0..5) are independent.
// Answer tiers are not measured player frequencies and never rank harm or belief.
export const subjects = [
  {
    "id": "chemtrails",
    "name": "Chemtrails",
    "aliases": [
      "chemtrail",
      "chemtrail theory"
    ],
    "classification": "claim",
    "statement": "Ordinary persistent jet contrails are evidence of a secret, large-scale program spraying chemicals on the public.",
    "explanation": "EPA explains contrails as ice-crystal clouds and says it is not aware of evidence for the alleged deliberate release of harmful agents. Real agricultural spraying is a separate activity.",
    "source": "https://www.epa.gov/regulations-emissions-vehicles-and-engines/Contrails",
    "publisher": "US Environmental Protection Agency",
    "category": "Conspiracy claim",
    "depth": 0
  },
  {
    "id": "nibiru",
    "name": "Nibiru cataclysm",
    "aliases": [
      "nibiru",
      "planet x",
      "2012 planet collision"
    ],
    "classification": "claim",
    "statement": "A hidden planet called Nibiru was on course to collide with Earth in December 2012.",
    "explanation": "This failed prediction had no scientific basis. NASA/JPL addressed the supposed planet and the associated 2012 doomsday claims.",
    "source": "https://www.jpl.nasa.gov/blog/2009/11/2012-a-scientific-reality-check",
    "publisher": "NASA / Jet Propulsion Laboratory",
    "category": "Conspiracy claim",
    "depth": 0
  },
  {
    "id": "apollo",
    "name": "Apollo lunar reflectors",
    "aliases": [
      "apollo",
      "apollo 11",
      "moon reflectors",
      "lunar reflectors",
      "retroreflectors"
    ],
    "classification": "event",
    "statement": "Apollo missions placed laser retroreflector arrays on the Moon.",
    "explanation": "These are documented mission instruments used in lunar laser ranging. This question asks about the equipment, not every claim ever made about the Moon.",
    "source": "https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/",
    "publisher": "NASA",
    "category": "Documented science",
    "depth": 0
  },
  {
    "id": "mkultra",
    "name": "MKULTRA",
    "aliases": [
      "project mkultra"
    ],
    "classification": "event",
    "statement": "The CIA ran the MKULTRA behavioral-modification research program, which was examined in a 1977 Senate hearing.",
    "explanation": "The program and investigation are documented. That finding does not establish unrelated later allegations of universal or remote mind control.",
    "source": "https://www.cia.gov/library/abbottabad-compound/9D/9D9A27BD7241E2074EAF81C7FC2C86CF_MK.Ultra_Senate.Hearings.pdf",
    "publisher": "US Senate hearing / CIA archive",
    "category": "Documented program",
    "depth": 0
  },
  {
    "id": "cointelpro",
    "name": "COINTELPRO",
    "aliases": [
      "counter intelligence program"
    ],
    "classification": "event",
    "statement": "The FBI conducted domestic counterintelligence programs known as COINTELPRO.",
    "explanation": "FBI records document these programs. A real covert operation is still a documented event in this exact-statement question.",
    "source": "https://vault.fbi.gov/cointel-pro",
    "publisher": "FBI Records: The Vault",
    "category": "Documented program",
    "depth": 0
  },
  {
    "id": "tuskegee",
    "name": "Tuskegee syphilis study",
    "aliases": [
      "tuskegee",
      "tuskegee study",
      "usphs syphilis study"
    ],
    "classification": "event",
    "statement": "US Public Health Service researchers withheld appropriate treatment from men in the Tuskegee syphilis study.",
    "explanation": "The unethical study is documented. The men were not deliberately infected with syphilis as part of this study; that is a different, inaccurate claim.",
    "source": "https://www.cdc.gov/tuskegee/about/timeline.html",
    "publisher": "Centers for Disease Control and Prevention",
    "category": "Documented abuse",
    "depth": 0
  },
  {
    "id": "wtc",
    "name": "September 11 attacks",
    "aliases": [
      "9/11",
      "september 11",
      "world trade center",
      "wtc",
      "twin towers"
    ],
    "classification": "event",
    "statement": "The World Trade Center towers collapsed following the attacks on September 11, 2001.",
    "explanation": "The attacks and collapse are documented events. Specific allegations of a hidden cause would require separate statements and evidence.",
    "source": "https://www.nist.gov/publications/collapse-world-trade-center-towers-final-report-federal-building-and-fire-safety",
    "publisher": "National Institute of Standards and Technology",
    "category": "Documented tragedy",
    "depth": 1
  },
  {
    "id": "hindenburg",
    "name": "Hindenburg disaster",
    "aliases": [
      "hindenburg",
      "l z 129"
    ],
    "classification": "event",
    "statement": "The airship Hindenburg was destroyed in a fatal fire in New Jersey in 1937.",
    "explanation": "The disaster is documented. This card does not ask you to choose among proposed ignition causes.",
    "source": "https://prologue.blogs.archives.gov/2017/10/27/beyond-the-hindenburg-airships-throughout-history/",
    "publisher": "US National Archives",
    "category": "Documented tragedy",
    "depth": 1
  },
  {
    "id": "bundy",
    "name": "Ted Bundy",
    "aliases": [
      "bundy",
      "theodore bundy",
      "theodore robert bundy"
    ],
    "classification": "event",
    "statement": "Ted Bundy escaped custody and committed further violent crimes before his final arrest.",
    "explanation": "The FBI records his escapes and subsequent crimes. The score rewards the difficulty of recalling a name, never the number of victims.",
    "source": "https://www.fbi.gov/news/stories/serial-killers-part-3-ted-bundys-campaign-of-terror1",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 1
  },
  {
    "id": "dahmer",
    "name": "Jeffrey Dahmer",
    "aliases": [
      "dahmer",
      "jeff dahmer"
    ],
    "classification": "event",
    "statement": "Jeffrey Dahmer was arrested after a surviving man led police to his apartment in July 1991.",
    "explanation": "The investigation uncovered evidence of multiple murders. This is a documented criminal case.",
    "source": "https://www.fbi.gov/news/stories/serial-killers-part-7-jeffrey-dahmer",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 1
  },
  {
    "id": "hitler",
    "name": "Adolf Hitler",
    "aliases": [
      "hitler",
      "nazi regime",
      "nazi germany"
    ],
    "classification": "event",
    "statement": "The Nazi regime and its collaborators systematically murdered six million Jews during the Holocaust.",
    "explanation": "The Holocaust is a documented genocide. Recognition of a perpetrator is not praise, and atrocities do not increase an answer’s rarity score.",
    "source": "https://www.ushmm.org/holocaust/",
    "publisher": "United States Holocaust Memorial Museum",
    "category": "Documented atrocity",
    "depth": 0
  },
  {
    "id": "samphan",
    "name": "Khieu Samphan",
    "aliases": [
      "khieu",
      "samphan"
    ],
    "classification": "event",
    "statement": "Khieu Samphan, the former head of state of Democratic Kampuchea, was sentenced to life imprisonment for crimes including genocide.",
    "explanation": "The Extraordinary Chambers in the Courts of Cambodia document the judgment in Case 002. This card uses a court finding rather than a speculative personal death count.",
    "source": "https://www.eccc.gov.kh/en/cases/case-002",
    "publisher": "Extraordinary Chambers in the Courts of Cambodia",
    "category": "Documented atrocity",
    "depth": 0
  },
  {
    "id": "face-mars",
    "name": "Face on Mars",
    "aliases": [
      "Cydonia face",
      "Martian face"
    ],
    "classification": "claim",
    "statement": "The face-shaped formation in Cydonia on Mars is an artificial monument built by an alien civilization.",
    "explanation": "NASA identifies the feature as an eroded rock formation shaped by natural processes; shadows and image transmission errors helped create the face-like appearance.",
    "source": "https://science.nasa.gov/resource/geologic-face-on-mars-formation/",
    "publisher": "NASA/JPL-Caltech",
    "category": "Conspiracy claim",
    "depth": 2
  },
  {
    "id": "bermuda-triangle",
    "name": "Bermuda Triangle",
    "aliases": [
      "Devils Triangle"
    ],
    "classification": "claim",
    "statement": "A supernatural force in the Bermuda Triangle makes ships and aircraft disappear more frequently than in comparable busy ocean areas.",
    "explanation": "NOAA reports no evidence of an unusually high disappearance rate. A real disappearance does not establish a supernatural cause.",
    "source": "https://oceanservice.noaa.gov/facts/bermudatri.html",
    "publisher": "US National Oceanic and Atmospheric Administration",
    "category": "Conspiracy claim",
    "depth": 1
  },
  {
    "id": "haarp",
    "name": "HAARP weather-control claim",
    "aliases": [
      "HAARP",
      "High-frequency Active Auroral Research Program"
    ],
    "classification": "claim",
    "statement": "HAARP can control surface weather by heating the parts of the atmosphere where storms form.",
    "explanation": "The facility transmits radio waves that interact with the ionosphere. Its operating frequencies do not heat the lower atmospheric layers responsible for weather.",
    "source": "https://haarp.gi.alaska.edu/faq",
    "publisher": "University of Alaska Fairbanks Geophysical Institute",
    "category": "Conspiracy claim",
    "depth": 1
  },
  {
    "id": "philadelphia-experiment",
    "name": "Philadelphia Experiment",
    "aliases": [
      "Project Rainbow",
      "USS Eldridge teleportation"
    ],
    "classification": "claim",
    "statement": "In 1943, the US Navy made USS Eldridge optically invisible and teleported it between Philadelphia and Norfolk.",
    "explanation": "Navy archivists found no confirming records and describe the documented movements of Eldridge. Magnetic degaussing is real but does not make a ship invisible to human eyes or teleport it.",
    "source": "https://www.history.navy.mil/research/library/online-reading-room/title-list-alphabetically/p/philadelphia-experiment.html",
    "publisher": "US Naval History and Heritage Command",
    "category": "Conspiracy claim",
    "depth": 2
  },
  {
    "id": "lhc-doomsday",
    "name": "LHC doomsday black-hole claim",
    "aliases": [
      "LHC doomsday",
      "CERN black hole",
      "Large Hadron Collider black hole"
    ],
    "classification": "claim",
    "statement": "The Large Hadron Collider can create a stable black hole that grows until it swallows Earth.",
    "explanation": "CERN safety assessments reject this doomsday scenario. In speculative models that allow microscopic black holes, they would decay immediately rather than grow into a planet-consuming object.",
    "source": "https://home.cern/resources/faqs/large-hadron-collider-dangerous",
    "publisher": "CERN",
    "category": "Conspiracy claim",
    "depth": 3
  },
  {
    "id": "flat-earth",
    "name": "Flat Earth",
    "aliases": [
      "flat-earth theory",
      "flat Earth model"
    ],
    "classification": "claim",
    "statement": "Earth is physically a flat disc rather than an approximately spherical planet.",
    "explanation": "Observations including circumnavigation, lunar eclipses, and spaceflight establish the round Earth. Flat maps are projections, not evidence of a disc-shaped planet.",
    "source": "https://www.nasa.gov/earth/how-do-we-know-the-earth-isnt-flat-we-asked-a-nasa-expert-episode-53/",
    "publisher": "NASA",
    "category": "Conspiracy claim",
    "depth": 1
  },
  {
    "id": "hollow-earth",
    "name": "Hollow Earth",
    "aliases": [
      "hollow-earth theory"
    ],
    "classification": "claim",
    "statement": "Earth is an empty shell beneath its crust, with no mantle or metallic core.",
    "explanation": "Seismic and other geophysical evidence establishes a mantle, liquid outer core, and solid inner core. Caverns near the surface do not make the planet hollow.",
    "source": "https://www.usgs.gov/media/audio/what-do-we-know-about-interior-earth",
    "publisher": "US Geological Survey",
    "category": "Conspiracy claim",
    "depth": 1
  },
  {
    "id": "hollow-moon",
    "name": "Hollow Moon",
    "aliases": [
      "Spaceship Moon",
      "hollow-moon theory"
    ],
    "classification": "claim",
    "statement": "The Moon is an empty artificial shell with no rocky mantle or metallic core.",
    "explanation": "Lunar measurements support a layered body with a crust, mantle, and core. This statement grades the hollow-shell assertion, not whether the Moon produces long-lasting seismic vibrations.",
    "source": "https://science.nasa.gov/moon/composition/",
    "publisher": "NASA",
    "category": "Conspiracy claim",
    "depth": 2
  },
  {
    "id": "mars-doorway",
    "name": "Mars doorway claim",
    "aliases": [
      "Mars doorway",
      "door on Mars",
      "Curiosity doorway",
      "East Cliffs doorway"
    ],
    "classification": "claim",
    "statement": "The doorway-like opening Curiosity photographed at East Cliffs in May 2022 was constructed by a Martian civilization.",
    "explanation": "NASA describes the opening as a small, naturally occurring fracture in bedrock. Its doorway-like outline is not evidence of an engineered entrance.",
    "source": "https://science.nasa.gov/photojournal/door-shaped-fracture-spotted-by-curiosity-at-east-cliffs/",
    "publisher": "NASA/JPL-Caltech/MSSS",
    "category": "Conspiracy claim",
    "depth": 2
  },
  {
    "id": "roswell-alien-craft",
    "name": "Roswell extraterrestrial-craft claim",
    "aliases": [
      "Roswell",
      "Roswell incident",
      "Roswell UFO crash"
    ],
    "classification": "claim",
    "statement": "The wreckage recovered near Roswell in July 1947 was an extraterrestrial spacecraft.",
    "explanation": "The Air Force record review identified balloon equipment associated with Project MOGUL as the most likely source and found no records of recovered extraterrestrial materials. This does not classify every unidentified aerial report.",
    "source": "https://www.nsa.gov/portals/75/documents/news-features/declassified-documents/ufo/report_af_roswell.pdf",
    "publisher": "US Air Force",
    "category": "Conspiracy claim",
    "depth": 0
  },
  {
    "id": "acoustikitty",
    "name": "Acoustikitty",
    "aliases": [
      "Acoustic Kitty",
      "Acoustic Kitten"
    ],
    "classification": "event",
    "statement": "The CIA experimented with a cat fitted with a microphone and transmitter to eavesdrop on conversations.",
    "explanation": "The CIA acknowledges this 1960s experiment. The technology worked, but directing the cat proved impractical; this is not evidence of an operational army of spy cats.",
    "source": "https://www.cia.gov/stories/story/natural-spies-animals-in-espionage/",
    "publisher": "US Central Intelligence Agency",
    "category": "Documented program",
    "depth": 5
  },
  {
    "id": "stargate",
    "name": "STARGATE remote-viewing research",
    "aliases": [
      "STARGATE",
      "Stargate Project",
      "Project Stargate"
    ],
    "classification": "event",
    "statement": "US intelligence agencies funded research into remote viewing under programs that included STARGATE.",
    "explanation": "The funding and research program are documented. The existence of that research is not proof that psychic spying works; operational usefulness was assessed as unreliable.",
    "source": "https://www.cia.gov/stories/story/ask-molly-did-cia-really-study-psychic-powers/",
    "publisher": "US Central Intelligence Agency",
    "category": "Documented program",
    "depth": 4
  },
  {
    "id": "azorian",
    "name": "Project AZORIAN",
    "aliases": [
      "AZORIAN",
      "Glomar Explorer",
      "Hughes Glomar Explorer"
    ],
    "classification": "event",
    "statement": "The CIA used the Hughes Glomar Explorer in a secret attempt to recover a sunken Soviet submarine from the Pacific seabed.",
    "explanation": "The vessel had a deep-sea mining cover story. The recovery effort took place, but a section broke apart during the lift, so do not describe it as a complete recovery.",
    "source": "https://www.cia.gov/legacy/museum/exhibit/project-azorian/",
    "publisher": "US Central Intelligence Agency",
    "category": "Documented program",
    "depth": 5
  },
  {
    "id": "stormfury",
    "name": "Project STORMFURY",
    "aliases": [
      "STORMFURY"
    ],
    "classification": "event",
    "statement": "Between 1962 and 1982, NOAA supported Project STORMFURY research into whether hurricane intensity could be modified.",
    "explanation": "The historical experiment is documented. It does not establish that NOAA can create or steer modern hurricanes.",
    "source": "https://www.noaa.gov/news/fact-check-debunking-weather-modification-claims",
    "publisher": "US National Oceanic and Atmospheric Administration",
    "category": "Documented research",
    "depth": 4
  },
  {
    "id": "saturn-hexagon",
    "name": "Saturn’s polar hexagon",
    "aliases": [
      "Saturn's hexagon",
      "Saturn hexagon",
      "Saturn polar hexagon"
    ],
    "classification": "event",
    "statement": "Saturn has a six-sided atmospheric jet stream around its north pole.",
    "explanation": "Voyager and Cassini observed this atmospheric pattern. Its geometry does not establish an artificial structure or a supernatural symbol.",
    "source": "https://science.nasa.gov/resource/saturns-streaming-hexagon-storm/",
    "publisher": "NASA/JPL-Caltech",
    "category": "Documented space phenomenon",
    "depth": 3
  },
  {
    "id": "northwoods",
    "name": "Operation NORTHWOODS proposal",
    "aliases": [
      "NORTHWOODS",
      "Operation Northwoods"
    ],
    "classification": "event",
    "statement": "In 1962, the US Joint Chiefs of Staff proposed staged incidents that could be blamed on Cuba to justify military intervention.",
    "explanation": "The declassified memorandum documents a proposal. This card does not claim that the proposed attacks were approved or carried out.",
    "source": "https://nsarchive2.gwu.edu/news/20010430/northwoods.pdf",
    "publisher": "US Joint Chiefs of Staff; primary document hosted by National Security Archive, George Washington University",
    "category": "Documented proposal",
    "depth": 4
  },
  {
    "id": "molasses-flood",
    "name": "Great Molasses Flood",
    "aliases": [
      "Boston Molasses Flood",
      "Boston molasses disaster",
      "Molasses Flood",
      "1919 Molasses Flood"
    ],
    "classification": "event",
    "statement": "A burst storage tank sent a deadly flood of molasses through Boston’s North End in January 1919.",
    "explanation": "Boston City Archives documents the industrial disaster and its victims. The unusual material does not make the event fictional.",
    "source": "https://www.boston.gov/news/100-years-ago-today-molasses-crashes-through-bostons-north-end",
    "publisher": "City of Boston / Boston City Archives",
    "category": "Documented tragedy",
    "depth": 1
  },
  {
    "id": "lake-nyos",
    "name": "Lake Nyos gas disaster",
    "aliases": [
      "Lake Nyos",
      "Lake Nyos disaster",
      "Nyos disaster",
      "Nyos",
      "Nyos gas disaster"
    ],
    "classification": "event",
    "statement": "A catastrophic release of carbon dioxide from Lake Nyos in Cameroon caused mass fatalities in August 1986.",
    "explanation": "The US scientific investigation identified a lethal carbon-dioxide cloud from the lake. The precise trigger of the release was not established by that report, and this card does not grade it.",
    "source": "https://pubs.usgs.gov/of/1987/0097/report.pdf",
    "publisher": "US Geological Survey",
    "category": "Documented tragedy",
    "depth": 5
  },
  {
    "id": "project-xray",
    "name": "Project X-Ray bat-bomb research",
    "aliases": [
      "Project X-Ray",
      "bat bomb",
      "bat bombs"
    ],
    "classification": "event",
    "statement": "During World War II, US researchers tested the idea of using bats to carry small incendiary bombs.",
    "explanation": "The bat-bomb research was real. This statement concerns testing, not a claim that bat bombs were deployed against Japanese cities.",
    "source": "https://utpress.utexas.edu/9780292718722/",
    "publisher": "University of Texas Press; account by project participant Jack Couffer",
    "category": "Documented research",
    "depth": 6
  },
  {
    "id": "paperclip",
    "name": "Operation Paperclip",
    "aliases": [
      "Project Paperclip",
      "Paperclip"
    ],
    "classification": "event",
    "statement": "After World War II, the United States recruited German and Austrian scientists through the program known as Paperclip.",
    "explanation": "National Archives records describe the recruitment and disputes over Nazi affiliations. This is not an assertion that every recruit had the same background or committed the same crimes.",
    "source": "https://www.archives.gov/iwg/reports/nazi-war-crimes-interim-report-october-1999",
    "publisher": "US National Archives",
    "category": "Documented program",
    "depth": 0
  },
  {
    "id": "project-blue-book",
    "name": "Project Blue Book",
    "aliases": [
      "Blue Book",
      "USAF Blue Book"
    ],
    "classification": "event",
    "statement": "The US Air Force operated a program called Project Blue Book to investigate reports of unidentified flying objects.",
    "explanation": "The investigation program and its records are real. An unexplained report is not automatically proof of an extraterrestrial spacecraft.",
    "source": "https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104590/unidentified-flying-objects-and-air-force-project-blue-book/",
    "publisher": "US Air Force",
    "category": "Documented program",
    "depth": 0
  },
  {
    "id": "zodiac",
    "name": "Zodiac Killer case",
    "aliases": [
      "Zodiac",
      "Zodiac Killer",
      "Zodiac letters"
    ],
    "classification": "event",
    "statement": "The FBI examined handwriting and fingerprints on letters and envelopes attributed to the Zodiac Killer.",
    "explanation": "The FBI archive documents forensic assistance in this real Northern California murder investigation. This card does not identify any proposed suspect as the killer or treat an unproven identity theory as fact.",
    "source": "https://archives.fbi.gov/archives/news/stories/2007/march/zodiac_030207",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 1
  },
  {
    "id": "rader",
    "name": "Dennis Rader",
    "aliases": [
      "BTK",
      "BTK Killer",
      "Dennis Lynn Rader"
    ],
    "classification": "event",
    "statement": "A forensic examination of a floppy disk sent to a television station helped investigators identify Dennis Rader, the BTK killer.",
    "explanation": "The FBI describes its regional computer-forensics laboratory helping Wichita investigators examine the disk. The statement concerns a documented investigative technique, not an invented mind-reading method.",
    "source": "https://archives.fbi.gov/archives/news/stories/2006/april/rclf042406",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 1
  },
  {
    "id": "ridgway",
    "name": "Gary Ridgway",
    "aliases": [
      "Gary Leon Ridgway",
      "Green River Killer",
      "The Green River Killer"
    ],
    "classification": "event",
    "statement": "Police arrested Gary Ridgway in November 2001 after DNA evidence linked him to a victim in the Green River killings.",
    "explanation": "The FBI Seattle field-office history records the DNA identification and arrest. This card grades that documented investigation rather than speculation about additional crimes or a comparison of victim counts.",
    "source": "https://www.fbi.gov/history/field-office-histories/seattle",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 3
  },
  {
    "id": "gacy",
    "name": "John Wayne Gacy",
    "aliases": [
      "John Gacy",
      "Gacy"
    ],
    "classification": "event",
    "statement": "In 2021, Cook County investigators identified one of John Wayne Gacy's previously unidentified victims as Francis Wayne Alexander using genetic genealogy and DNA comparisons.",
    "explanation": "The investigating sheriff's office announced the identification and described confirmation with relatives' DNA. This is a documented identification of a victim, not a score based on how many people an offender killed.",
    "source": "https://www.cookcountysheriff.org/john-wayne-gacy-victim-identified/",
    "publisher": "Cook County Sheriff's Office",
    "category": "Documented criminal case",
    "depth": 1
  },
  {
    "id": "joseph-franklin",
    "name": "Joseph Paul Franklin",
    "aliases": [
      "Joseph Franklin"
    ],
    "classification": "event",
    "statement": "Joseph Paul Franklin was convicted in multiple racially motivated attacks and received life and death sentences in different states.",
    "explanation": "The FBI case history documents Franklin's racist violence and criminal sentences. The card identifies a historical prosecution; it does not endorse his ideology or use violence severity as a rarity measure.",
    "source": "https://www.fbi.gov/news/stories/serial-killers-part-4",
    "publisher": "Federal Bureau of Investigation",
    "category": "Documented criminal case",
    "depth": 7
  },
  {
    "id": "stalin",
    "name": "Joseph Stalin",
    "aliases": [
      "Josef Stalin",
      "Stalin",
      "Iosif Stalin",
      "Ioseb Jughashvili"
    ],
    "classification": "event",
    "statement": "During the 1930s, Stalin's government carried out political purges involving imprisonment, exile, and executions.",
    "explanation": "The United States Holocaust Memorial Museum records the purges of the Soviet party, government, armed forces, and intelligentsia. This statement does not ask for a contested personal death total or imply that every allegation about Stalin is established.",
    "source": "https://encyclopedia.ushmm.org/content/en/article/josef-stalin",
    "publisher": "United States Holocaust Memorial Museum",
    "category": "Documented state repression",
    "depth": 0
  },
  {
    "id": "pol-pot",
    "name": "Pol Pot",
    "aliases": [
      "Saloth Sar",
      "Brother Number One",
      "Brother No 1"
    ],
    "classification": "event",
    "statement": "Pol Pot headed Democratic Kampuchea's government, and ECCC historical findings identify him as a planner of forced evacuations from cities to rural areas.",
    "explanation": "The tribunal's profile records his premiership and evacuation planning. It explicitly warns that he was not an accused person in ECCC proceedings, so those historical findings must not be described as an ECCC conviction of Pol Pot.",
    "source": "https://www.eccc.gov.kh/en/directory/khmer-rouge-profile/saloth-sar",
    "publisher": "Extraordinary Chambers in the Courts of Cambodia",
    "category": "Documented state repression",
    "depth": 0
  },
  {
    "id": "idi-amin",
    "name": "Idi Amin",
    "aliases": [
      "Idi Amin Dada",
      "Amin"
    ],
    "classification": "event",
    "statement": "In 1972, Idi Amin ordered Asian holders of British passports to leave Uganda.",
    "explanation": "British Cabinet records from 8 August 1972 (CAB 128/50; source packet page 10) describe the expulsion order and the resulting responsibility for displaced passport holders. This statement concerns forced expulsion, not an adjudicated murder total.",
    "source": "https://cdn.nationalarchives.gov.uk/documents/education/ugandan-asians.pdf#page=10",
    "publisher": "The National Archives, United Kingdom",
    "category": "Documented state repression",
    "depth": 0
  },
  {
    "id": "charles-taylor",
    "name": "Charles Taylor",
    "aliases": [
      "Charles Ghankay Taylor"
    ],
    "classification": "event",
    "statement": "The Special Court for Sierra Leone convicted former Liberian president Charles Taylor of planning, and aiding and abetting, crimes committed by rebel forces during Sierra Leone's civil war.",
    "explanation": "The court records convictions for war crimes, crimes against humanity, and other serious violations, upheld on appeal. Legal responsibility for planning or assisting crimes is distinct from claiming he personally carried out every offense.",
    "source": "https://rscsl.org/press-releases/trial-chamber-denies-taylor-motion-to-serve-his-sentence-in-rwanda/",
    "publisher": "Residual Special Court for Sierra Leone",
    "category": "Documented atrocity judgment",
    "depth": 6
  },
  {
    "id": "kambanda",
    "name": "Jean Kambanda",
    "aliases": [
      "Kambanda"
    ],
    "classification": "event",
    "statement": "In May 1998, former Rwandan prime minister Jean Kambanda pleaded guilty to genocide and crimes against humanity before the International Criminal Tribunal for Rwanda.",
    "explanation": "The tribunal's contemporary announcement records his guilty pleas and the court's acceptance of them. This card concerns an identified legal proceeding, not a generalized claim about an entire population or a speculative personal death toll.",
    "source": "https://unictr.irmct.org/en/news/ex-rwandan-prime-minister-jean-kambanda-pleads-guilty-genocide",
    "publisher": "United Nations International Criminal Tribunal for Rwanda",
    "category": "Documented atrocity judgment",
    "depth": 7
  },
  {
    "id": "tunguska",
    "name": "Tunguska event",
    "aliases": [
      "Tunguska",
      "Tunguska explosion",
      "Tunguska airburst"
    ],
    "classification": "event",
    "statement": "A powerful airburst over Siberia in June 1908 flattened and scorched large areas of forest.",
    "explanation": "NASA describes the Tunguska event and the physical evidence documented by later expeditions. The event is real; the exact incoming object and its dimensions remain scientific questions, and this card makes no alien-spacecraft claim.",
    "source": "https://science.nasa.gov/earth/earth-observatory/a-cosmic-explosion-over-siberia-154488/",
    "publisher": "NASA Earth Observatory",
    "category": "Documented natural event",
    "depth": 1
  },
  {
    "id": "carrington",
    "name": "Carrington event",
    "aliases": [
      "Carrington",
      "1859 solar storm",
      "1859 geomagnetic storm",
      "Carrington solar storm"
    ],
    "classification": "event",
    "statement": "The 1859 Carrington event disrupted telegraph systems, with operators reporting sparks and equipment fires.",
    "explanation": "NOAA records these effects of an extreme geomagnetic storm. The card concerns historical space-weather impacts, not a prediction of an imminent worldwide catastrophe.",
    "source": "https://www.nesdis.noaa.gov/news/when-solar-storms-attack-space-weather-and-our-infrastructure",
    "publisher": "National Oceanic and Atmospheric Administration",
    "category": "Documented natural event",
    "depth": 3
  },
  {
    "id": "halifax",
    "name": "Halifax Explosion",
    "aliases": [
      "1917 Halifax Explosion",
      "Halifax Harbour Explosion",
      "Mont Blanc explosion"
    ],
    "classification": "event",
    "statement": "In December 1917, the ships Imo and Mont Blanc collided in Halifax Harbour; fire aboard the munitions-carrying Mont Blanc led to a devastating explosion.",
    "explanation": "Parks Canada records the collision, fire, and explosion. The statement concerns the documented sequence of events and does not assign disputed individual blame or award points for casualties.",
    "source": "https://www.canada.ca/en/parks-canada/news/2016/07/the-halifax-explosion.html",
    "publisher": "Parks Canada",
    "category": "Documented tragedy",
    "depth": 1
  },
  {
    "id": "dancing-plague",
    "name": "Strasbourg dancing episode of 1518",
    "aliases": [
      "Dancing Plague",
      "Dancing Plague of 1518",
      "Strasbourg Dancing Plague",
      "Dancing Mania",
      "1518 dancing epidemic"
    ],
    "classification": "event",
    "statement": "Municipal historical sources describe an episode of prolonged public dancing in Strasbourg in July 1518.",
    "explanation": "Strasbourg's museums distinguish the recorded episode from later exaggerated interpretations. This card does not assert a settled medical cause, supernatural compulsion, a verified death toll, or the popular claim that people literally danced themselves to death.",
    "source": "https://www.musees.strasbourg.eu/edition/-/entity/id/3113559/1518%2BLa%2Bfi%25C3%25A8vre%2Bde%2Bla%2Bdanse",
    "publisher": "Museums of the City of Strasbourg",
    "category": "Documented unusual history",
    "depth": 6
  }
];

export const questions = [
  {
    "id": "sky",
    "band": 0,
    "prompt": "Name a space mission, celestial claim, or alleged sky-spraying program in the archive.",
    "hint": "Think about instruments left beyond Earth, a failed prediction, or how an unfamiliar object in the sky is interpreted.",
    "answers": [
      {
        "id": "chemtrails",
        "tier": 0
      },
      {
        "id": "apollo",
        "tier": 3
      },
      {
        "id": "nibiru",
        "tier": 5
      },
      {
        "id": "roswell-alien-craft",
        "tier": 2
      }
    ]
  },
  {
    "id": "secrets",
    "band": 0,
    "prompt": "Name a documented US intelligence, military-research, or unethical-study program.",
    "hint": "The records cover covert work, recruitment after a war, and research that violated the people involved.",
    "answers": [
      {
        "id": "mkultra",
        "tier": 2
      },
      {
        "id": "cointelpro",
        "tier": 4
      },
      {
        "id": "tuskegee",
        "tier": 5
      },
      {
        "id": "paperclip",
        "tier": 3
      },
      {
        "id": "project-blue-book",
        "tier": 1
      }
    ]
  },
  {
    "id": "power-and-records",
    "band": 0,
    "prompt": "Name a leader connected to documented state repression or an atrocity case.",
    "hint": "A European dictatorship, an African expulsion order, or the leadership of Democratic Kampuchea provides a starting point.",
    "answers": [
      {
        "id": "hitler",
        "tier": 0
      },
      {
        "id": "stalin",
        "tier": 1
      },
      {
        "id": "pol-pot",
        "tier": 3
      },
      {
        "id": "idi-amin",
        "tier": 4
      },
      {
        "id": "samphan",
        "tier": 5
      }
    ]
  },
  {
    "id": "case-files",
    "band": 1,
    "prompt": "Name a serial killer or an unidentified serial-killer case documented in the archive.",
    "hint": "Think of US investigations involving letters, an escaped prisoner, an apartment discovery, or computer evidence.",
    "answers": [
      {
        "id": "bundy",
        "tier": 1
      },
      {
        "id": "dahmer",
        "tier": 2
      },
      {
        "id": "gacy",
        "tier": 3
      },
      {
        "id": "zodiac",
        "tier": 4
      },
      {
        "id": "rader",
        "tier": 5
      }
    ]
  },
  {
    "id": "sudden-disasters",
    "band": 1,
    "prompt": "Name a documented disaster or attack involving a vehicle, an explosion, or a failed storage tank.",
    "hint": "The archive stretches from an airship fire to a harbor collision and an industrial spill with an unexpectedly deadly material.",
    "answers": [
      {
        "id": "wtc",
        "tier": 0
      },
      {
        "id": "hindenburg",
        "tier": 1
      },
      {
        "id": "tunguska",
        "tier": 3
      },
      {
        "id": "molasses-flood",
        "tier": 4
      },
      {
        "id": "halifax",
        "tier": 5
      }
    ]
  },
  {
    "id": "earth-claims",
    "band": 1,
    "prompt": "Name an unsupported claim about Earth's shape, interior, weather, or mysterious disappearances.",
    "hint": "Consider an alternative planetary model, a supposedly all-powerful radio array, or a famous Atlantic legend.",
    "answers": [
      {
        "id": "flat-earth",
        "tier": 0
      },
      {
        "id": "bermuda-triangle",
        "tier": 2
      },
      {
        "id": "hollow-earth",
        "tier": 4
      },
      {
        "id": "haarp",
        "tier": 5
      }
    ]
  },
  {
    "id": "alien-appearances",
    "band": 2,
    "prompt": "Name an archive claim that gives a planet, moon, or photographed feature an extraordinary hidden identity.",
    "hint": "Low-resolution shapes, a small opening in rock, and theories about what lies inside the Moon all appear in these files.",
    "answers": [
      {
        "id": "nibiru",
        "tier": 2
      },
      {
        "id": "mars-doorway",
        "tier": 3
      },
      {
        "id": "face-mars",
        "tier": 4
      },
      {
        "id": "hollow-moon",
        "tier": 5
      }
    ]
  },
  {
    "id": "classified-and-declassified",
    "band": 2,
    "prompt": "Name a documented US government study, investigation, recruitment effort, or covert program.",
    "hint": "Look for records about unexplained sightings, scientists recruited after World War II, or intelligence agencies operating at home.",
    "answers": [
      {
        "id": "project-blue-book",
        "tier": 1
      },
      {
        "id": "paperclip",
        "tier": 2
      },
      {
        "id": "mkultra",
        "tier": 3
      },
      {
        "id": "tuskegee",
        "tier": 4
      },
      {
        "id": "cointelpro",
        "tier": 5
      }
    ]
  },
  {
    "id": "signals-and-legends",
    "band": 2,
    "prompt": "Name an archive subject involving government secrecy or a contested explanation about the sky.",
    "hint": "A naval teleportation story belongs here alongside real investigations and allegations about aircraft trails.",
    "answers": [
      {
        "id": "chemtrails",
        "tier": 0
      },
      {
        "id": "roswell-alien-craft",
        "tier": 1
      },
      {
        "id": "project-blue-book",
        "tier": 2
      },
      {
        "id": "haarp",
        "tier": 3
      },
      {
        "id": "philadelphia-experiment",
        "tier": 5
      }
    ]
  },
  {
    "id": "space-and-natural-science",
    "band": 3,
    "prompt": "Name documented space science, a striking planetary feature, or an unusual natural event.",
    "hint": "Laser-ranging hardware, unusual weather on another planet, and a storm that disrupted nineteenth-century communications are useful leads.",
    "answers": [
      {
        "id": "apollo",
        "tier": 1
      },
      {
        "id": "tunguska",
        "tier": 2
      },
      {
        "id": "saturn-hexagon",
        "tier": 3
      },
      {
        "id": "carrington",
        "tier": 5
      }
    ]
  },
  {
    "id": "forensic-trail",
    "band": 3,
    "prompt": "Name a criminal case in the archive involving evidence used to identify an offender or a victim.",
    "hint": "Think beyond a confession: letters, DNA, a recovered digital file, or genetic genealogy can connect a name to a case.",
    "answers": [
      {
        "id": "dahmer",
        "tier": 0
      },
      {
        "id": "gacy",
        "tier": 1
      },
      {
        "id": "rader",
        "tier": 2
      },
      {
        "id": "zodiac",
        "tier": 4
      },
      {
        "id": "ridgway",
        "tier": 5
      }
    ]
  },
  {
    "id": "impossible-machines",
    "band": 3,
    "prompt": "Name an unsupported claim about a research machine, a transformed ship, or an artificial celestial body.",
    "hint": "These stories turn radio research, high-energy collisions, or a ship's magnetic defenses into extraordinary powers.",
    "answers": [
      {
        "id": "haarp",
        "tier": 2
      },
      {
        "id": "hollow-moon",
        "tier": 3
      },
      {
        "id": "philadelphia-experiment",
        "tier": 4
      },
      {
        "id": "lhc-doomsday",
        "tier": 5
      }
    ]
  },
  {
    "id": "strange-research-records",
    "band": 4,
    "prompt": "Name a documented US research program, intelligence operation, or proposed deceptive operation.",
    "hint": "An actual research budget does not prove the hoped-for effect worked; distinguish the existence of a project from its ambitions.",
    "answers": [
      {
        "id": "mkultra",
        "tier": 1
      },
      {
        "id": "cointelpro",
        "tier": 2
      },
      {
        "id": "stargate",
        "tier": 4
      },
      {
        "id": "stormfury",
        "tier": 5
      },
      {
        "id": "northwoods",
        "tier": 5
      }
    ]
  },
  {
    "id": "read-the-image",
    "band": 4,
    "prompt": "Name an unsupported claim that gives research, a spacecraft image, or the Moon an extraordinary hidden meaning.",
    "hint": "Some interpretations concern a facility on Earth; others mistake natural shapes in spacecraft photographs for engineering.",
    "answers": [
      {
        "id": "haarp",
        "tier": 1
      },
      {
        "id": "face-mars",
        "tier": 2
      },
      {
        "id": "lhc-doomsday",
        "tier": 3
      },
      {
        "id": "hollow-moon",
        "tier": 4
      },
      {
        "id": "mars-doorway",
        "tier": 5
      }
    ]
  },
  {
    "id": "official-abuse-records",
    "band": 4,
    "prompt": "Name a documented government abuse, repression policy, or proposed deceptive operation.",
    "hint": "The files include withholding treatment, forced removal, and a plan whose existence must not be confused with its execution.",
    "answers": [
      {
        "id": "stalin",
        "tier": 1
      },
      {
        "id": "tuskegee",
        "tier": 2
      },
      {
        "id": "idi-amin",
        "tier": 3
      },
      {
        "id": "pol-pot",
        "tier": 4
      },
      {
        "id": "northwoods",
        "tier": 5
      }
    ]
  },
  {
    "id": "unlikely-intelligence",
    "band": 5,
    "prompt": "Name a documented intelligence project or proposed deception with an unusual target, method, or cover story.",
    "hint": "A deep-ocean recovery vessel, an animal fitted with electronics, or research into distant perception offers a route into these files.",
    "answers": [
      {
        "id": "mkultra",
        "tier": 1
      },
      {
        "id": "northwoods",
        "tier": 3
      },
      {
        "id": "stargate",
        "tier": 4
      },
      {
        "id": "azorian",
        "tier": 5
      },
      {
        "id": "acoustikitty",
        "tier": 5
      }
    ]
  },
  {
    "id": "unlikely-disaster",
    "band": 5,
    "prompt": "Name a documented disaster or natural event involving an unexpected material or physical process.",
    "hint": "An invisible gas cloud, an industrial food ingredient, and extreme space weather are different kinds of real hazards.",
    "answers": [
      {
        "id": "hindenburg",
        "tier": 0
      },
      {
        "id": "halifax",
        "tier": 1
      },
      {
        "id": "molasses-flood",
        "tier": 2
      },
      {
        "id": "tunguska",
        "tier": 3
      },
      {
        "id": "carrington",
        "tier": 4
      },
      {
        "id": "lake-nyos",
        "tier": 5
      }
    ]
  },
  {
    "id": "hidden-geography",
    "band": 5,
    "prompt": "Name a place or physical object given an unsupported extraordinary explanation in the archive.",
    "hint": "Look for stories about an ocean region, the inside of a moon, or a formation that seems artificial in a photograph.",
    "answers": [
      {
        "id": "roswell-alien-craft",
        "tier": 1
      },
      {
        "id": "face-mars",
        "tier": 2
      },
      {
        "id": "mars-doorway",
        "tier": 3
      },
      {
        "id": "hollow-moon",
        "tier": 4
      },
      {
        "id": "bermuda-triangle",
        "tier": 5
      }
    ]
  },
  {
    "id": "stranger-than-fiction",
    "band": 6,
    "prompt": "Name a documented historical episode or natural event whose brief description sounds invented.",
    "hint": "Consider reports of prolonged public dancing, a lethal lake release, or an unusual industrial flood; causes and later embellishments remain separate.",
    "answers": [
      {
        "id": "tunguska",
        "tier": 1
      },
      {
        "id": "molasses-flood",
        "tier": 2
      },
      {
        "id": "lake-nyos",
        "tier": 3
      },
      {
        "id": "carrington",
        "tier": 4
      },
      {
        "id": "dancing-plague",
        "tier": 5
      }
    ]
  },
  {
    "id": "military-invention-files",
    "band": 6,
    "prompt": "Name a documented military research project, intelligence operation, or deception proposal.",
    "hint": "Some files concern miniature incendiaries carried by animals, others a salvage ship or attempts to alter storms; proposals and deployment are different facts.",
    "answers": [
      {
        "id": "project-blue-book",
        "tier": 0
      },
      {
        "id": "paperclip",
        "tier": 1
      },
      {
        "id": "stormfury",
        "tier": 2
      },
      {
        "id": "northwoods",
        "tier": 3
      },
      {
        "id": "azorian",
        "tier": 4
      },
      {
        "id": "project-xray",
        "tier": 5
      }
    ]
  },
  {
    "id": "responsibility-in-the-record",
    "band": 6,
    "prompt": "Name a leader connected to documented repression, forced expulsion, or an atrocity judgment.",
    "hint": "The sources distinguish a Liberian president tried for assisting crimes from Cambodian historical findings and a Ugandan expulsion order.",
    "answers": [
      {
        "id": "hitler",
        "tier": 0
      },
      {
        "id": "stalin",
        "tier": 1
      },
      {
        "id": "idi-amin",
        "tier": 2
      },
      {
        "id": "pol-pot",
        "tier": 3
      },
      {
        "id": "samphan",
        "tier": 4
      },
      {
        "id": "charles-taylor",
        "tier": 5
      }
    ]
  },
  {
    "id": "last-court-file",
    "band": 7,
    "prompt": "Name a person whose prosecution or identification is documented by a court or an investigating agency.",
    "hint": "The deepest entries include a former Rwandan prime minister who entered guilty pleas and a US offender prosecuted for racist attacks.",
    "answers": [
      {
        "id": "ridgway",
        "tier": 1
      },
      {
        "id": "rader",
        "tier": 2
      },
      {
        "id": "samphan",
        "tier": 3
      },
      {
        "id": "charles-taylor",
        "tier": 4
      },
      {
        "id": "kambanda",
        "tier": 5
      },
      {
        "id": "joseph-franklin",
        "tier": 5
      }
    ]
  },
  {
    "id": "last-secret-project",
    "band": 7,
    "prompt": "Name a documented covert operation, military-research project, deception proposal, or weather experiment with an improbable premise.",
    "hint": "Work backward from the method: animal-borne incendiaries, a concealed seabed recovery, or remote-viewing experiments; a real project can still fail.",
    "answers": [
      {
        "id": "stormfury",
        "tier": 0
      },
      {
        "id": "stargate",
        "tier": 1
      },
      {
        "id": "azorian",
        "tier": 2
      },
      {
        "id": "acoustikitty",
        "tier": 3
      },
      {
        "id": "northwoods",
        "tier": 4
      },
      {
        "id": "project-xray",
        "tier": 5
      }
    ]
  },
  {
    "id": "last-unreal-world",
    "band": 7,
    "prompt": "Name an unsupported theory involving hidden planetary structure, extraordinary technology, or a mysterious place.",
    "hint": "A hollow celestial body, a supposedly teleported destroyer, and an ocean legend offer different starting points. The exact statement will decide the second check.",
    "answers": [
      {
        "id": "bermuda-triangle",
        "tier": 0
      },
      {
        "id": "lhc-doomsday",
        "tier": 1
      },
      {
        "id": "mars-doorway",
        "tier": 2
      },
      {
        "id": "philadelphia-experiment",
        "tier": 3
      },
      {
        "id": "hollow-earth",
        "tier": 4
      },
      {
        "id": "hollow-moon",
        "tier": 5
      }
    ]
  }
];
