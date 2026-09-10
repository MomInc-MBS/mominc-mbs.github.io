export const BANKS = [
  [
    [
      "Does a short walk count toward your activity total?",
      [
        "Only if it lasts an hour",
        "Yes, short bouts add up",
        "Only if you walk in a gym"
      ],
      1,
      "Small amounts of activity add up across your week."
    ],
    [
      "Which routine is easier to repeat consistently?",
      [
        "Small, planned sessions that fit your week",
        "Every possible exercise in one day",
        "Changing the plan every hour"
      ],
      0,
      "A manageable schedule is easier to repeat."
    ],
    [
      "What should you establish before adding more weight?",
      [
        "Controlled technique",
        "A faster playlist",
        "The heaviest possible load"
      ],
      0,
      "Build control first, then increase the challenge gradually."
    ],
    [
      "What is useful to record in a workout log?",
      [
        "Only your shoes",
        "The exercises, repetitions, and weight used",
        "Only the gym playlist"
      ],
      1,
      "Recording what you did makes future sessions easier to compare."
    ],
    [
      "What is the role of recovery days?",
      [
        "They erase your progress",
        "They are only for beginners",
        "They give your body time to adapt"
      ],
      2,
      "Rest and easier days are part of training."
    ],
    [
      "Which choice keeps a comparison between workouts fair?",
      [
        "Changing every exercise",
        "Using a different movement each time",
        "Using consistent exercise technique"
      ],
      2,
      "Compare the same movement with a consistent technique."
    ]
  ],
  [
    [
      "Which example shows progressive overload?",
      [
        "Repeating the same easy workout forever",
        "Adding a little load or a few reps as you adapt",
        "Taking every set beyond your control"
      ],
      1,
      "Progressive overload gradually increases training demand as you adapt."
    ],
    [
      "Which record makes training progress easier to compare?",
      [
        "Playlist length",
        "Exercise, load, sets, and repetitions",
        "Gym lighting"
      ],
      1,
      "Sets, repetitions, and load describe the work you performed."
    ],
    [
      "Which approach best supports repeated heavy strength sets?",
      [
        "No rest at all",
        "Enough rest to recover, often 2–5 minutes",
        "Exactly 10 seconds between sets"
      ],
      1,
      "Heavy sets usually need longer recovery so you can maintain performance."
    ],
    [
      "What should stay consistent when comparing two lifts?",
      [
        "Nothing about the movement",
        "Only the music",
        "Exercise technique and range of motion"
      ],
      2,
      "Consistent technique makes comparisons more meaningful."
    ],
    [
      "Which matters more than a strict 30-minute protein window?",
      [
        "Eating only immediately after training",
        "Skipping meals on rest days",
        "Your total daily protein intake"
      ],
      2,
      "Overall daily intake matters more than hitting an exact post-workout minute."
    ],
    [
      "Which approach makes a training plan easier to review?",
      [
        "Track sessions over time",
        "Judge it by one unusually good repetition",
        "Never record the sessions"
      ],
      0,
      "A record of comparable sessions reveals more than one repetition."
    ]
  ],
  [
    [
      "A lifter adds load each week, but range of motion keeps shrinking. What best preserves meaningful progression?",
      [
        "Count any heavier lift as progress",
        "Keep technique and range consistent when comparing performance",
        "Shorten every repetition further"
      ],
      1,
      "A consistent movement standard makes training progress easier to evaluate."
    ],
    [
      "Which comparison best tracks strength progress?",
      [
        "More weight with much less range",
        "Two unrelated lifts",
        "The same lift and movement standard over time"
      ],
      2,
      "Keep the lift and movement standard consistent when comparing performance."
    ],
    [
      "Which statement about hypertrophy rep ranges is most accurate?",
      [
        "Only exactly 8 reps builds muscle",
        "A range of rep counts can build muscle when effort is sufficient",
        "Heavy sets cannot build muscle"
      ],
      1,
      "Muscle growth is possible across a range of rep counts; effort and the overall program matter."
    ],
    [
      "Which log distinguishes changes in load from changes in volume?",
      [
        "Gym visits alone",
        "Sets, repetitions, and load for each exercise",
        "A single workout rating"
      ],
      1,
      "Recording all three separates how heavy the load was from how much work you did."
    ],
    [
      "Why might a program include planned lower-intensity days?",
      [
        "To balance training demand with recovery",
        "Because adaptation stops after hard workouts",
        "To avoid ever progressing the workload"
      ],
      0,
      "Managing training demand and recovery helps make progression sustainable."
    ],
    [
      "Which record is most useful when judging a training trend?",
      [
        "One unusually good repetition",
        "A memory of one workout",
        "Several comparable training sessions"
      ],
      2,
      "Several comparable sessions give you a clearer view of the trend."
    ]
  ]
];
export function questionFor(level,hall,slot=0){return BANKS[level][hall*2+slot];}
