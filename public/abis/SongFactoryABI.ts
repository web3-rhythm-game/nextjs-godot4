export const SongFactoryABI = [
  {
    inputs: [{ internalType: "address", name: "_gameCore", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint64", name: "id", type: "uint64" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "artist", type: "string" },
      { internalType: "enum Song.Tier", name: "tier", type: "uint8" },
      { internalType: "uint16", name: "duration", type: "uint16" },
      { internalType: "uint16", name: "bpm", type: "uint16" },
      { internalType: "uint128", name: "entranceFee", type: "uint128" },
      { internalType: "uint40", name: "createdAt", type: "uint40" },
      { internalType: "uint16", name: "gameVersion", type: "uint16" },
      { internalType: "address", name: "nftRequired", type: "address" },
    ],
    name: "createSong",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllSongs",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
];
