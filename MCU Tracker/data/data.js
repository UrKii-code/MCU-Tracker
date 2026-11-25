// =========================================================
// MCU TRACKER - MASTER DATABASE
// Combines all MCU timeline data
// =========================================================

// Combine all MCU data files
const mcuTimeline = [
   ...infinityPart1,
   ...infinityPart2,
   ...infinityPart3,
   ...multiverseSaga,
   ...multiverseCollection,
   ...upcoming
];

// Automatically sort the entire list by timelineOrder
mcuTimeline.sort((a, b) => a.timelineOrder - b.timelineOrder);

console.log("MCU Timeline loaded:", mcuTimeline);
console.log("Total entries:", mcuTimeline.length);
