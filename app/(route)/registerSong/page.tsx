"use client";

import React, {
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react"; // 필요한 타입들을 임포트
import {
  useWriteContract,
  useReadContract,
  type UseReadContractReturnType,
} from "wagmi"; // wagmi 관련 타입 임포트
import {
  createPublicClient,
  http,
  type Address, // 이더리움 주소 타입을 임포트
  type PublicClient, // PublicClient 타입을 임포트
  type Abi, // ABI 타입을 임포트
  // BigInt 타입은 기본적으로 사용 가능
} from "viem";
import { sepolia } from "viem/chains";

// ABI 파일은 보통 별도의 타입 정의와 함께 제공됩니다.
// 여기서는 wagmi/viem에서 사용 가능한 형태로 임포트한다고 가정합니다.
// 실제 프로젝트에서는 wagmi CLI 등을 사용하여 ABI로부터 타입 정의를 생성하는 것을 강력히 권장합니다.
import { SongFactoryABI } from "@/public/abis/SongFactoryABI"; // SongFactoryABI의 타입도 함께 임포트
import { SongABI } from "@/public/abis/SongABI"; // SongABI의 타입도 함께 임포트

// 실제 SongFactory 컨트랙트 주소로 변경하세요.
const SONG_FACTORY_ADDRESS: Address =
  "0x99fc20754a02501d45e00455e470a8a3155d2784"; // Address 타입 명시

// RPC URL은 환경 변수로 관리하는 것이 좋습니다.
const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/Nb_H-LnqkqwPTvrxW0y0XOAPkm8zNOSF"; // 환경 변수 사용 예시

const TIER_LABELS: string[] = ["Free", "Rare", "SuperRare", "Seasonal"]; // string[] 타입 명시

interface TierOption {
  // TIER_OPTIONS 배열의 요소 타입을 위한 인터페이스 정의
  label: string;
  value: number;
}

const TIER_OPTIONS: TierOption[] = [
  // TierOption[] 타입 명시
  { label: "Free", value: 0 },
  { label: "Rare", value: 1 },
  { label: "SuperRare", value: 2 },
  // { label: "Seasonal", value: 3 } // Season 티어는 ABI에 없어서 주석 처리합니다. ABI에 맞게 수정하세요.
];

// Song 등록 폼의 상태 타입을 위한 인터페이스 정의
interface SongFormState {
  id: string; // Input value is string
  title: string;
  artist: string;
  tier: number; // Select value can be number after conversion
  duration: string; // Input value is string
  bpm: string; // Input value is string
  entranceFee: string; // Input value is string
  createdAt: string; // Input value is string (timestamp)
  gameVersion: string; // Input value is string
  nftRequired: string; // Input value is string (address)
}

// 등록된 곡 목록 아이템 타입을 위한 인터페이스 정의
interface SongListItem {
  address: Address; // 곡 컨트랙트 주소
  title: string; // 곡 제목
}

// 곡 상세 정보 타입을 위한 인터페이스 정의
// 실제 컨트랙트 ABI의 SongInfo 구조체나 개별 함수 반환 값에 맞게 조정해야 합니다.
// 여기서는 fetchSongDetail에서 불러오는 값들을 기반으로 정의합니다.
interface SongDetail {
  address: Address;
  title: string;
  artist: string;
  tier: number;
  duration: number; // number로 변환 후
  bpm: number; // number로 변환 후
  entranceFee: string; // BigInt.toString()
  createdAt: string; // BigInt.toString() (timestamp)
  gameVersion: number; // number로 변환 후
  nftRequired: string; // address 형태의 문자열
}

// SongDialog 컴포넌트의 props 타입을 위한 인터페이스 정의
interface SongDialogProps {
  open: boolean;
  onClose: () => void;
  songInfo: SongDetail | null; // songInfo는 SongDetail 타입이거나 null일 수 있음
}

// SongDialog 컴포넌트 (TSX)
function SongDialog({
  open,
  onClose,
  songInfo,
}: SongDialogProps): React.ReactElement | null {
  // props 타입 및 반환 타입 명시
  if (!open || !songInfo) return null;

  // TIER_LABELS 인덱스 접근 시 유효성 검사 추가
  const tierLabel =
    songInfo.tier in TIER_LABELS ? TIER_LABELS[songInfo.tier] : "Unknown Tier";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Close" // 접근성을 위한 aria-label 추가
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">
          {songInfo.title}
        </h2>
        <div className="space-y-2 text-gray-800 text-sm">
          {" "}
          {/* 글씨 크기 좀 줄임 */}
          <div>
            <span className="font-semibold">Artist:</span> {songInfo.artist}
          </div>
          <div>
            <span className="font-semibold">Tier:</span> {tierLabel}
          </div>{" "}
          {/* 유효성 검사 적용 */}
          <div>
            <span className="font-semibold">Duration:</span> {songInfo.duration}{" "}
            sec
          </div>
          <div>
            <span className="font-semibold">BPM:</span> {songInfo.bpm}
          </div>
          {/* wei 단위를 ETH 등으로 변환하여 보여주는 로직 추가 고려 */}
          <div>
            <span className="font-semibold">Entrance Fee (wei):</span>{" "}
            {songInfo.entranceFee}
          </div>
          {/* timestamp를 Date 객체로 변환 시 타입 안전성 고려 */}
          <div>
            <span className="font-semibold">Created At:</span>{" "}
            {new Date(Number(songInfo.createdAt) * 1000).toLocaleString()}
          </div>
          <div>
            <span className="font-semibold">Game Version:</span>{" "}
            {songInfo.gameVersion}
          </div>
          <div>
            <span className="font-semibold">NFT Required:</span>{" "}
            <span className="break-all">{songInfo.nftRequired}</span>
          </div>{" "}
          {/* 주소가 길 경우 줄바꿈 */}
          <div>
            <span className="font-semibold">Contract Address:</span>{" "}
            <span className="break-all text-indigo-500">
              {songInfo.address}
            </span>
          </div>{" "}
          {/* 주소가 길 경우 줄바꿈 */}
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트 (TSX)
export default function SongRegisterPage(): React.ReactElement {
  // 반환 타입 명시
  // useState 훅에 명시적으로 타입 지정
  const [form, setForm] = useState<SongFormState>({
    id: "",
    title: "",
    artist: "",
    tier: 0, // 기본값을 number로
    duration: "",
    bpm: "",
    entranceFee: "",
    createdAt: "",
    gameVersion: "",
    nftRequired: "", // 기본값을 빈 문자열로
  });

  const [songList, setSongList] = useState<SongListItem[]>([]); // SongListItem 배열 타입 명시
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false); // boolean 타입 명시
  const [selectedSong, setSelectedSong] = useState<SongDetail | null>(null); // SongDetail 또는 null 타입 명시
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false); // 상세 정보 로딩 상태 추가
  const [detailError, setDetailError] = useState<string | null>(null); // 상세 정보 에러 상태 추가

  // 곡 등록 트랜잭션
  // useWriteContract 훅의 타입을 명시 (ABI, functionName 등) - wagmi v2 기준
  const {
    data: writeTxHash, // 트랜잭션 해시 타입은 Address 또는 undefined
    writeContract,
    isPending: isWritePending, // 이름을 명확하게 변경
    error: writeError, // 이름을 명확하게 변경
  } = useWriteContract();

  // 곡 주소 목록 조회
  // useReadContract 훅의 타입을 명시
  const {
    data: songAddresses, // data 타입은 Address[] 또는 undefined
    refetch: refetchSongs,
    isLoading: isSongsLoading, // 이름을 명확하게 변경
    error: readError, // 이름을 명확하게 변경
  } = useReadContract({
    address: SONG_FACTORY_ADDRESS,
    abi: SongFactoryABI as Abi, // ABI 타입을 Abi로 캐스팅하거나, wagmi codegen으로 생성된 타입을 사용
    functionName: "getAllSongs", // 함수 이름은 ABI에 존재하는 이름이어야 함
    // args는 함수가 인자를 받는 경우에 지정
  });

  // Sepolia 체인에 대한 Public Client를 생성하는 함수 (재사용)
  // 함수 반환 타입으로 PublicClient 타입을 명시
  const getPublicClient = (): PublicClient => {
    // createPublicClient 함수는 viem에서 제공하는 클라이언트 객체를 반환
    return createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
  };

  // 곡 주소 목록이 업데이트될 때마다 각 곡의 제목을 가져옴
  useEffect(() => {
    // 로딩이 완료되었고, songAddresses가 비어있지 않은 유효한 배열인 경우에만 실행
    if (!isSongsLoading && Array.isArray(songAddresses)) {
      if (songAddresses.length === 0) {
        setSongList([]);
        return;
      }

      // 각 곡 주소에서 곡 정보 가져오기 (multicall 사용)
      const fetchSongTitles = async (addresses: Address[]) => {
        const client = getPublicClient();

        const calls = addresses.map((address) => ({
          address,
          abi: SongABI as Abi,
          functionName: "title",
        }));

        try {
          const results = await client.multicall({ contracts: calls });

          const updatedSongList: SongListItem[] = results.map(
            (result, index) => {
              const title =
                result.status === "success" &&
                result.result !== undefined &&
                result.result !== null
                  ? String(result.result) // title은 string 타입으로 가정
                  : "(제목 없음)";
              return {
                address: addresses[index],
                title: title,
              };
            }
          );
          setSongList(updatedSongList);
        } catch (e) {
          console.error("Failed to fetch song titles:", e);
          setSongList(
            addresses.map((address) => ({ address, title: "(불러오기 실패)" }))
          ); // 오류 발생 시 실패 표시
        }
      };

      // 로딩이 완료되고 유효한 배열일 때만 함수 호출
      fetchSongTitles(songAddresses);
    } else if (
      !isSongsLoading &&
      (!songAddresses || !Array.isArray(songAddresses))
    ) {
      // 로딩 완료되었지만, songAddresses가 undefined 또는 배열이 아닌 경우 (에러 상황일 가능성)
      console.error(
        "Finished loading but received unexpected data for song addresses:",
        songAddresses
      );
      setSongList([]); // 목록을 비워 오류 상태를 나타내거나 빈 목록 표시
    }
  }, [songAddresses, isSongsLoading]); // 의존성 배열 유지

  // 곡 상세 정보 불러오기 함수 (TSX)
  const fetchSongDetail = async (address: Address): Promise<void> => {
    // 매개변수 및 반환 타입 명시
    setIsDetailLoading(true); // 상세 정보 로딩 시작
    setDetailError(null); // 이전 에러 초기화
    setSelectedSong(null); // 이전 상세 정보 초기화

    const client = getPublicClient(); // 클라이언트 재사용

    // multicall 호출 정의 (ABI와 함수 이름을 정확히 지정)
    // GetFunctionReturnType를 사용하여 예상 반환 타입을 추론하거나 명시
    const calls: {
      address: Address;
      abi: Abi;
      functionName: string;
    }[] = [
      {
        address,
        abi: SongABI as Abi,
        functionName: "title",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "artist",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "tier",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "duration",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "bpm",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "entranceFee",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "createdAt",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "gameVersion",
      },
      {
        address,
        abi: SongABI as Abi,
        functionName: "nftRequired",
      },
    ];

    try {
      // multicall 실행
      const results = await client.multicall({ contracts: calls });

      // 결과 매핑 및 타입 검증 (각 result에 status와 result 속성이 있는지 확인)
      if (
        results.some(
          (result) =>
            result.status !== "success" ||
            result.result === undefined ||
            result.result === null
        )
      ) {
        throw new Error("Failed to fetch some song details."); // 일부 호출 실패 시 에러 발생
      }

      // 타입 안전하게 결과 추출 및 매핑
      const [
        titleResult,
        artistResult,
        tierResult,
        durationResult,
        bpmResult,
        entranceFeeResult,
        createdAtResult,
        gameVersionResult,
        nftRequiredResult,
      ] = results;

      setSelectedSong({
        address,
        title: String(titleResult.result), // string 타입으로 변환 보장
        artist: String(artistResult.result), // string 타입으로 변환 보장
        tier: Number(tierResult.result), // Number로 변환 보장
        duration: Number(durationResult.result), // Number로 변환 보장
        bpm: Number(bpmResult.result), // Number로 변환 보장
        // BigInt 타입을 string으로 변환
        entranceFee: (entranceFeeResult.result as bigint).toString(),
        createdAt: (createdAtResult.result as bigint).toString(), // createdAt도 bigint로 가정
        gameVersion: Number(gameVersionResult.result), // Number로 변환 보장
        nftRequired: String(nftRequiredResult.result) as Address, // Address 형태의 string으로 변환 보장
      });
      setIsDialogOpen(true); // 다이얼로그 열기
    } catch (e: any) {
      // 에러 타입을 any 또는 Error로 명시
      console.error("Failed to fetch song detail:", e);
      setDetailError(`상세 정보 불러오기 실패: ${e.message || String(e)}`); // 에러 메시지 설정
    } finally {
      setIsDetailLoading(false); // 로딩 종료
    }
  };

  // 폼 입력 핸들러 (TSX)
  // ChangeEvent 타입을 사용하고, input 또는 select 요소에 대한 이벤트를 처리함을 명시
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    // 매개변수 및 반환 타입 명시
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      // 'tier'와 같은 number 타입으로 저장될 필드를 여기서 바로 변환할 수도 있습니다.
      // 하지만 onSubmit에서 일괄 변환하는 것도 가능합니다. 여기서는 onSubmit에서 일괄 변환합니다.
      // 만약 input type="number"의 value를 number로 관리하고 싶다면 아래와 같이 할 수 있습니다.
      // [name]: type === 'number' ? Number(value) : value,
      [name]: value,
    }));
  };

  // 폼 제출 핸들러 (TSX)
  // FormEvent 타입을 사용하여 폼 제출 이벤트를 처리함을 명시
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    // 매개변수 및 반환 타입 명시
    e.preventDefault();

    // 폼 데이터 유효성 검사 (선택 사항이지만 실제 앱에서는 중요)
    // 예: 필수 필드가 비어있는지, 숫자가 유효한지 등

    // 컨트랙트 함수 인자에 맞게 폼 데이터를 변환
    // ABI에 명시된 타입에 따라 정확히 BigInt, number, string 등으로 변환해야 합니다.
    // SongFactoryABI의 createSong 함수의 인자 타입을 확인하세요.
    // 예: createSong(uint256 id, string title, string artist, uint8 tier, uint32 duration, uint32 bpm, uint256 entranceFee, uint256 createdAt, uint8 gameVersion, address nftRequired)
    try {
      // 입력 값 string을 정확한 타입 (BigInt, number)으로 변환
      const args = [
        BigInt(form.id), // uint256 -> BigInt
        form.title, // string -> string
        form.artist, // string -> string
        Number(form.tier), // uint8 -> number
        Number(form.duration), // uint32 -> number
        Number(form.bpm), // uint32 -> number
        BigInt(form.entranceFee), // uint256 -> BigInt
        BigInt(form.createdAt), // uint256 -> BigInt
        Number(form.gameVersion), // uint8 -> number
        form.nftRequired as Address, // address -> Address (string)
      ];

      // writeContract 호출
      writeContract(
        {
          address: SONG_FACTORY_ADDRESS,
          abi: SongFactoryABI as Abi, // ABI 타입 캐스팅
          functionName: "createSong", // 함수 이름 타입 명시
          args: args as any, // ABI에 맞는 정확한 args 타입을 추론하기 어렵다면 any로 캐스팅하거나, wagmi codegen 사용 권장
        },
        {
          onSuccess: (hash: Address) => {
            // onSuccess 콜백의 인자 타입은 트랜잭션 해시 (Address)
            console.log("Transaction sent:", hash);
            // 트랜잭션이 성공적으로 보내진 후 목록을 새로고침하고 폼을 초기화
            refetchSongs();
            setForm({
              id: "",
              title: "",
              artist: "",
              tier: 0,
              duration: "",
              bpm: "",
              entranceFee: "",
              createdAt: "",
              gameVersion: "",
              nftRequired: "",
            });
            // 사용자에게 알림 표시 (예: Toast)
            alert(`곡이 성공적으로 등록되었습니다! 트랜잭션 해시: ${hash}`);
          },
          onError: (err) => {
            // onError 콜백의 인자 타입은 Error
            console.error("Transaction error:", err);
            // 사용자에게 에러 알림 표시
            alert(`곡 등록 실패: ${err.message}`);
          },
        }
      );
    } catch (e: any) {
      console.error("Form data conversion error:", e);
      alert(`폼 데이터 변환 오류: ${e.message}`); // 사용자에게 변환 오류 알림
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-primary rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-foreground mb-6">Song 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input fields */}
        <div>
          <label
            htmlFor="id"
            className="block font-semibold text-gray-700 mb-1"
          >
            ID
          </label>
          <input
            type="number"
            id="id"
            name="id"
            value={form.id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="title"
            className="block font-semibold text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="artist"
            className="block font-semibold text-gray-700 mb-1"
          >
            Artist
          </label>
          <input
            type="text"
            id="artist"
            name="artist"
            value={form.artist}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="tier"
            className="block font-semibold text-gray-700 mb-1"
          >
            Tier
          </label>
          <select
            id="tier"
            name="tier"
            value={form.tier}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="duration"
            className="block font-semibold text-gray-700 mb-1"
          >
            Duration (sec)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="bpm"
            className="block font-semibold text-gray-700 mb-1"
          >
            BPM
          </label>
          <input
            type="number"
            id="bpm"
            name="bpm"
            value={form.bpm}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="entranceFee"
            className="block font-semibold text-gray-700 mb-1"
          >
            Entrance Fee (wei)
          </label>
          <input
            type="number"
            id="entranceFee"
            name="entranceFee"
            value={form.entranceFee}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="createdAt"
            className="block font-semibold text-gray-700 mb-1"
          >
            Created At (timestamp)
          </label>
          {/* Date/time picker 사용을 고려하세요 */}
          <input
            type="number"
            id="createdAt"
            name="createdAt"
            value={form.createdAt}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="gameVersion"
            className="block font-semibold text-gray-700 mb-1"
          >
            Game Version
          </label>
          <input
            type="number"
            id="gameVersion"
            name="gameVersion"
            value={form.gameVersion}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            required
          />
        </div>
        <div>
          <label
            htmlFor="nftRequired"
            className="block font-semibold text-gray-700 mb-1"
          >
            NFT Required (address)
          </label>
          <input
            type="text"
            id="nftRequired"
            name="nftRequired"
            value={form.nftRequired}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded text-gray-800"
            placeholder="0x..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isWritePending}
          className={`w-full py-2 rounded font-semibold transition ${
            isWritePending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {isWritePending ? "등록 중..." : "등록하기"}
        </button>

        {/* writeError는 트랜잭션 발생 후의 에러를 보여줍니다 */}
        {writeError && (
          <div className="text-red-600 mt-2">
            <p>트랜잭션 오류:</p>
            <p>{writeError.message}</p>
          </div>
        )}
      </form>

      <h3 className="text-xl font-bold mt-10 mb-4 text-gray-900">
        등록된 곡 목록
      </h3>
      {isSongsLoading ? (
        <div className="text-gray-600">곡 목록 불러오는 중...</div>
      ) : readError ? ( // 목록 조회 에러 표시
        <div className="text-red-600">
          목록 불러오기 실패: {readError.message}
        </div>
      ) : songList.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {songList.map((song) => (
            <li
              key={song.address}
              className="py-3 text-indigo-700 font-semibold cursor-pointer hover:underline flex justify-between items-center"
              onClick={() => fetchSongDetail(song.address)}
            >
              <span>{song.title}</span>
              {isDetailLoading &&
                selectedSong?.address === song.address && ( // 상세 정보 로딩 중일 때 로딩 스피너 등 표시 고려
                  <span className="text-xs text-gray-500 ml-2">
                    불러오는 중...
                  </span>
                )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500">아직 등록된 곡이 없습니다.</div>
      )}

      {/* 상세 정보 불러오기 에러 표시 */}
      {detailError && !isDetailLoading && (
        <div className="text-red-600 mt-4">
          <p>상세 정보 조회 오류:</p>
          <p>{detailError}</p>
        </div>
      )}

      {/* SongDialog 컴포넌트 사용 */}
      <SongDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        songInfo={selectedSong} // songInfo는 selectedSong 상태와 연결
      />
    </div>
  );
}
